package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/goalritmo/gym/backend/database"
	"github.com/goalritmo/gym/backend/models"
)

// GetUserRoutinesHandler obtiene todas las rutinas del usuario actual
func GetUserRoutinesHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userID, ok := r.Context().Value("user_id").(string)
	if !ok || userID == "" {
		http.Error(w, "Unauthorized: user_id not found in context", http.StatusUnauthorized)
		return
	}

	query := `
		SELECT 
			ur.id, ur.user_id, ur.name, ur.description, ur.is_active, ur.created_at, ur.updated_at,
			COUNT(re.id) as total_exercises
		FROM user_routines ur
		LEFT JOIN routine_exercises re ON ur.id = re.routine_id
		WHERE ur.user_id = $1
		GROUP BY ur.id, ur.user_id, ur.name, ur.description, ur.is_active, ur.created_at, ur.updated_at
		ORDER BY ur.created_at DESC
	`

	rows, err := database.DB.Query(query, userID)
	if err != nil {
		fmt.Printf("Error consultando rutinas: %v\n", err)
		http.Error(w, "Error obteniendo rutinas", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var routines []models.RoutineWithExercises
	for rows.Next() {
		var routine models.RoutineWithExercises
		var description *string
		
		err := rows.Scan(
			&routine.ID,
			&routine.UserID,
			&routine.Name,
			&description,
			&routine.IsActive,
			&routine.CreatedAt,
			&routine.UpdatedAt,
			&routine.TotalExercises,
		)
		if err != nil {
			fmt.Printf("Error escaneando rutina: %v\n", err)
			http.Error(w, "Error procesando rutina", http.StatusInternalServerError)
			return
		}

		routine.Description = description
		routines = append(routines, routine)
	}

	json.NewEncoder(w).Encode(routines)
}

// GetUserRoutineHandler obtiene una rutina específica con sus ejercicios
func GetUserRoutineHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userID, ok := r.Context().Value("user_id").(string)
	if !ok || userID == "" {
		http.Error(w, "Unauthorized: user_id not found in context", http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	routineID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "ID de rutina inválido", http.StatusBadRequest)
		return
	}

	// Obtener la rutina
	routineQuery := `
		SELECT id, user_id, name, description, is_active, created_at, updated_at
		FROM user_routines 
		WHERE id = $1 AND user_id = $2
	`

	var routine models.UserRoutine
	var description *string
	err = database.DB.QueryRow(routineQuery, routineID, userID).Scan(
		&routine.ID,
		&routine.UserID,
		&routine.Name,
		&description,
		&routine.IsActive,
		&routine.CreatedAt,
		&routine.UpdatedAt,
	)
	if err != nil {
		http.Error(w, "Rutina no encontrada", http.StatusNotFound)
		return
	}

	routine.Description = description

	// Obtener los ejercicios de la rutina
	exercisesQuery := `
		SELECT 
			re.id, re.routine_id, re.exercise_id, e.name as exercise_name,
			re.order_index, re.sets, re.reps, re.weight, re.rest_time_seconds, re.notes,
			re.created_at, re.updated_at
		FROM routine_exercises re
		JOIN exercises e ON re.exercise_id = e.id
		WHERE re.routine_id = $1
		ORDER BY re.order_index ASC
	`

	rows, err := database.DB.Query(exercisesQuery, routineID)
	if err != nil {
		fmt.Printf("Error consultando ejercicios de rutina: %v\n", err)
		http.Error(w, "Error obteniendo ejercicios de la rutina", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var exercises []models.RoutineExercise
	for rows.Next() {
		var exercise models.RoutineExercise
		var notes *string
		
		err := rows.Scan(
			&exercise.ID,
			&exercise.RoutineID,
			&exercise.ExerciseID,
			&exercise.ExerciseName,
			&exercise.OrderIndex,
			&exercise.Sets,
			&exercise.Reps,
			&exercise.Weight,
			&exercise.RestTimeSeconds,
			&notes,
			&exercise.CreatedAt,
			&exercise.UpdatedAt,
		)
		if err != nil {
			fmt.Printf("Error escaneando ejercicio: %v\n", err)
			http.Error(w, "Error procesando ejercicio", http.StatusInternalServerError)
			return
		}

		exercise.Notes = notes
		exercises = append(exercises, exercise)
	}

	routine.Exercises = exercises

	json.NewEncoder(w).Encode(routine)
}

// CreateUserRoutineHandler crea una nueva rutina para el usuario
func CreateUserRoutineHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userID, ok := r.Context().Value("user_id").(string)
	if !ok || userID == "" {
		http.Error(w, "Unauthorized: user_id not found in context", http.StatusUnauthorized)
		return
	}

	var req models.CreateRoutineRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	// Iniciar transacción
	tx, err := database.DB.Begin()
	if err != nil {
		fmt.Printf("Error iniciando transacción: %v\n", err)
		http.Error(w, "Error interno del servidor", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	// Crear la rutina
	routineQuery := `
		INSERT INTO user_routines (user_id, name, description, is_active)
		VALUES ($1, $2, $3, $4)
		RETURNING id, created_at, updated_at
	`

	var routineID int
	var createdAt, updatedAt string
	err = tx.QueryRow(routineQuery, userID, req.Name, req.Description, true).Scan(&routineID, &createdAt, &updatedAt)
	if err != nil {
		fmt.Printf("Error creando rutina: %v\n", err)
		http.Error(w, "Error creando rutina", http.StatusInternalServerError)
		return
	}

	// Si se proporcionaron ejercicios, agregarlos
	if len(req.Exercises) > 0 {
		exerciseQuery := `
			INSERT INTO routine_exercises (routine_id, exercise_id, order_index, sets, reps, weight, rest_time_seconds, notes)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		`

		for _, exercise := range req.Exercises {
			_, err = tx.Exec(exerciseQuery,
				routineID,
				exercise.ExerciseID,
				exercise.OrderIndex,
				exercise.Sets,
				exercise.Reps,
				exercise.Weight,
				exercise.RestTimeSeconds,
				exercise.Notes,
			)
			if err != nil {
				fmt.Printf("Error agregando ejercicio a rutina: %v\n", err)
				http.Error(w, "Error agregando ejercicios a la rutina", http.StatusInternalServerError)
				return
			}
		}
	}

	// Confirmar transacción
	if err = tx.Commit(); err != nil {
		fmt.Printf("Error confirmando transacción: %v\n", err)
		http.Error(w, "Error interno del servidor", http.StatusInternalServerError)
		return
	}

	// Responder con la rutina creada
	response := map[string]interface{}{
		"id":          routineID,
		"user_id":     userID,
		"name":        req.Name,
		"description": req.Description,
		"is_active":   true,
		"created_at":  createdAt,
		"updated_at":  updatedAt,
		"message":     "Rutina creada exitosamente",
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)
}

// UpdateUserRoutineHandler actualiza una rutina existente
func UpdateUserRoutineHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userID, ok := r.Context().Value("user_id").(string)
	if !ok || userID == "" {
		http.Error(w, "Unauthorized: user_id not found in context", http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	routineID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "ID de rutina inválido", http.StatusBadRequest)
		return
	}

	var req models.UpdateRoutineRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	// Verificar que la rutina pertenece al usuario
	var exists bool
	err = database.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM user_routines WHERE id = $1 AND user_id = $2)", routineID, userID).Scan(&exists)
	if err != nil || !exists {
		http.Error(w, "Rutina no encontrada", http.StatusNotFound)
		return
	}

	// Construir query de actualización dinámicamente
	query := "UPDATE user_routines SET updated_at = NOW()"
	args := []interface{}{}
	argIndex := 1

	if req.Name != nil {
		query += fmt.Sprintf(", name = $%d", argIndex)
		args = append(args, *req.Name)
		argIndex++
	}

	if req.Description != nil {
		query += fmt.Sprintf(", description = $%d", argIndex)
		args = append(args, *req.Description)
		argIndex++
	}

	if req.IsActive != nil {
		query += fmt.Sprintf(", is_active = $%d", argIndex)
		args = append(args, *req.IsActive)
		argIndex++
	}

	query += fmt.Sprintf(" WHERE id = $%d AND user_id = $%d", argIndex, argIndex+1)
	args = append(args, routineID, userID)

	_, err = database.DB.Exec(query, args...)
	if err != nil {
		fmt.Printf("Error actualizando rutina: %v\n", err)
		http.Error(w, "Error actualizando rutina", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"message": "Rutina actualizada exitosamente"})
}

// DeleteUserRoutineHandler elimina una rutina
func DeleteUserRoutineHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userID, ok := r.Context().Value("user_id").(string)
	if !ok || userID == "" {
		http.Error(w, "Unauthorized: user_id not found in context", http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	routineID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "ID de rutina inválido", http.StatusBadRequest)
		return
	}

	// Verificar que la rutina pertenece al usuario
	var exists bool
	err = database.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM user_routines WHERE id = $1 AND user_id = $2)", routineID, userID).Scan(&exists)
	if err != nil || !exists {
		http.Error(w, "Rutina no encontrada", http.StatusNotFound)
		return
	}

	// Eliminar la rutina (los ejercicios se eliminan automáticamente por CASCADE)
	_, err = database.DB.Exec("DELETE FROM user_routines WHERE id = $1 AND user_id = $2", routineID, userID)
	if err != nil {
		fmt.Printf("Error eliminando rutina: %v\n", err)
		http.Error(w, "Error eliminando rutina", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"message": "Rutina eliminada exitosamente"})
}
