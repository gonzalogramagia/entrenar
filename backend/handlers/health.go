package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/goalritmo/gym/backend/database"
)

// HealthResponse representa la respuesta del health check
type HealthResponse struct {
	Status    string    `json:"status"`
	Message   string    `json:"message"`
	Timestamp time.Time `json:"timestamp"`
	Database  string    `json:"database"`
}

// HealthHandler maneja el health check del servidor
func HealthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	response := HealthResponse{
		Status:    "ok",
		    Message:   "Entrenar API funcionando correctamente",
		Timestamp: time.Now(),
		Database:  "disconnected",
	}

	// Verificar conexión con la base de datos
	if database.DB != nil {
		if err := database.DB.Ping(); err == nil {
			response.Database = "connected"
		}
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}
