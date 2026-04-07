package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/joho/godotenv"
	"github.com/rs/cors"

	handler "my-plots/api"
)

func main() {
	godotenv.Load()

	mux := http.NewServeMux()
	mux.HandleFunc("/api/health", handler.HealthHandler)
	mux.HandleFunc("/api/user", handler.UserHandler)
	mux.HandleFunc("/api/plots", handler.PlotsHandler)
	mux.HandleFunc("/api/points", handler.PointsHandler)

	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5179"},
		AllowedMethods:   []string{"GET", "POST", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Authorization", "Content-Type"},
		AllowCredentials: true,
	})

	addr := ":8089"
	fmt.Printf("API server listening on %s\n", addr)
	log.Fatal(http.ListenAndServe(addr, c.Handler(mux)))
}
