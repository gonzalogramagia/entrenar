package handlers

import (
	"math"
	"strconv"
	"testing"

	"github.com/gonzagramaglia/entrenar/backend/models"
	"github.com/gonzagramaglia/entrenar/backend/testutils"
)

// TestSupabaseIntegration prueba el flujo completo con Supabase real
func TestSupabaseIntegration(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test")
	}

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
	suite.Router.HandleFunc("/api/workout-days", GetWorkoutDaysHandler).Methods("GET")

	var createdWorkoutID int

	weight := 80.5
	reps := 10
	set := 1
	seconds := 45

	t.Run("Create workout with real database", func(t *testing.T) {
		workoutData := models.CreateWorkoutRequest{
			ExerciseID:   1,
			Weight:       &weight,
			Reps:         &reps,
			Set:          &set,
			Seconds:      &seconds,
			Observations: "Test workout con Supabase",
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
		if math.Abs(workout.Weight-*workoutData.Weight) > 0.001 {
			t.Errorf("Expected weight %f, got %f", *workoutData.Weight, workout.Weight)
		}
		if workout.Reps != *workoutData.Reps {
			t.Errorf("Expected reps %d, got %d", *workoutData.Reps, workout.Reps)
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

		if len(workouts) == 0 {
			t.Error("Expected at least one workout")
		}

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

		updatedWeight := 85.0
		updatedReps := 12
		updatedSet := 2

		updateData := models.CreateWorkoutRequest{
			ExerciseID:   1,
			Weight:       &updatedWeight,
			Reps:         &updatedReps,
			Set:          &updatedSet,
			Observations: "Workout actualizado",
		}

		rr := suite.MakeRequest(testutils.TestRequest{
			Method: "PUT",
			URL:    "/api/workouts/" + strconv.Itoa(createdWorkoutID),
			Body:   updateData,
			UserID: testUserID,
		})

		suite.AssertStatus(rr, 200)

		var workout models.Workout
		suite.AssertJSON(rr, &workout)

		if math.Abs(workout.Weight-*updateData.Weight) > 0.001 {
			t.Errorf("Expected updated weight %f, got %f", *updateData.Weight, workout.Weight)
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

		suite.AssertStatus(rr, 204)
		t.Logf("✅ Workout eliminado exitosamente")

		// Verificar que ya no existe
		rr2 := suite.MakeRequest(testutils.TestRequest{
			Method: "GET",
			URL:    "/api/workouts",
			UserID: testUserID,
		})

		suite.AssertStatus(rr2, 200)

		var workouts []models.Workout
		suite.AssertJSON(rr2, &workouts)

		for _, w := range workouts {
			if w.ID == createdWorkoutID {
				t.Error("Workout should have been deleted but still exists")
			}
		}
	})
}
