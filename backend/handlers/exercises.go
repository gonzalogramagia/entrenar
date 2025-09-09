package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/goalritmo/gym/backend/database"
	"github.com/goalritmo/gym/backend/models"
	"github.com/lib/pq"
)

// GetExercisesHandler obtiene la lista de ejercicios con filtros
func GetExercisesHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Query simple para obtener solo id y name para el select del frontend
	query := `SELECT id, name, bodyweight, is_sport FROM exercises ORDER BY name ASC`

	rows, err := database.DB.Query(query)
	if err != nil {
		http.Error(w, "Error consultando ejercicios", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	// Estructura simple para el select
	type SimpleExercise struct {
		ID         int    `json:"id"`
		Name       string `json:"name"`
		Bodyweight bool   `json:"bodyweight"`
		IsSport    bool   `json:"is_sport"`
	}

	var exercises []SimpleExercise
	for rows.Next() {
		var exercise SimpleExercise

		err := rows.Scan(&exercise.ID, &exercise.Name, &exercise.Bodyweight, &exercise.IsSport)
		if err != nil {
			http.Error(w, "Error escaneando ejercicio", http.StatusInternalServerError)
			return
		}

		exercises = append(exercises, exercise)
	}

	json.NewEncoder(w).Encode(exercises)
}

// GetExerciseHandler obtiene un ejercicio específico por ID
func GetExerciseHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "ID inválido", http.StatusBadRequest)
		return
	}

	query := `
		SELECT e.id, e.name, e.muscle_group,
			   COALESCE(array_agg(DISTINCT mp.name) FILTER (WHERE mp.name IS NOT NULL AND emg_p.role = 'primary'), '{}') as primary_muscles,
			   COALESCE(array_agg(DISTINCT ms.name) FILTER (WHERE ms.name IS NOT NULL AND emg_s.role = 'secondary'), '{}') as secondary_muscles,
			   eq.name as equipment, e.video_url, e.bodyweight, e.is_sport, e.created_at
		FROM exercises e
		LEFT JOIN equipment eq ON e.equipment_id = eq.id
		LEFT JOIN exercise_muscle_groups emg_p ON e.id = emg_p.exercise_id AND emg_p.role = 'primary'
		LEFT JOIN muscle_groups mp ON emg_p.muscle_group_id = mp.id
		LEFT JOIN exercise_muscle_groups emg_s ON e.id = emg_s.exercise_id AND emg_s.role = 'secondary'
		LEFT JOIN muscle_groups ms ON emg_s.muscle_group_id = ms.id
		WHERE e.id = $1
		GROUP BY e.id, e.name, e.muscle_group, eq.name, e.video_url, e.bodyweight, e.is_sport, e.created_at
	`

	var exercise models.Exercise
	var primaryMuscles, secondaryMuscles pq.StringArray
	var equipmentName *string

	err = database.DB.QueryRow(query, id).Scan(
		&exercise.ID,
		&exercise.Name,
		&exercise.MuscleGroup,
		&primaryMuscles,
		&secondaryMuscles,
		&equipmentName,
		&exercise.VideoURL,
		&exercise.Bodyweight,
		&exercise.IsSport,
		&exercise.CreatedAt,
	)

	if err != nil {
		http.Error(w, "Ejercicio no encontrado", http.StatusNotFound)
		return
	}

	exercise.PrimaryMuscles = []string(primaryMuscles)
	exercise.SecondaryMuscles = []string(secondaryMuscles)
	
	if equipmentName != nil {
		exercise.Equipment = *equipmentName
	}

	json.NewEncoder(w).Encode(exercise)
}
