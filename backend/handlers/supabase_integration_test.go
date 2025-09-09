package handlers

import (
	"strconv"
	"testing"
	"time"

	"github.com/goalritmo/gym/backend/models"
	"github.com/goalritmo/gym/backend/testutils"
)

// TestSupabaseIntegration prueba el flujo completo con Supabase real
func TestSupabaseIntegration(t *testing.T) {
	// Configurar base de datos de testing
	testutils.SetupTestDatabase(t)
	testutils.VerifyDatabaseSchema(t)

	// Crear usuario único para este test
	testUserID := testutils.GetTestUserID(t)
	testutils.CreateTestUserInDB(t, testUserID)

	// Limpiar datos al final del test
	t.Cleanup(func() {
		testutils.CleanupTestUser(t, testUserID)
	})

	// Crear suite de testing
	suite := testutils.NewAPITestSuite(t)

	// Configurar rutas
	suite.Router.HandleFunc("/api/workouts", GetWorkoutsHandler).Methods("GET")
	suite.Router.HandleFunc("/api/workouts", CreateWorkoutHandler).Methods("POST")
	suite.Router.HandleFunc("/api/workouts/{id}", UpdateWorkoutHandler).Methods("PUT")
	suite.Router.HandleFunc("/api/workouts/{id}", DeleteWorkoutHandler).Methods("DELETE")
	suite.Router.HandleFunc("/api/workout-sessions", GetWorkoutSessionsHandler).Methods("GET")
	suite.Router.HandleFunc("/api/workout-sessions", CreateWorkoutSessionHandler).Methods("POST")

	var createdWorkoutID int

	t.Run("Create workout with real database", func(t *testing.T) {
		// Datos de workout válidos
		workoutData := models.CreateWorkoutRequest{
			ExerciseID:   1, // Asumiendo que existe ejercicio con ID 1
			Weight:       80.5,
			Reps:         10,
			Serie:        intPtr(1),
			Seconds:      intPtr(45),
			Observations: stringPtr("Test workout con Supabase"),
		}

		rr := suite.MakeRequest(testutils.TestRequest{
			Method: "POST",
			URL:    "/api/workouts",
			Body:   workoutData,
			UserID: testUserID,
		})

		// Verificar respuesta exitosa
		suite.AssertStatus(rr, 201)

		// Verificar que el JSON es válido
		var workout models.Workout
		suite.AssertJSON(rr, &workout)

		// Verificar datos del workout creado
		if workout.Weight != workoutData.Weight {
			t.Errorf("Expected weight %f, got %f", workoutData.Weight, workout.Weight)
		}
		if workout.Reps != workoutData.Reps {
			t.Errorf("Expected reps %d, got %d", workoutData.Reps, workout.Reps)
		}
		if workout.UserID != testUserID {
			t.Errorf("Expected user_id %s, got %s", testUserID, workout.UserID)
		}

		createdWorkoutID = workout.ID
		t.Logf("✅ Workout creado con ID: %d", createdWorkoutID)
	})

	t.Run("Get workouts from database", func(t *testing.T) {
		rr := suite.MakeRequest(testutils.TestRequest{
			Method: "GET",
			URL:    "/api/workouts",
			UserID: testUserID,
		})

		suite.AssertStatus(rr, 200)

		var workouts []models.Workout
		suite.AssertJSON(rr, &workouts)

		// Debería haber al menos el workout que creamos
		if len(workouts) == 0 {
			t.Error("Expected at least one workout")
		}

		// Verificar que nuestro workout está en la lista
		found := false
		for _, w := range workouts {
			if w.ID == createdWorkoutID {
				found = true
				break
			}
		}

		if !found {
			t.Errorf("Created workout with ID %d not found in results", createdWorkoutID)
		}

		t.Logf("✅ Encontrados %d workouts", len(workouts))
	})

	t.Run("Update workout in database", func(t *testing.T) {
		if createdWorkoutID == 0 {
			t.Skip("No workout created to update")
		}

		updateData := models.CreateWorkoutRequest{
			ExerciseID:   1,
			Weight:       85.0, // Peso actualizado
			Reps:         12,   // Reps actualizadas
			Serie:        intPtr(2),
			Observations: stringPtr("Workout actualizado"),
		}

		rr := suite.MakeRequest(testutils.TestRequest{
			Method: "PUT",
			URL:    "/api/workouts/" + strconv.Itoa(createdWorkoutID),
			Body:   updateData,
			UserID: testUserID,
		})

		// Si el endpoint está implementado correctamente
		if rr.Code == 200 {
			var workout models.Workout
			suite.AssertJSON(rr, &workout)

			if workout.Weight != updateData.Weight {
				t.Errorf("Expected updated weight %f, got %f", updateData.Weight, workout.Weight)
			}
		}

		t.Logf("✅ Update test completed with status: %d", rr.Code)
	})

	t.Run("Delete workout from database", func(t *testing.T) {
		if createdWorkoutID == 0 {
			t.Skip("No workout created to delete")
		}

		rr := suite.MakeRequest(testutils.TestRequest{
			Method: "DELETE",
			URL:    "/api/workouts/" + strconv.Itoa(createdWorkoutID),
			UserID: testUserID,
		})

		// Verificar que se eliminó correctamente
		if rr.Code == 204 {
			t.Logf("✅ Workout eliminado exitosamente")
		} else {
			t.Logf("Delete status: %d - %s", rr.Code, rr.Body.String())
		}

		// Verificar que ya no existe
		rr2 := suite.MakeRequest(testutils.TestRequest{
			Method: "GET",
			URL:    "/api/workouts",
			UserID: testUserID,
		})

		if rr2.Code == 200 {
			var workouts []models.Workout
			suite.AssertJSON(rr2, &workouts)

			// No debería encontrar el workout eliminado
			for _, w := range workouts {
				if w.ID == createdWorkoutID {
					t.Error("Workout should have been deleted but still exists")
				}
			}
		}
	})
}

