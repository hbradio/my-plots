package handler

import (
	"encoding/json"
	"net/http"

	"my-plots/pkg/auth"
	"my-plots/pkg/db"
	"my-plots/pkg/models"
)

func UserHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	sub, accessToken, err := auth.ValidateRequest(r)
	if err != nil {
		http.Error(w, "unauthorized: "+err.Error(), http.StatusUnauthorized)
		return
	}

	pool, err := db.GetDB()
	if err != nil {
		http.Error(w, "db error: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Try to get existing user first
	user, err := models.GetOrCreateUser(pool, sub, "")
	if err != nil {
		http.Error(w, "user error: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// If no email yet, fetch from Auth0
	if user.Email == "" {
		email, err := auth.FetchUserEmail(accessToken)
		if err == nil && email != "" {
			pool.Exec("UPDATE users SET email = $1 WHERE auth0_id = $2", email, sub)
			user.Email = email
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}
