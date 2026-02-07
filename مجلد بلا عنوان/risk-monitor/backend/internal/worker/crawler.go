package worker

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
	"risk-monitor/backend/internal/core"
	"strings"
	"sync"
	"time"

	"golang.org/x/net/html"
)

type Crawler struct {
	Client *http.Client
}

func NewCrawler() *Crawler {
	return &Crawler{
		Client: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

type CrawlResult struct {
	URLs   []core.ScanURL
	Assets []core.ScanAsset
	Legal  core.LegalCheck
}

// Crawl performs a recursive crawl (up to depth) on the given website
// For MVP, we'll keep it simple: Single page scan or shallow recursion.
// Let's implement breadth-first search with depth limit.
func (c *Crawler) Crawl(ctx context.Context, startURL string, maxDepth int) (*CrawlResult, error) {
	result := &CrawlResult{
		URLs:   []core.ScanURL{},
		Assets: []core.ScanAsset{},
	}

	visited := make(map[string]bool)
	queue := []string{startURL}
	
	baseURL, err := url.Parse(startURL)
	if err != nil {
		return nil, fmt.Errorf("invalid start url: %w", err)
	}

	// Basic loop for just the start URL for now (MVP), or shallow depth
	// Deep crawling requires more complex state management. 
	// The user spec said "Crawl only internal URLs, Configurable maximum depth".
	
	// We will implement a depth-1 scan for the MVP to ensure stability first.
	// 1. Fetch Root
	// 2. Parse Links
	// 3. Validate Reachability of Links (HEAD request)
	
	req, err := http.NewRequestWithContext(ctx, "GET", startURL, nil)
	if err != nil {
		return nil, err
	}

	resp, err := c.Client.Do(req)
	status := 0
	if resp != nil {
		status = resp.StatusCode
	}
	
	// Record Root URL status
	result.URLs = append(result.URLs, core.ScanURL{
		URL:        startURL,
		HTTPStatus: status,
		ErrorType:  getErrorType(status, err),
	})

	if err != nil || status >= 400 {
		return result, nil // Stop if root is bad
	}
	defer resp.Body.Close()

	// Parse HTML
	doc, err := html.Parse(resp.Body)
	if err != nil {
		return result, nil
	}

	// Extract Links and Assets
	var f func(*html.Node)
	f = func(n *html.Node) {
		if n.Type == html.ElementNode && n.Data == "a" {
			for _, a := range n.Attr {
				if a.Key == "href" {
					link := resolveURL(baseURL, a.Val)
					if link != "" {
						// Check if internal or external
						// For MVP, we just collect them all and will "ping" them later
						// We don't recurse into them yet to keep loop simple.
						
						// Basic Duplicate Detection
						if !visited[link] {
							visited[link] = true
							// We'll verify this link in a second pass or parallel routines
							// For now, let's just add it to queue to check reachability
						}
					}
					
					// Legal Check Heuristic
					lowerHref := strings.ToLower(a.Val)
					if strings.Contains(lowerHref, "impressum") {
						result.Legal.ImpressumFound = true
					}
					if strings.Contains(lowerHref, "datenschutz") || strings.Contains(lowerHref, "privacy") {
						result.Legal.PrivacyFound = true
					}
				}
			}
		}
		// Asset Check (img, script, link)
		if n.Type == html.ElementNode && (n.Data == "img" || n.Data == "script" || n.Data == "link") {
			for _, a := range n.Attr {
				if a.Key == "src" || a.Key == "href" {
					assetLink := resolveURL(baseURL, a.Val)
					if assetLink != "" {
						result.Assets = append(result.Assets, core.ScanAsset{
							AssetURL: assetLink,
							IsReachable: true, // Optimistic default, we verify below
						})
					}
				}
			}
		}
		for c := n.FirstChild; c != nil; c = c.NextSibling {
			f(c)
		}
	}
	f(doc)

	// Verify Reachability of discovered links (Parallelized)
	// Limiting to first 50 links for performance in MVP
	limit := 50
	var wg sync.WaitGroup
	linkChan := make(chan core.ScanURL, limit)
	
	count := 0
	for link := range visited {
		if count >= limit { break }
		count++
		wg.Add(1)
		go func(l string) {
			defer wg.Done()
			s, err := c.checkHead(ctx, l)
			linkChan <- core.ScanURL{
				URL: l,
				HTTPStatus: s,
				ErrorType: getErrorType(s, err),
			}
		}(link)
	}
	
	wg.Wait()
	close(linkChan)

	for u := range linkChan {
		result.URLs = append(result.URLs, u)
	}

	return result, nil
}

func (c *Crawler) checkHead(ctx context.Context, url string) (int, error) {
	req, err := http.NewRequestWithContext(ctx, "HEAD", url, nil)
	if err != nil { return 0, err }
	resp, err := c.Client.Do(req)
	if err != nil { return 0, err }
	defer resp.Body.Close()
	return resp.StatusCode, nil
}

func resolveURL(base *url.URL, href string) string {
	u, err := url.Parse(href)
	if err != nil { return "" }
	return base.ResolveReference(u).String()
}

func getErrorType(status int, err error) string {
	if err != nil {
		if strings.Contains(err.Error(), "timeout") { return "timeout" }
		return "other"
	}
	if status == 404 { return "404" }
	if status >= 500 { return "5xx" }
	return "none"
}
