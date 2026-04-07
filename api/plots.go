package handler

import (
	"encoding/json"
	"net/http"

	"my-plots/pkg/auth"
	"my-plots/pkg/db"
	"my-plots/pkg/models"
)

func PlotsHandler(w http.ResponseWriter, r *http.Request) {
	sub, _, err := auth.ValidateRequest(r)
	if err != nil {
		http.Error(w, "unauthorized: "+err.Error(), http.StatusUnauthorized)
		return
	}

	pool, err := db.GetDB()
	if err != nil {
		http.Error(w, "db error: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Get user ID
	user, err := models.GetOrCreateUser(pool, sub, "")
	if err != nil {
		http.Error(w, "user error: "+err.Error(), http.StatusInternalServerError)
		return
	}

	switch r.Method {
	case http.MethodGet:
		plotID := r.URL.Query().Get("id")
		if plotID != "" {
			plot, err := models.GetPlot(pool, plotID, user.ID)
			if err != nil {
				http.Error(w, "not found", http.StatusNotFound)
				return
			}
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(plot)
		} else {
			plots, err := models.ListPlots(pool, user.ID)
			if err != nil {
				http.Error(w, "list error: "+err.Error(), http.StatusInternalServerError)
				return
			}
			if plots == nil {
				plots = []models.Plot{}
			}
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(plots)
		}

	case http.MethodPost:
		var body struct {
			Name       string `json:"name"`
			YAxisLabel string `json:"y_axis_label"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, "invalid body", http.StatusBadRequest)
			return
		}
		if body.Name == "" {
			http.Error(w, "name is required", http.StatusBadRequest)
			return
		}
		plot, err := models.CreatePlot(pool, user.ID, body.Name, body.YAxisLabel)
		if err != nil {
			http.Error(w, "create error: "+err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(plot)

	case http.MethodPatch:
		var update models.PlotUpdate
		if err := json.NewDecoder(r.Body).Decode(&update); err != nil {
			http.Error(w, "invalid body", http.StatusBadRequest)
			return
		}
		if update.ID == "" {
			http.Error(w, "id is required", http.StatusBadRequest)
			return
		}
		plot, err := models.UpdatePlot(pool, user.ID, update)
		if err != nil {
			http.Error(w, "update error: "+err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(plot)

	case http.MethodDelete:
		plotID := r.URL.Query().Get("id")
		if plotID == "" {
			http.Error(w, "id is required", http.StatusBadRequest)
			return
		}
		if err := models.DeletePlot(pool, plotID, user.ID); err != nil {
			http.Error(w, "delete error: "+err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "deleted"})

	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}
