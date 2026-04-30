package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/goalritmo/gym/backend/database"
)

// SocialWorkout represents a workout for the social view
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

// SocialExercise represents an exercise in the social view
type SocialExercise struct {
	ExerciseName string  `json:"exercise_name"`
	Weight       float64 `json:"weight"`
	Reps         int     `json:"reps"`
	Seconds      *int    `json:"seconds"`
	Set          int     `json:"set"`
}

// GetSocialWorkoutsHandler fetches social workouts from all users
func GetSocialWorkoutsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userID, ok := r.Context().Value("user_id").(string)
	if !ok || userID == "" {
		fmt.Printf("Error: user_id not found in context\n")
		http.Error(w, "Unauthorized: user_id not found in context", http.StatusUnauthorized)
		return
	}

	// Pagination parameters
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

	// Simplified query to avoid grouping and permission issues with auth.users
	// We get basic data from workout_days and join with user_profiles
	// The avatar is fetched via a safe subquery to auth.users
	// Exercises are fetched via a subquery to avoid duplicates and complex GROUP BY
	query := `
		SELECT 
			wd.id as session_id,
			wd.user_id,
			COALESCE(up.name, 'Usuario') as user_name,
			'' as user_avatar_url,
			wd.date as workout_date,
			wd.created_at as workout_created_at,
			(SELECT COUNT(DISTINCT w2.exercise_id) FROM workouts w2 WHERE w2.workout_day_id = wd.id) as total_exercises,
			(SELECT COUNT(*) FROM workouts w2 WHERE w2.workout_day_id = wd.id) as total_sets,
			COALESCE(
				(SELECT json_agg(
					json_build_object(
						'exercise_name', e.name,
						'weight', w.weight,
						'reps', w.reps,
						'seconds', w.seconds,
						'set', w.set
					) ORDER BY w.set
				) 
				 FROM workouts w 
				 JOIN exercises e ON w.exercise_id = e.id 
				 WHERE w.workout_day_id = wd.id
				),
				'[]'::json
			) as exercises
		FROM workout_days wd
		LEFT JOIN user_profiles up ON wd.user_id = up.user_id
		ORDER BY wd.date DESC, wd.created_at DESC
		LIMIT $1 OFFSET $2
	`

	fmt.Printf("Executing social query with params: limit=%d, offset=%d\n", limit, offset)
	
	rows, err := database.DB.Query(query, limit, offset)
	if err != nil {
		fmt.Printf("Error querying social workouts: %v\n", err)
		http.Error(w, fmt.Sprintf("Error querying social workouts: %v", err), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	fmt.Printf("Query executed successfully, processing results...\n")

	var socialWorkouts []SocialWorkout
	for rows.Next() {
		var workout SocialWorkout
		var exercisesJSON string
		
		var workoutDate string
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
			fmt.Printf("Error scanning social workout: %v\n", err)
			continue
		}

		// Convert date to Argentina timezone
		loc, err := time.LoadLocation("America/Argentina/Buenos_Aires")
		if err != nil {
			loc = time.FixedZone("UTC-3", -3*60*60)
		}
		
		workout.WorkoutDate = workoutDate // It's a YYYY-MM-DD string
		workout.CreatedAt = createdAt.In(loc).Format(time.RFC3339)

		// Parse exercises JSON
		if err := json.Unmarshal([]byte(exercisesJSON), &workout.Exercises); err != nil {
			fmt.Printf("Error parsing exercises: %v\n", err)
			continue
		}

		socialWorkouts = append(socialWorkouts, workout)
	}

	fmt.Printf("Found %d social workouts\n", len(socialWorkouts))
	json.NewEncoder(w).Encode(socialWorkouts)
}

