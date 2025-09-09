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
	KudosCount    int       `json:"kudos_count"`
	HasKudos      bool      `json:"has_kudos"`
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
			) as exercises,
			(SELECT COUNT(*) FROM kudos WHERE workout_day_id = wd.id) as kudos_count,
			EXISTS(SELECT 1 FROM kudos WHERE user_id = $3 AND workout_day_id = wd.id) as has_kudos
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
	
	rows, err := database.DB.Query(query, limit, offset, userID)
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
			&workout.KudosCount,
			&workout.HasKudos,
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

// GiveKudosHandler maneja dar kudos a un workout
func GiveKudosHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userID, ok := r.Context().Value("user_id").(string)
	if !ok || userID == "" {
		fmt.Printf("Error: user_id no encontrado en contexto\n")
		http.Error(w, "Unauthorized: user_id not found in context", http.StatusUnauthorized)
		return
	}

	// Extraer workout ID de la URL
	vars := mux.Vars(r)
	workoutIDStr := vars["id"]
	if workoutIDStr == "" {
		http.Error(w, "Workout ID is required", http.StatusBadRequest)
		return
	}

	// Convertir workout ID a entero
	workoutID, err := strconv.Atoi(workoutIDStr)
	if err != nil {
		http.Error(w, "Invalid workout ID", http.StatusBadRequest)
		return
	}

	fmt.Printf("Usuario %s dando kudos al workout %d\n", userID, workoutID)

	// Verificar si el workout existe
	var exists bool
	err = database.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM workout_days WHERE id = $1)", workoutID).Scan(&exists)
	if err != nil {
		fmt.Printf("Error verificando existencia del workout: %v\n", err)
		http.Error(w, "Error interno del servidor", http.StatusInternalServerError)
		return
	}

	if !exists {
		http.Error(w, "Workout not found", http.StatusNotFound)
		return
	}

	// Verificar si ya dio kudos
	var alreadyLiked bool
	err = database.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM kudos WHERE user_id = $1 AND workout_day_id = $2)", userID, workoutID).Scan(&alreadyLiked)
	if err != nil {
		fmt.Printf("Error verificando kudos existente: %v\n", err)
		http.Error(w, "Error interno del servidor", http.StatusInternalServerError)
		return
	}

	if alreadyLiked {
		http.Error(w, "Already gave kudos to this workout", http.StatusConflict)
		return
	}

	// Obtener el user_id del workout para la notificación
	var workoutUserID string
	err = database.DB.QueryRow("SELECT user_id FROM workout_days WHERE id = $1", workoutID).Scan(&workoutUserID)
	if err != nil {
		fmt.Printf("Error obteniendo user_id del workout: %v\n", err)
		http.Error(w, "Error interno del servidor", http.StatusInternalServerError)
		return
	}

	// Insertar el kudos
	_, err = database.DB.Exec("INSERT INTO kudos (user_id, workout_day_id) VALUES ($1, $2)", userID, workoutID)
	if err != nil {
		fmt.Printf("Error insertando kudos: %v\n", err)
		http.Error(w, "Error interno del servidor", http.StatusInternalServerError)
		return
	}

	fmt.Printf("Kudos insertado exitosamente para usuario %s en workout %d\n", userID, workoutID)

	// Crear notificación de kudos (solo si no es el mismo usuario)
	if userID != workoutUserID {
		// Llamar internamente a la función de notificación
		createKudosNotification(workoutID, userID, workoutUserID)
	}

	response := map[string]interface{}{
		"success": true,
		"message": "Kudos dado exitosamente",
	}

	json.NewEncoder(w).Encode(response)
}

