package handlers

import (
	"testing"

	"github.com/goalritmo/gym/backend/models"
	"github.com/goalritmo/gym/backend/testutils"
)

// TestWorkoutHandlersWithUtilities demuestra cómo usar las utilities de testing
func TestWorkoutHandlersWithUtilities(t *testing.T) {
	// Configurar base de datos de testing
	testutils.SetupTestDatabase(t)
	testutils.VerifyDatabaseSchema(t)

	// Crear suite de testing
	suite := testutils.NewAPITestSuite(t)
	mockData := testutils.NewMockData()

	// Configurar rutas
	suite.Router.HandleFunc("/api/workouts", GetWorkoutsHandler).Methods("GET")
	suite.Router.HandleFunc("/api/workouts", CreateWorkoutHandler).Methods("POST")
	suite.Router.HandleFunc("/api/health", HealthHandler).Methods("GET")

	t.Run("Health endpoint should work", func(t *testing.T) {
		// Request simple sin autenticación
		rr := suite.MakeRequest(testutils.TestRequest{
			Method: "GET",
			URL:    "/api/health",
		})

		suite.AssertStatus(rr, 200)
		suite.AssertHeaderEquals(rr, "Content-Type", "application/json")

		var health HealthResponse
		suite.AssertJSON(rr, &health)

		if health.Status != "ok" {
			t.Errorf("Expected status 'ok', got '%s'", health.Status)
		}
	})

	t.Run("Get workouts with authentication", func(t *testing.T) {
		// Request con autenticación
		rr := suite.MakeRequest(testutils.TestRequest{
			Method: "GET",
			URL:    "/api/workouts",
			UserID: mockData.UserID,
		})

		// Sin DB real, esperamos error 500, pero no 401
		if rr.Code == 401 {
			t.Error("Request should be authenticated")
		}
	})

	t.Run("Get workouts with filters", func(t *testing.T) {
		// Request con parámetros de query
		rr := suite.MakeRequest(testutils.TestRequest{
			Method: "GET",
			URL:    "/api/workouts",
			UserID: mockData.UserID,
			QueryParams: map[string]string{
				"date": "2024-01-01",
			},
		})

		// Verificar que los parámetros se procesaron (no error 400)
		if rr.Code == 400 {
			suite.AssertNotContains(rr, "parámetros inválidos")
		}
	})

	t.Run("Create workout with valid data", func(t *testing.T) {
		workoutData := models.CreateWorkoutRequest{
			ExerciseID:   1,
			Weight:       80.5,
			Reps:         10,
			Serie:        intPtr(1),
			Seconds:      intPtr(45),
			Observations: stringPtr("Test workout"),
		}

		rr := suite.MakeRequest(testutils.TestRequest{
			Method: "POST",
			URL:    "/api/workouts",
			Body:   workoutData,
			UserID: mockData.UserID,
		})

		// Verificar que no hay errores de validación
		if rr.Code == 400 {
			suite.AssertNotContains(rr, "JSON inválido")
			suite.AssertNotContains(rr, "peso debe ser mayor")
			suite.AssertNotContains(rr, "repeticiones deben ser mayores")
		}
	})

	t.Run("Create workout with invalid data", func(t *testing.T) {
		invalidData := models.CreateWorkoutRequest{
			ExerciseID: 1,
			Weight:     -10, // Peso inválido
			Reps:       0,   // Reps inválidas
		}

		rr := suite.MakeRequest(testutils.TestRequest{
			Method: "POST",
			URL:    "/api/workouts",
			Body:   invalidData,
			UserID: mockData.UserID,
		})

		suite.AssertStatus(rr, 400)
		// Debería contener mensaje de error sobre peso o reps
		body := rr.Body.String()
		if !contains(body, "peso") && !contains(body, "repeticiones") {
			t.Error("Error message should mention weight or reps")
		}
	})

	t.Run("Create workout without authentication", func(t *testing.T) {
		workoutData := models.CreateWorkoutRequest{
			ExerciseID: 1,
			Weight:     80.5,
			Reps:       10,
		}

		rr := suite.MakeRequest(testutils.TestRequest{
			Method: "POST",
			URL:    "/api/workouts",
			Body:   workoutData,
			// Sin UserID = sin autenticación
		})

		// Debería fallar por falta de autenticación
		// Nota: En este caso no estamos usando el middleware de auth
		// En tests reales configurarías el middleware completo
		t.Logf("Without auth: %d - %s", rr.Code, rr.Body.String())
	})
}

// TestTableDrivenWorkoutValidation demuestra testing con table-driven tests
func TestTableDrivenWorkoutValidation(t *testing.T) {
	suite := testutils.NewAPITestSuite(t)
	suite.Router.HandleFunc("/api/workouts", CreateWorkoutHandler).Methods("POST")

	tests := []struct {
		name           string
		data           models.CreateWorkoutRequest
		expectedStatus int
		shouldContain  string
	}{
		{
			name: "Valid workout",
			data: models.CreateWorkoutRequest{
				ExerciseID: 1,
				Weight:     80.5,
				Reps:       10,
			},
			expectedStatus: 500, // Sin DB real, esperamos 500 no 400
			shouldContain:  "",
		},
		{
			name: "Zero weight",
			data: models.CreateWorkoutRequest{
				ExerciseID: 1,
				Weight:     0,
				Reps:       10,
			},
			expectedStatus: 400,
			shouldContain:  "peso",
		},
		{
			name: "Negative weight",
			data: models.CreateWorkoutRequest{
				ExerciseID: 1,
				Weight:     -10,
				Reps:       10,
			},
			expectedStatus: 400,
			shouldContain:  "peso",
		},
		{
			name: "Zero reps",
			data: models.CreateWorkoutRequest{
				ExerciseID: 1,
				Weight:     80.5,
				Reps:       0,
			},
			expectedStatus: 400,
			shouldContain:  "repeticiones",
		},
		{
			name: "High weight (boundary test)",
			data: models.CreateWorkoutRequest{
				ExerciseID: 1,
				Weight:     999.99,
				Reps:       1,
			},
			expectedStatus: 500, // Debería ser válido
			shouldContain:  "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			rr := suite.MakeRequest(testutils.TestRequest{
				Method: "POST",
				URL:    "/api/workouts",
				Body:   tt.data,
				UserID: "test_user",
			})

			suite.AssertStatus(rr, tt.expectedStatus)

			if tt.shouldContain != "" {
				suite.AssertContains(rr, tt.shouldContain)
			}
		})
	}
}

// Helper function para verificar si un string contiene otro (simple)
func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(substr) == 0 || 
		(len(substr) <= len(s) && containsHelper(s, substr)))
}

func containsHelper(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
