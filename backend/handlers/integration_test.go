package handlers

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/goalritmo/gym/backend/database"
	"github.com/goalritmo/gym/backend/models"
)

// MockDB simula una base de datos para testing
type MockDB struct {
	workouts []models.Workout
	nextID   int
}

func (m *MockDB) Query(query string, args ...interface{}) (*sql.Rows, error) {
	// Implementación simplificada para tests
	return nil, sql.ErrNoRows
}

func (m *MockDB) QueryRow(query string, args ...interface{}) *sql.Row {
	// Para tests, retornamos una implementación que simula datos
	return nil
}

func (m *MockDB) Exec(query string, args ...interface{}) (sql.Result, error) {
	// Simular una ejecución exitosa
	return &mockResult{rowsAffected: 1}, nil
}

type mockResult struct {
	rowsAffected int64
}

func (m *mockResult) LastInsertId() (int64, error) {
	return 1, nil
}

func (m *mockResult) RowsAffected() (int64, error) {
	return m.rowsAffected, nil
}

// TestEndToEndWorkoutFlow prueba el flujo completo de un workout
func TestEndToEndWorkoutFlow(t *testing.T) {
	// Nota: Este test requiere una base de datos de prueba real
	// En producción usarías Docker con PostgreSQL o una DB en memoria

	if testing.Short() {
		t.Skip("Skipping integration test")
	}

	// Verificar que la DB esté configurada para tests
	if database.DB == nil {
		t.Skip("Database not configured for tests")
	}

	t.Run("Create workout", func(t *testing.T) {
		workoutData := models.CreateWorkoutRequest{
			ExerciseID:   1,
			Weight:       80.5,
			Reps:         10,
			Serie:        intPtr(1),
			Observations: stringPtr("Test workout"),
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

		// En un test real, verificarías que se creó correctamente
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
	workoutData := models.CreateWorkoutRequest{
		ExerciseID: 1,
		Weight:     80.5,
		Reps:       10,
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

	// Esperar que todas las requests terminen
	for i := 0; i < numRequests; i++ {
		<-done
	}
}
