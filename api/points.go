package handler

import (
	"encoding/json"
	"net/http"

	"my-plots/pkg/auth"
	"my-plots/pkg/db"
	"my-plots/pkg/models"
)

func PointsHandler(w http.ResponseWriter, r *http.Request) {
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

	user, err := models.GetOrCreateUser(pool, sub, "")
	if err != nil {
		http.Error(w, "user error: "+err.Error(), http.StatusInternalServerError)
		return
	}

	switch r.Method {
	case http.MethodPost:
		var body struct {
			PlotID string  `json:"plot_id"`
			Date   string  `json:"date"`
			Value  float64 `json:"value"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, "invalid body", http.StatusBadRequest)
			return
		}
		if body.PlotID == "" || body.Date == "" {
			http.Error(w, "plot_id and date are required", http.StatusBadRequest)
			return
		}
		// Verify plot ownership
		_, err := models.GetPlot(pool, body.PlotID, user.ID)
		if err != nil {
			http.Error(w, "plot not found", http.StatusNotFound)
			return
		}
		point, err := models.CreatePoint(pool, body.PlotID, body.Date, body.Value)
		if err != nil {
			http.Error(w, "create error: "+err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(point)

	case http.MethodDelete:
		pointID := r.URL.Query().Get("id")
		if pointID == "" {
			http.Error(w, "id is required", http.StatusBadRequest)
			return
		}
		if err := models.DeletePoint(pool, pointID, user.ID); err != nil {
			http.Error(w, "delete error: "+err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"status": "deleted"})

	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}
