package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gorilla/mux"
	"github.com/gonzagramaglia/entrenar/backend/models"
)

// mockRequest simula una request con autenticación
func mockRequest(method, url string, body interface{}) (*http.Request, error) {
	var bodyReader *bytes.Buffer
	if body != nil {
		bodyBytes, _ := json.Marshal(body)
		bodyReader = bytes.NewBuffer(bodyBytes)
	} else {
		bodyReader = bytes.NewBuffer([]byte{})
	}

	req, err := http.NewRequest(method, url, bodyReader)
	if err != nil {
		return nil, err
	}

	// Simular autenticación agregando user_id al contexto
	ctx := context.WithValue(req.Context(), "user_id", "test_user_id")
	req = req.WithContext(ctx)
	req.Header.Set("Content-Type", "application/json")

	return req, nil
}

func TestCreateWorkoutHandler_ValidInput(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping test that requires database")
	}

	weight := 80.5
	reps := 10
	set := 1
	seconds := 45

	workoutData := models.CreateWorkoutRequest{
		ExerciseID:   1,
		Weight:       &weight,
		Reps:         &reps,
		Set:          &set,
		Seconds:      &seconds,
		Observations: "Buena ejecución",
	}

	req, err := mockRequest("POST", "/api/workouts", workoutData)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(CreateWorkoutHandler)

	// Nota: Este test fallará sin una conexión real a la DB
	handler.ServeHTTP(rr, req)

	// Verificar que no haya errores de parseo JSON
	if rr.Code == http.StatusBadRequest {
		t.Logf("Response body: %s", rr.Body.String())
		if strings.Contains(rr.Body.String(), "JSON inválido") {
			t.Error("El JSON debería ser válido")
		}
	}
}

func TestCreateWorkoutHandler_InvalidWeight(t *testing.T) {
	negativeWeight := -10.0
	reps := 10

	workoutData := models.CreateWorkoutRequest{
		ExerciseID: 1,
		Weight:     &negativeWeight,
		Reps:       &reps,
	}

	req, err := mockRequest("POST", "/api/workouts", workoutData)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(CreateWorkoutHandler)

	handler.ServeHTTP(rr, req)

	// Debería retornar error por peso inválido
	if rr.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400, got %d", rr.Code)
	}

	if !strings.Contains(rr.Body.String(), "Peso") {
		t.Error("El error debería mencionar el peso")
	}
}

func TestCreateWorkoutHandler_InvalidReps(t *testing.T) {
	weight := 80.5
	reps := -1

	workoutData := models.CreateWorkoutRequest{
		ExerciseID: 1,
		Weight:     &weight,
		Reps:       &reps,
	}

	req, err := mockRequest("POST", "/api/workouts", workoutData)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(CreateWorkoutHandler)

	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400, got %d", rr.Code)
	}

	if !strings.Contains(rr.Body.String(), "Repeticiones") {
		t.Error("El error debería mencionar las repeticiones")
	}
}

func TestCreateWorkoutHandler_InvalidJSON(t *testing.T) {
	req, err := http.NewRequest("POST", "/api/workouts", strings.NewReader(`{"invalid": json}`))
	if err != nil {
		t.Fatal(err)
	}

	ctx := context.WithValue(req.Context(), "user_id", "test_user_id")
	req = req.WithContext(ctx)
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(CreateWorkoutHandler)

	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400, got %d", rr.Code)
	}

	if !strings.Contains(rr.Body.String(), "JSON inválido") {
		t.Error("Debería indicar que el JSON es inválido")
	}
}

func TestUpdateWorkoutHandler_ValidInput(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping test that requires database")
	}

	weight := 85.0
	reps := 12

	workoutData := models.CreateWorkoutRequest{
		ExerciseID: 1,
		Weight:     &weight,
		Reps:       &reps,
	}

	req, err := mockRequest("PUT", "/api/workouts/1", workoutData)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()

	router := mux.NewRouter()
	router.HandleFunc("/api/workouts/{id}", UpdateWorkoutHandler).Methods("PUT")

	router.ServeHTTP(rr, req)

	// Sin DB real, esperamos error 500 o 404, pero no 400 (bad request)
	if rr.Code == http.StatusBadRequest {
		t.Logf("Response: %s", rr.Body.String())
		if strings.Contains(rr.Body.String(), "JSON inválido") {
			t.Error("El JSON debería ser válido")
		}
	}
}

func TestUpdateWorkoutHandler_InvalidID(t *testing.T) {
	weight := 85.0
	reps := 12

	workoutData := models.CreateWorkoutRequest{
		ExerciseID: 1,
		Weight:     &weight,
		Reps:       &reps,
	}

	req, err := mockRequest("PUT", "/api/workouts/invalid_id", workoutData)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()

	router := mux.NewRouter()
	router.HandleFunc("/api/workouts/{id}", UpdateWorkoutHandler).Methods("PUT")

	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400 for invalid ID, got %d", rr.Code)
	}
}

func TestDeleteWorkoutHandler_ValidID(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping test that requires database")
	}

	req, err := mockRequest("DELETE", "/api/workouts/1", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()

	router := mux.NewRouter()
	router.HandleFunc("/api/workouts/{id}", DeleteWorkoutHandler).Methods("DELETE")

	router.ServeHTTP(rr, req)

	// Sin DB real, esperamos 404 o 500, pero no 400
	if rr.Code == http.StatusBadRequest {
		t.Error("ID válido no debería dar BadRequest")
	}
}

func TestDeleteWorkoutHandler_InvalidID(t *testing.T) {
	req, err := mockRequest("DELETE", "/api/workouts/abc", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()

	router := mux.NewRouter()
	router.HandleFunc("/api/workouts/{id}", DeleteWorkoutHandler).Methods("DELETE")

	router.ServeHTTP(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400 for invalid ID, got %d", rr.Code)
	}
}
