package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHealthHandler(t *testing.T) {
	// Crear un request simulado
	req, err := http.NewRequest("GET", "/api/health", nil)
	if err != nil {
		t.Fatal(err)
	}

	// Crear un ResponseRecorder para capturar la respuesta
	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(HealthHandler)

	// Ejecutar el handler
	handler.ServeHTTP(rr, req)

	// Verificar el status code
	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler devolvió status code incorrecto: got %v want %v",
			status, http.StatusOK)
	}

	// Verificar el Content-Type
	expected := "application/json"
	if ct := rr.Header().Get("Content-Type"); ct != expected {
		t.Errorf("handler devolvió content-type incorrecto: got %v want %v",
			ct, expected)
	}

	// Verificar la estructura de la respuesta
	var response HealthResponse
	if err := json.Unmarshal(rr.Body.Bytes(), &response); err != nil {
		t.Errorf("No se pudo parsear la respuesta JSON: %v", err)
	}

	// Verificar los campos de la respuesta
	if response.Status != "ok" {
		t.Errorf("Status incorrecto: got %v want %v", response.Status, "ok")
	}

	if response.Message == "" {
		t.Error("Message no debe estar vacío")
	}

	if response.Timestamp.IsZero() {
		t.Error("Timestamp no debe estar vacío")
	}

	// Database puede ser "connected" o "disconnected"
	if response.Database != "connected" && response.Database != "disconnected" {
		t.Errorf("Database status inesperado: got %v", response.Database)
	}
}
