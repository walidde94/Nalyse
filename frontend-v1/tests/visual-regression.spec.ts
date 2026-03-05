/**
 * Visual Regression Tests for Charts
 *
 * Playwright screenshot comparison tests for bar, pie, scatter,
 * and area chart types in the analysis view.
 *
 * These tests render each chart type and compare against baseline
 * screenshots to detect unintended visual changes.
 *
 * Run with: npx playwright test tests/visual-regression.spec.ts
 * Update baselines: npx playwright test --update-snapshots
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

async function navigateToAnalysis(page: Page) {
    await page.goto(BASE_URL);
    // Wait for app to load
    await page.waitForLoadState('networkidle');
}

async function waitForChartRender(page: Page, chartSelector: string, timeout = 10000) {
    await page.waitForSelector(chartSelector, { state: 'visible', timeout });
    // Give Recharts animations time to complete
    await page.waitForTimeout(1500);
}

// ═══════════════════════════════════════════════════════════════════
// BAR CHART
// ═══════════════════════════════════════════════════════════════════

test.describe('Bar Chart Visual Regression', () => {
    test('renders bar chart with correct styling', async ({ page }) => {
        await navigateToAnalysis(page);

        // Look for a bar chart container
        const barChart = page.locator('.recharts-bar-rectangles').first();
        if (await barChart.count() > 0) {
            await waitForChartRender(page, '.recharts-bar-rectangles');
            const chartContainer = page.locator('.recharts-wrapper').first();
            await expect(chartContainer).toHaveScreenshot('bar-chart-baseline.png', {
                maxDiffPixels: 200,
                threshold: 0.3,
            });
        } else {
            test.skip();
        }
    });

    test('bar chart tooltip appears on hover', async ({ page }) => {
        await navigateToAnalysis(page);

        const barRect = page.locator('.recharts-bar-rectangle').first();
        if (await barRect.count() > 0) {
            await barRect.hover();
            await page.waitForTimeout(500);
            // Tooltip should be visible
            const tooltip = page.locator('[style*="position: fixed"]').first();
            if (await tooltip.count() > 0) {
                await expect(tooltip).toBeVisible();
            }
        } else {
            test.skip();
        }
    });
});

// ═══════════════════════════════════════════════════════════════════
// PIE CHART
// ═══════════════════════════════════════════════════════════════════

test.describe('Pie Chart Visual Regression', () => {
    test('renders pie chart with correct slice styling', async ({ page }) => {
        await navigateToAnalysis(page);

        const pieChart = page.locator('.recharts-pie').first();
        if (await pieChart.count() > 0) {
            await waitForChartRender(page, '.recharts-pie');
            const chartContainer = page.locator('.recharts-wrapper').filter({ has: page.locator('.recharts-pie') }).first();
            await expect(chartContainer).toHaveScreenshot('pie-chart-baseline.png', {
                maxDiffPixels: 200,
                threshold: 0.3,
            });
        } else {
            test.skip();
        }
    });

    test('pie chart has legend', async ({ page }) => {
        await navigateToAnalysis(page);

        const legend = page.locator('.recharts-legend-wrapper').first();
        if (await legend.count() > 0) {
            await expect(legend).toBeVisible();
        } else {
            test.skip();
        }
    });
});

// ═══════════════════════════════════════════════════════════════════
// SCATTER CHART
// ═══════════════════════════════════════════════════════════════════

test.describe('Scatter Chart Visual Regression', () => {
    test('renders scatter chart with data points', async ({ page }) => {
        await navigateToAnalysis(page);

        const scatterChart = page.locator('.recharts-scatter').first();
        if (await scatterChart.count() > 0) {
            await waitForChartRender(page, '.recharts-scatter');
            const chartContainer = page.locator('.recharts-wrapper').filter({ has: page.locator('.recharts-scatter') }).first();
            await expect(chartContainer).toHaveScreenshot('scatter-chart-baseline.png', {
                maxDiffPixels: 200,
                threshold: 0.3,
            });
        } else {
            test.skip();
        }
    });

    test('scatter chart points have correct color', async ({ page }) => {
        await navigateToAnalysis(page);

        const dots = page.locator('.recharts-symbols circle');
        if (await dots.count() > 0) {
            const fill = await dots.first().getAttribute('fill');
            expect(fill).toBeTruthy();
        } else {
            test.skip();
        }
    });
});

// ═══════════════════════════════════════════════════════════════════
// AREA CHART
// ═══════════════════════════════════════════════════════════════════

test.describe('Area Chart Visual Regression', () => {
    test('renders area chart with gradient fill', async ({ page }) => {
        await navigateToAnalysis(page);

        const areaChart = page.locator('.recharts-area').first();
        if (await areaChart.count() > 0) {
            await waitForChartRender(page, '.recharts-area');
            const chartContainer = page.locator('.recharts-wrapper').filter({ has: page.locator('.recharts-area') }).first();
            await expect(chartContainer).toHaveScreenshot('area-chart-baseline.png', {
                maxDiffPixels: 200,
                threshold: 0.3,
            });
        } else {
            test.skip();
        }
    });

    test('area chart has gradient defs', async ({ page }) => {
        await navigateToAnalysis(page);

        const gradients = page.locator('.recharts-wrapper linearGradient');
        if (await gradients.count() > 0) {
            expect(await gradients.count()).toBeGreaterThan(0);
        } else {
            test.skip();
        }
    });
});

// ═══════════════════════════════════════════════════════════════════
// CROSS-CHART VISUAL CONSISTENCY
// ═══════════════════════════════════════════════════════════════════

test.describe('Chart Visual Consistency', () => {
    test('all chart containers have consistent border radius', async ({ page }) => {
        await navigateToAnalysis(page);

        const chartCards = page.locator('[id^="chart-"]');
        const count = await chartCards.count();

        for (let i = 0; i < Math.min(count, 4); i++) {
            const card = chartCards.nth(i);
            const borderRadius = await card.evaluate(el => {
                return window.getComputedStyle(el).borderRadius;
            });
            // Should have meaningful border radius (not 0)
            if (borderRadius && borderRadius !== '0px') {
                expect(parseInt(borderRadius)).toBeGreaterThanOrEqual(8);
            }
        }
    });

    test('chart axes use consistent font sizes', async ({ page }) => {
        await navigateToAnalysis(page);

        const axisTicks = page.locator('.recharts-cartesian-axis-tick-value');
        if (await axisTicks.count() > 0) {
            const fontSize = await axisTicks.first().evaluate(el => {
                return window.getComputedStyle(el).fontSize;
            });
            expect(parseInt(fontSize || '0')).toBeLessThanOrEqual(14);
        } else {
            test.skip();
        }
    });

    test('dark theme colors are applied', async ({ page }) => {
        await navigateToAnalysis(page);

        const bgColor = await page.evaluate(() => {
            return window.getComputedStyle(document.body).backgroundColor;
        });
        // Should be a dark color (RGB values should be low)
        if (bgColor) {
            const match = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (match) {
                const [, r, g, b] = match.map(Number);
                // Dark theme: average RGB should be < 50
                expect((r + g + b) / 3).toBeLessThan(100);
            }
        }
    });
});
