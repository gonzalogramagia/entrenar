package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gonzagramaglia/entrenate/backend/database"
	"github.com/gonzagramaglia/entrenate/backend/models"
)

// TestEndToEndWorkoutFlow prueba el flujo completo de un workout
func TestEndToEndWorkoutFlow(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	// Verificar que la DB esté configurada para tests
	if database.DB == nil {
		t.Skip("Database not configured for tests")
	}

	weight := 80.5
	reps := 10
	set := 1

	t.Run("Create workout", func(t *testing.T) {
		workoutData := models.CreateWorkoutRequest{
			ExerciseID:   1,
			Weight:       &weight,
			Reps:         &reps,
			Set:          &set,
			Observations: "Test workout",
		}

		body, _ := json.Marshal(workoutData)
		req, _ := http.NewRequest("POST", "/api/workouts", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")

		// Agregar contexto de usuario
		ctx := context.WithValue(req.Context(), "user_id", "test_user_integration")
		req = req.WithContext(ctx)

		rr := httptest.NewRecorder()
		handler := http.HandlerFunc(CreateWorkoutHandler)

		handler.ServeHTTP(rr, req)

		t.Logf("Create workout response: %d - %s", rr.Code, rr.Body.String())
	})

	t.Run("Get workouts", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/api/workouts", nil)
		ctx := context.WithValue(req.Context(), "user_id", "test_user_integration")
		req = req.WithContext(ctx)

		rr := httptest.NewRecorder()
		handler := http.HandlerFunc(GetWorkoutsHandler)

		handler.ServeHTTP(rr, req)

		t.Logf("Get workouts response: %d - %s", rr.Code, rr.Body.String())
	})
}

// BenchmarkCreateWorkout mide la performance del endpoint
func BenchmarkCreateWorkout(b *testing.B) {
	weight := 80.5
	reps := 10

	workoutData := models.CreateWorkoutRequest{
		ExerciseID: 1,
		Weight:     &weight,
		Reps:       &reps,
	}

	body, _ := json.Marshal(workoutData)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		req, _ := http.NewRequest("POST", "/api/workouts", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		ctx := context.WithValue(req.Context(), "user_id", "bench_user")
		req = req.WithContext(ctx)

		rr := httptest.NewRecorder()
		handler := http.HandlerFunc(CreateWorkoutHandler)

		handler.ServeHTTP(rr, req)
	}
}

// TestConcurrentRequests prueba concurrencia
func TestConcurrentRequests(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping concurrent test")
	}

	numRequests := 10
	done := make(chan bool, numRequests)

	for i := 0; i < numRequests; i++ {
		go func(id int) {
			req, _ := http.NewRequest("GET", "/api/health", nil)
			rr := httptest.NewRecorder()
			handler := http.HandlerFunc(HealthHandler)

			handler.ServeHTTP(rr, req)

			if rr.Code != http.StatusOK {
				t.Errorf("Request %d failed with status %d", id, rr.Code)
			}
			done <- true
		}(i)
	}

	for i := 0; i < numRequests; i++ {
		<-done
	}
}
