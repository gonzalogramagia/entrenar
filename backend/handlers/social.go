package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/goalritmo/gym/backend/database"
	"github.com/gorilla/mux"
)

// SocialWorkout representa un entrenamiento para la vista social
type SocialWorkout struct {
	SessionID     int       `json:"session_id"`
	UserID        string    `json:"user_id"`
	UserName      string    `json:"user_name"`
	UserAvatarURL string    `json:"user_avatar_url"`
	WorkoutDate   string    `json:"workout_date"`
	CreatedAt     string    `json:"created_at"`
	TotalExercises int      `json:"total_exercises"`
	TotalSeries   int       `json:"total_series"`
	Exercises     []SocialExercise `json:"exercises"`
}

// SocialExercise representa un ejercicio en la vista social
type SocialExercise struct {
	ExerciseName string  `json:"exercise_name"`
	Weight       float64 `json:"weight"`
	Reps         int     `json:"reps"`
	Seconds      *int    `json:"seconds"`
	Set          int     `json:"set"`
}

// GetSocialWorkoutsHandler obtiene entrenamientos sociales de todos los usuarios
func GetSocialWorkoutsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userID, ok := r.Context().Value("user_id").(string)
	if !ok || userID == "" {
		fmt.Printf("Error: user_id no encontrado en contexto\n")
		http.Error(w, "Unauthorized: user_id not found in context", http.StatusUnauthorized)
		return
	}

	// Por ahora, asumir que la funcionalidad social está habilitada para todos
	// En el futuro, esto se verificará contra la tabla user_settings

	// Obtener parámetros de paginación
	limit := 10
	offset := 0
	
	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			limit = l
		}
	}
	
	if offsetStr := r.URL.Query().Get("offset"); offsetStr != "" {
		if o, err := strconv.Atoi(offsetStr); err == nil && o >= 0 {
			offset = o
		}
	}



	// Query actualizada para usar workout_days con kudos reales y filtrar por configuración de usuario
	query := `
		SELECT 
			wd.id as session_id,
			wd.user_id,
			COALESCE(up.name, 'Usuario') as user_name,
			COALESCE(up.avatar_url, '') as user_avatar_url,
			wd.date as workout_date,
			wd.created_at as workout_created_at,
			COALESCE(COUNT(DISTINCT w.exercise_id), 0) as total_exercises,
			COALESCE(COUNT(w.id), 0) as total_series,
			COALESCE(
				json_agg(
					json_build_object(
						'exercise_name', e.name,
						'weight', w.weight,
						'reps', w.reps,
						'seconds', w.seconds,
						'set', w.set
					) ORDER BY w.set
				) FILTER (WHERE w.id IS NOT NULL),
				'[]'::json
			) as exercises
		FROM workout_days wd
		LEFT JOIN user_profiles up ON wd.user_id = up.user_id
		LEFT JOIN workouts w ON wd.id = w.workout_day_id
		LEFT JOIN exercises e ON w.exercise_id = e.id
		WHERE 1=1
		GROUP BY wd.id, wd.user_id, up.name, up.avatar_url, wd.date, wd.created_at
		ORDER BY wd.date DESC, wd.created_at DESC
		LIMIT $1 OFFSET $2
	`


	fmt.Printf("Ejecutando query con parámetros: limit=%d, offset=%d, userID=%s\n", limit, offset, userID)
	
	rows, err := database.DB.Query(query, limit, offset)
	if err != nil {
		fmt.Printf("Error consultando entrenamientos sociales: %v\n", err)
		http.Error(w, "Error consultando entrenamientos sociales", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	fmt.Printf("Query ejecutada exitosamente, procesando resultados...\n")

	var socialWorkouts []SocialWorkout
	for rows.Next() {
		var workout SocialWorkout
		var exercisesJSON string
		
		var workoutDate time.Time
		var createdAt time.Time
		err := rows.Scan(
			&workout.SessionID,
			&workout.UserID,
			&workout.UserName,
			&workout.UserAvatarURL,
			&workoutDate,
			&createdAt,
			&workout.TotalExercises,
			&workout.TotalSeries,
			&exercisesJSON,
		)
		if err != nil {
			fmt.Printf("Error escaneando entrenamiento social: %v\n", err)
			continue
		}

		// Convertir fecha a zona horaria de Argentina
		loc, err := time.LoadLocation("America/Argentina/Buenos_Aires")
		if err != nil {
			loc = time.FixedZone("UTC-3", -3*60*60)
		}
		workout.WorkoutDate = workoutDate.In(loc).Format(time.RFC3339)
		workout.CreatedAt = createdAt.In(loc).Format(time.RFC3339)

		// Parsear el JSON de ejercicios
		if err := json.Unmarshal([]byte(exercisesJSON), &workout.Exercises); err != nil {
			fmt.Printf("Error parseando ejercicios: %v\n", err)
			continue
		}

		// Los kudos ahora vienen de la base de datos

		socialWorkouts = append(socialWorkouts, workout)
	}

	fmt.Printf("Encontrados %d entrenamientos sociales\n", len(socialWorkouts))
	json.NewEncoder(w).Encode(socialWorkouts)
}