// DebugHandler es un endpoint temporal para debug
func DebugHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Listar todas las tablas disponibles
	var allTables []string
	rows, err := database.DB.Query(`
		SELECT table_name 
		FROM information_schema.tables 
		WHERE table_schema = 'public' 
		ORDER BY table_name
	`)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var tableName string
			if err := rows.Scan(&tableName); err == nil {
				allTables = append(allTables, tableName)
			}
		}
	}

	// Verificar si las tablas existen
	tables := []string{"workout_days", "workouts", "exercises", "users", "auth.users", "public.users"}
	tableInfo := make(map[string]interface{})

	for _, table := range tables {
		var count int
		err := database.DB.QueryRow(fmt.Sprintf("SELECT COUNT(*) FROM %s", table)).Scan(&count)
		if err != nil {
			tableInfo[table] = map[string]interface{}{
				"exists": false,
				"error":  err.Error(),
			}
		} else {
			tableInfo[table] = map[string]interface{}{
				"exists": true,
				"count":  count,
			}
		}
	}

	// Verificar estructura de workout_days
	var workoutDaysColumns []string
	rows, err = database.DB.Query(`
		SELECT column_name, data_type 
		FROM information_schema.columns 
		WHERE table_name = 'workout_days' 
		ORDER BY ordinal_position
	`)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var colName, dataType string
			if err := rows.Scan(&colName, &dataType); err == nil {
				workoutDaysColumns = append(workoutDaysColumns, fmt.Sprintf("%s (%s)", colName, dataType))
			}
		}
	}

	// Verificar estructura de workouts
	var workoutColumns []string
	rows2, err := database.DB.Query(`
		SELECT column_name, data_type 
		FROM information_schema.columns 
		WHERE table_name = 'workouts' 
		ORDER BY ordinal_position
	`)
	if err == nil {
		defer rows2.Close()
		for rows2.Next() {
			var colName, dataType string
			if err := rows2.Scan(&colName, &dataType); err == nil {
				workoutColumns = append(workoutColumns, fmt.Sprintf("%s (%s)", colName, dataType))
			}
		}
	}

	// Verificar datos de user_profiles
	var userProfiles []map[string]interface{}
	profileRows, err := database.DB.Query(`
		SELECT user_id, name, avatar_url, created_at 
		FROM user_profiles 
		ORDER BY created_at DESC
	`)
	if err == nil {
		defer profileRows.Close()
		for profileRows.Next() {
			var userID, name, avatarURL, createdAt string
			if err := profileRows.Scan(&userID, &name, &avatarURL, &createdAt); err == nil {
				userProfiles = append(userProfiles, map[string]interface{}{
					"user_id": userID,
					"name": name,
					"avatar_url": avatarURL,
					"created_at": createdAt,
				})
			}
		}
	}

	// Verificar datos de workout_days
	var workoutDays []map[string]interface{}
	workoutDaysRows, err := database.DB.Query(`
		SELECT id, user_id, date, name, effort, mood, created_at 
		FROM workout_days 
		ORDER BY created_at DESC
		LIMIT 5
	`)
	if err == nil {
		defer workoutDaysRows.Close()
		for workoutDaysRows.Next() {
			var id int
			var userID, date, name, createdAt string
			var effort, mood int
			if err := workoutDaysRows.Scan(&id, &userID, &date, &name, &effort, &mood, &createdAt); err == nil {
				workoutDays = append(workoutDays, map[string]interface{}{
					"id": id,
					"user_id": userID,
					"date": date,
					"name": name,
					"effort": effort,
					"mood": mood,
					"created_at": createdAt,
				})
			}
		}
	}
	
	response := map[string]interface{}{
		"all_tables": allTables,
		"tables": tableInfo,
		"workout_days_columns": workoutDaysColumns,
		"workouts_columns": workoutColumns,
		"user_profiles": userProfiles,
		"workout_days_sample": workoutDays,
	}

	json.NewEncoder(w).Encode(response)
}

// FixTriggersHandler elimina los triggers problemáticos temporalmente
func FixTriggersHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Eliminar triggers problemáticos
	queries := []string{
		"DROP TRIGGER IF EXISTS trigger_cleanup_empty_sessions ON workouts",
		"DROP TRIGGER IF EXISTS trigger_cleanup_empty_sessions_update ON workouts",
	}

	var results []string
	for _, query := range queries {
		_, err := database.DB.Exec(query)
		if err != nil {
			results = append(results, fmt.Sprintf("Error: %s - %v", query, err))
		} else {
			results = append(results, fmt.Sprintf("Success: %s", query))
		}
	}

	response := map[string]interface{}{
		"message": "Triggers eliminados",
		"results": results,
	}

	json.NewEncoder(w).Encode(response)
}