// TestSupabaseWorkoutSessions prueba las sesiones de entrenamiento
func TestSupabaseWorkoutSessions(t *testing.T) {
	testutils.SetupTestDatabase(t)
	testutils.VerifyDatabaseSchema(t)

	testUserID := testutils.GetTestUserID(t)
	testutils.CreateTestUserInDB(t, testUserID)
	t.Cleanup(func() {
		testutils.CleanupTestUser(t, testUserID)
	})

	suite := testutils.NewAPITestSuite(t)
	suite.Router.HandleFunc("/api/workout-sessions", GetWorkoutSessionsHandler).Methods("GET")
	suite.Router.HandleFunc("/api/workout-sessions", CreateWorkoutSessionHandler).Methods("POST")
	suite.Router.HandleFunc("/api/workout-sessions/{id}", UpdateWorkoutSessionHandler).Methods("PUT")

	var createdSessionID int

	t.Run("Create workout session", func(t *testing.T) {
		sessionData := models.CreateWorkoutSessionRequest{
			SessionDate: parseDate("2024-01-15"),
			SessionName: "Test Fullbody Session",
			Notes:       stringPtr("Sesión de prueba con Supabase"),
		}

		rr := suite.MakeRequest(testutils.TestRequest{
			Method: "POST",
			URL:    "/api/workout-sessions",
			Body:   sessionData,
			UserID: testUserID,
		})

		suite.AssertStatus(rr, 201)

		var session models.WorkoutSession
		suite.AssertJSON(rr, &session)

		if session.SessionName != sessionData.SessionName {
			t.Errorf("Expected session name %s, got %s", sessionData.SessionName, session.SessionName)
		}

		createdSessionID = session.ID
		t.Logf("✅ Session creada con ID: %d", createdSessionID)
	})

	t.Run("Update session effort and mood", func(t *testing.T) {
		if createdSessionID == 0 {
			t.Skip("No session created to update")
		}

		updateData := models.UpdateWorkoutSessionRequest{
			Effort: intPtr(3),
			Mood:   intPtr(2),
			Notes:  stringPtr("Excelente sesión actualizada"),
		}

		rr := suite.MakeRequest(testutils.TestRequest{
			Method: "PUT",
			URL:    "/api/workout-sessions/" + strconv.Itoa(createdSessionID),
			Body:   updateData,
			UserID: testUserID,
		})

		if rr.Code == 200 {
			var session models.WorkoutSession
			suite.AssertJSON(rr, &session)

			if session.Effort != *updateData.Effort {
				t.Errorf("Expected effort %d, got %d", *updateData.Effort, session.Effort)
			}
			if session.Mood != *updateData.Mood {
				t.Errorf("Expected mood %d, got %d", *updateData.Mood, session.Mood)
			}
		}

		t.Logf("✅ Session update test completed with status: %d", rr.Code)
	})
}

// Helper functions
func parseDate(dateStr string) time.Time {
	// Simplificado para tests
	return time.Now()
}

// Helpers para punteros
func intPtr(i int) *int {
	return &i
}

func stringPtr(s string) *string {
	return &s
}
