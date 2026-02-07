package api

import (
	"encoding/json"
	"net/http"
	"risk-monitor/backend/internal/core"
	"risk-monitor/backend/internal/store"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

type Server struct {
	Router   *chi.Mux
	WebRepo  core.WebsiteRepository
	ScanRepo core.ScanRepository
}

func NewServer(wr core.WebsiteRepository, sr core.ScanRepository) *Server {
	s := &Server{
		Router:   chi.NewRouter(),
		WebRepo:  wr,
		ScanRepo: sr,
	}
	s.mount()
	return s
}

func (s *Server) mount() {
	s.Router.Use(middleware.Logger)
	s.Router.Use(middleware.Recoverer)

	s.Router.Route("/api/v1", func(r chi.Router) {
		r.Get("/websites", s.handleGetWebsites)
		r.Post("/websites", s.handleCreateWebsite)
	})
}

func (s *Server) handleGetWebsites(w http.ResponseWriter, r *http.Request) {
	websites, err := s.WebRepo.GetAll(r.Context())
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	json.NewEncoder(w).Encode(websites)
}

func (s *Server) handleCreateWebsite(w http.ResponseWriter, r *http.Request) {
	var web core.Website
	if err := json.NewDecoder(r.Body).Decode(&web); err != nil {
		http.Error(w, err.Error(), 400)
		return
	}
	if err := s.WebRepo.Create(r.Context(), &web); err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	w.WriteHeader(http.StatusCreated)
}