// createKudosNotification crea una notificación de kudos internamente
func createKudosNotification(workoutDayID int, fromUserID, toUserID string) {
	// Verificar que el usuario que da kudos existe
	var fromUserName string
	err := database.DB.QueryRow("SELECT COALESCE(up.name, u.email) FROM auth.users u LEFT JOIN user_profiles up ON u.id = up.user_id WHERE u.id = $1", fromUserID).Scan(&fromUserName)
	if err != nil {
		fmt.Printf("Error obteniendo nombre del usuario que da kudos: %v\n", err)
		return
	}

			// Verificar que existe el workout day
	var workoutDate time.Time
	err = database.DB.QueryRow("SELECT created_at FROM workout_days WHERE id = $1 AND user_id = $2", workoutDayID, toUserID).Scan(&workoutDate)
	if err != nil {
		fmt.Printf("Error obteniendo fecha del workout: %v\n", err)
		return
	}
	
	// Restar un día para corregir el offset de zona horaria en notificaciones
	workoutDate = workoutDate.AddDate(0, 0, -1)

	// Buscar si ya existe una notificación de kudos para este workout
	var existingNotificationID int
	var existingData map[string]interface{}
	
	checkQuery := `
		SELECT id, data 
		FROM notifications 
		WHERE user_id = $1 AND type = 'kudos' AND data::jsonb->>'workout_day_id' = $2
	`
	
	err = database.DB.QueryRow(checkQuery, toUserID, fmt.Sprintf("%d", workoutDayID)).Scan(&existingNotificationID, &existingData)
	
	if err != nil {
		// No existe notificación, crear una nueva
		notificationData := map[string]interface{}{
			"workout_day_id": workoutDayID,
			"from_users": []map[string]interface{}{
				{
					"id":   fromUserID,
					"name": fromUserName,
				},
			},
			"workout_date": workoutDate.Format("2006-01-02"),
		}
		
		dataJSON, _ := json.Marshal(notificationData)
		
		insertQuery := `
			INSERT INTO notifications (user_id, type, title, message, data, created_at)
			VALUES ($1, $2, $3, $4, $5, $6)
			RETURNING id
		`
		
		var notificationID int
		err = database.DB.QueryRow(
			insertQuery,
			toUserID,
			"kudos",
			"¡Felicidades! 🎉",
			fmt.Sprintf("Recibiste kudos de %s por tu entrenamiento del %s", fromUserName, formatDate(workoutDate)),
			string(dataJSON),
			time.Now(),
		).Scan(&notificationID)
		
		if err != nil {
			fmt.Printf("Error creando notificación de kudos: %v\n", err)
			return
		}
		
		fmt.Printf("Notificación de kudos creada con ID %d\n", notificationID)
		
	} else {
		// Existe notificación, actualizarla
		var currentData map[string]interface{}
		if existingData != nil {
			currentData = existingData
		} else {
			currentData = make(map[string]interface{})
		}
		
		// Obtener usuarios existentes
		fromUsers, ok := currentData["from_users"].([]interface{})
		if !ok {
			fromUsers = []interface{}{}
		}
		
		// Verificar si el usuario ya dio kudos
		userAlreadyExists := false
		for _, user := range fromUsers {
			if userMap, ok := user.(map[string]interface{}); ok {
				if userMap["id"] == fromUserID {
					userAlreadyExists = true
					break
				}
			}
		}
		
		if !userAlreadyExists {
			// Agregar nuevo usuario
			fromUsers = append(fromUsers, map[string]interface{}{
				"id":   fromUserID,
				"name": fromUserName,
			})
			
			currentData["from_users"] = fromUsers
			
			// Actualizar mensaje
			userNames := make([]string, len(fromUsers))
			for i, user := range fromUsers {
				if userMap, ok := user.(map[string]interface{}); ok {
					userNames[i] = userMap["name"].(string)
				}
			}
			
			message := fmt.Sprintf("Recibiste kudos de %s por tu entrenamiento del %s", formatUserList(userNames), formatDate(workoutDate))
			
			dataJSON, _ := json.Marshal(currentData)
			
			updateQuery := `
				UPDATE notifications 
				SET message = $1, data = $2, updated_at = $3
				WHERE id = $4
			`
			
			_, err = database.DB.Exec(updateQuery, message, string(dataJSON), time.Now(), existingNotificationID)
			if err != nil {
				fmt.Printf("Error actualizando notificación de kudos: %v\n", err)
				return
			}
			
			fmt.Printf("Notificación de kudos actualizada con ID %d\n", existingNotificationID)
		}
	}
}

// formatDate formatea una fecha en español
func formatDate(date time.Time) string {
	weekdays := []string{"Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"}
	months := []string{"Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"}
	
	weekday := weekdays[date.Weekday()]
	day := date.Day()
	month := months[date.Month()-1]
	
	return fmt.Sprintf("%s %d de %s", weekday, day, month)
}

// formatUserList formatea una lista de nombres de usuarios
func formatUserList(names []string) string {
	if len(names) == 0 {
		return ""
	}
	if len(names) == 1 {
		return names[0]
	}
	if len(names) == 2 {
		return fmt.Sprintf("%s y %s", names[0], names[1])
	}
	
	// Para 3 o más usuarios: "Nadia, Gonzalo y María"
	last := names[len(names)-1]
	others := names[:len(names)-1]
	
	return fmt.Sprintf("%s y %s", formatList(others), last)
}

// formatList formatea una lista con comas
func formatList(items []string) string {
	if len(items) == 0 {
		return ""
	}
	if len(items) == 1 {
		return items[0]
	}
	
	result := ""
	for i, item := range items {
		if i > 0 {
			result += ", "
		}
		result += item
	}
	return result
}
