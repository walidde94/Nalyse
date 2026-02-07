package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"risk-monitor/backend/internal/api"
	"risk-monitor/backend/internal/config"
	"risk-monitor/backend/internal/store"
)

func main() {
	cfg := config.LoadConfig()

	// 1. Connect to DB
	dbPool, err := store.NewDB(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to DB: %v", err)
	}
	defer dbPool.Close()

	// 2. Setup Services
	webRepo := store.NewWebsiteRepo(dbPool)
	scanRepo := store.NewScanRepo(dbPool)
	
	// 3. Setup Server
	srv := api.NewServer(webRepo, scanRepo)

	// 4. Start Server
	server := &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: srv.Router,
	}

	go func() {
		log.Printf("Starting server on port %s", cfg.Port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server error: %v", err)
		}
	}()

	// 5. Graceful Shutdown
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
	<-stop

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	server.Shutdown(ctx)
}
