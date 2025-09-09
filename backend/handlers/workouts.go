package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"time"

	"github.com/gorilla/mux"
	"github.com/goalritmo/gym/backend/database"
	"github.com/goalritmo/gym/backend/models"
)

// convertToArgentinaTime convierte una fecha UTC a la zona horaria de Argentina
func convertToArgentinaTime(utcTime time.Time) time.Time {
	loc, err := time.LoadLocation("America/Argentina/Buenos_Aires")
	if err != nil {
		// Fallback a UTC-3 si no se puede cargar la zona horaria
		loc = time.FixedZone("UTC-3", -3*60*60)
	}
	return utcTime.In(loc)
}

// GetWorkoutsHandler obtiene la lista de workouts
func GetWorkoutsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userID, ok := r.Context().Value("user_id").(string)
	if !ok || userID == "" {
		fmt.Printf("Error: user_id no encontrado en contexto en GetWorkoutsHandler\n")
		http.Error(w, "Unauthorized: user_id not found in context", http.StatusUnauthorized)
		return
	}

	// Obtener parámetros de query
	date := r.URL.Query().Get("date")



	query := `
		SELECT w.id, w.user_id, w.workout_day_id, w.exercise_id, e.name as exercise_name, 
			   w.weight, w.reps, w.set, w.seconds, w.observations, w.created_at, e.is_sport
		FROM workouts w
		JOIN exercises e ON w.exercise_id = e.id
		WHERE w.user_id = $1
	`
	args := []interface{}{userID}
	argIndex := 2

	if date != "" {
		// Filtrar por fecha usando la fecha de creación del workout
		query += fmt.Sprintf(" AND DATE(w.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Argentina/Buenos_Aires') = $%d", argIndex)
		args = append(args, date)
		argIndex++
	}

	query += " ORDER BY w.created_at DESC, w.set ASC"

	fmt.Printf("Ejecutando query con %d parámetros\n", len(args))

	rows, err := database.DB.Query(query, args...)
	if err != nil {
		fmt.Printf("Error consultando workouts: %v\n", err)
		http.Error(w, "Error consultando workouts", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	fmt.Printf("Query ejecutada exitosamente, procesando resultados...\n")

	var workouts []models.Workout
	for rows.Next() {
		var workout models.Workout
		err := rows.Scan(
			&workout.ID,
			&workout.UserID,
			&workout.WorkoutDayID,
			&workout.ExerciseID,
			&workout.ExerciseName,
			&workout.Weight,
			&workout.Reps,
			&workout.Set,
			&workout.Seconds,
			&workout.Observations,
			&workout.CreatedAt,
			&workout.IsSport,
		)
		if err != nil {
			fmt.Printf("Error escaneando workout: %v\n", err)
			continue
		}

		// Convertir fecha a zona horaria de Argentina
		workout.CreatedAt = convertToArgentinaTime(workout.CreatedAt)
		workouts = append(workouts, workout)
	}

	fmt.Printf("Encontrados %d workouts\n", len(workouts))

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(workouts)
}

// GetWorkoutDaysHandler obtiene la lista de días de entrenamiento
func GetWorkoutDaysHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userID, ok := r.Context().Value("user_id").(string)
	if !ok || userID == "" {
		fmt.Printf("Error: user_id no encontrado en contexto en GetWorkoutDaysHandler\n")
		http.Error(w, "Unauthorized: user_id not found in context", http.StatusUnauthorized)
		return
	}



	query := `
		SELECT id, user_id, date, name, effort, mood, created_at, updated_at
		FROM workout_days 
		WHERE user_id = $1 
		ORDER BY date DESC
	`

	rows, err := database.DB.Query(query, userID)
	if err != nil {
		fmt.Printf("Error consultando días de entrenamiento: %v\n", err)
		http.Error(w, "Error consultando días de entrenamiento", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	fmt.Printf("Query ejecutada exitosamente, procesando resultados...\n")

	var workoutDays []models.WorkoutDay
	for rows.Next() {
		var day models.WorkoutDay
		err := rows.Scan(
			&day.ID,
			&day.UserID,
			&day.Date,
			&day.Name,
			&day.Effort,
			&day.Mood,
			&day.CreatedAt,
			&day.UpdatedAt,
		)
		if err != nil {
			fmt.Printf("Error escaneando día de entrenamiento: %v\n", err)
			continue
		}

		// Convertir fechas a zona horaria de Argentina
		day.CreatedAt = convertToArgentinaTime(day.CreatedAt)
		day.UpdatedAt = convertToArgentinaTime(day.UpdatedAt)
		workoutDays = append(workoutDays, day)
	}

	fmt.Printf("Encontrados %d días de entrenamiento\n", len(workoutDays))

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(workoutDays)
}

// CreateWorkoutHandler crea un nuevo workout
func CreateWorkoutHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userID, ok := r.Context().Value("user_id").(string)
	if !ok || userID == "" {
		http.Error(w, "Unauthorized: user_id not found in context", http.StatusUnauthorized)
		return
	}

	var req models.CreateWorkoutRequest
	// Leer el body completo para debug
	bodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		fmt.Printf("Error leyendo body: %v\n", err)
		http.Error(w, "Error leyendo request", http.StatusBadRequest)
		return
	}
	
	// Decodificar JSON
	if err := json.Unmarshal(bodyBytes, &req); err != nil {
		fmt.Printf("Error decodificando JSON: %v\n", err)
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}
	
	// Validaciones
	if req.Reps != nil && *req.Reps <= 0 {
		http.Error(w, "Repeticiones deben ser mayores a 0 si se proporcionan", http.StatusBadRequest)
		return
	}
	
	// Validar peso si se proporciona
	if req.Weight != nil {
		if *req.Weight <= 0 {
			http.Error(w, "Peso debe ser mayor a 0 si se proporciona", http.StatusBadRequest)
			return
		}
	}

	// Verificar que el ejercicio existe
	var exerciseExists bool
	err = database.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM exercises WHERE id = $1)", req.ExerciseID).Scan(&exerciseExists)
	if err != nil {
		fmt.Printf("Error verificando ejercicio: %v\n", err)
		http.Error(w, "Error verificando ejercicio", http.StatusInternalServerError)
		return
	}
	if !exerciseExists {
		fmt.Printf("Ejercicio no encontrado: %d\n", req.ExerciseID)
		http.Error(w, "Ejercicio no encontrado", http.StatusBadRequest)
		return
	}
	fmt.Printf("Ejercicio verificado correctamente\n")

	// Obtener fecha actual en zona horaria de Argentina
	var argentinaLocation *time.Location
	argentinaLocation, err = time.LoadLocation("America/Argentina/Buenos_Aires")
	if err != nil {
		argentinaLocation = time.FixedZone("UTC-3", -3*60*60)
	}
	now := time.Now().In(argentinaLocation)
	today := now.Format("2006-01-02")

	var workoutDayID int



	// Verificar si ya existe un día de entrenamiento para hoy
	sessionQuery := `SELECT id FROM workout_days WHERE user_id = $1 AND date = $2`
	var existingID int
	err = database.DB.QueryRow(sessionQuery, userID, today).Scan(&existingID)
	
	if err != nil {
		// No existe día de entrenamiento para hoy, crear uno nuevo
		createDayQuery := `
			INSERT INTO workout_days (user_id, date, name, effort, mood) 
			VALUES ($1, $2, $3, 0, 0) 
			RETURNING id
		`
		dayName := "Entrenamiento del día"
		err = database.DB.QueryRow(createDayQuery, userID, today, dayName).Scan(&workoutDayID)
		if err != nil {
			fmt.Printf("Error creando día de entrenamiento: %v\n", err)
			http.Error(w, "Error creando día de entrenamiento", http.StatusInternalServerError)
			return
		}
		fmt.Printf("Día de entrenamiento creado con ID: %d\n", workoutDayID)
	} else {
		workoutDayID = existingID
	}

	// Obtener valores de los punteros de forma segura
	var setValue int = 1
	if req.Set != nil {
		setValue = *req.Set
	}

	// Obtener valor de peso de forma segura
	var weightValue float64 = 0
	if req.Weight != nil {
		weightValue = *req.Weight
	}
	
	// Obtener valor de reps de forma segura
	var repsValue int = 0
	if req.Reps != nil {
		repsValue = *req.Reps
	}

	// Verificar si necesitamos crear series automáticamente
	// Solo si la serie es > 1 y no hay otras series del mismo ejercicio ese día
	if setValue > 1 {
		// Validar que setValue no sea excesivamente grande (límite de seguridad)
		if setValue > 20 {
			fmt.Printf("Número de serie demasiado alto: %d\n", setValue)
			http.Error(w, "Número de serie no puede ser mayor a 20", http.StatusBadRequest)
			return
		}

		// Verificar si ya existen series del mismo ejercicio en el día de entrenamiento
		var existingSetsCount int
		checkQuery := `
			SELECT COUNT(*) 
			FROM workouts 
			WHERE user_id = $1 AND workout_day_id = $2 AND exercise_id = $3
		`
		err = database.DB.QueryRow(checkQuery, userID, workoutDayID, req.ExerciseID).Scan(&existingSetsCount)
		if err != nil {
			fmt.Printf("Error verificando series existentes: %v\n", err)
			http.Error(w, "Error verificando series existentes", http.StatusInternalServerError)
			return
		}

		// Si no hay series existentes, crear automáticamente las series faltantes (1 hasta setValue-1)
		if existingSetsCount == 0 {
			fmt.Printf("Creando automáticamente %d series faltantes para ejercicio %d\n", setValue-1, req.ExerciseID)
			
			// Crear las series faltantes en una transacción
			tx, err := database.DB.Begin()
			if err != nil {
				fmt.Printf("Error iniciando transacción: %v\n", err)
				http.Error(w, "Error iniciando transacción", http.StatusInternalServerError)
				return
			}
			defer tx.Rollback()

			// Insertar las series faltantes (1 hasta setValue-1)
			for i := 1; i < setValue; i++ {
				_, err = tx.Exec(`
					INSERT INTO workouts (user_id, workout_day_id, exercise_id, weight, reps, set, seconds, observations)
					VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
				`, userID, workoutDayID, req.ExerciseID, weightValue, repsValue, i, req.Seconds, req.Observations)
				
				if err != nil {
					fmt.Printf("Error creando serie automática %d: %v\n", i, err)
					http.Error(w, "Error creando series automáticas", http.StatusInternalServerError)
					return
				}
			}

			// Confirmar la transacción
			if err = tx.Commit(); err != nil {
				fmt.Printf("Error confirmando transacción: %v\n", err)
				http.Error(w, "Error confirmando transacción", http.StatusInternalServerError)
				return
			}
			
			fmt.Printf("Series automáticas creadas exitosamente\n")
		} else {
			// Si ya existen series, verificar que no haya conflicto con la serie que se está insertando
			var existingSetNumber int
			conflictQuery := `
				SELECT set 
				FROM workouts 
				WHERE user_id = $1 AND workout_day_id = $2 AND exercise_id = $3 AND set = $4
			`
			err = database.DB.QueryRow(conflictQuery, userID, workoutDayID, req.ExerciseID, setValue).Scan(&existingSetNumber)
			if err == nil {
				// La serie ya existe
				fmt.Printf("Serie %d ya existe para ejercicio %d\n", setValue, req.ExerciseID)
				http.Error(w, fmt.Sprintf("La serie %d ya existe para este ejercicio", setValue), http.StatusConflict)
				return
			}
			// Si err != nil, significa que no existe conflicto, continuar normalmente
		}
	}

	// Insertar workout asociado al día de entrenamiento
	query := `
		INSERT INTO workouts (user_id, workout_day_id, exercise_id, weight, reps, set, seconds, observations)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, workout_day_id, created_at
	`

	var workout models.Workout
	workout.UserID = userID
	workout.WorkoutDayID = workoutDayID
	workout.ExerciseID = req.ExerciseID
	// Manejar peso opcional
	if req.Weight != nil {
		workout.Weight = *req.Weight
	} else {
		workout.Weight = 0 // Valor por defecto cuando no se proporciona peso
	}
	// Manejar reps opcional
	if req.Reps != nil {
		workout.Reps = *req.Reps
	} else {
		workout.Reps = 0 // Valor por defecto cuando no se proporcionan reps
	}
	workout.Observations = req.Observations
	
	fmt.Printf("Insertando workout con workoutDayID: %d, weight: %f, reps: %d, set: %d\n", workoutDayID, weightValue, repsValue, setValue)
	err = database.DB.QueryRow(
		query,
		userID, workoutDayID, req.ExerciseID, weightValue, repsValue,
		setValue, req.Seconds, req.Observations,
	).Scan(&workout.ID, &workout.WorkoutDayID, &workout.CreatedAt)

	if err != nil {
		fmt.Printf("Error creando workout: %v\n", err)
		http.Error(w, "Error creando workout", http.StatusInternalServerError)
		return
	}
	
	// Convertir fecha a zona horaria de Argentina antes de devolver
	workout.CreatedAt = convertToArgentinaTime(workout.CreatedAt)
	
	fmt.Printf("Workout creado exitosamente con ID: %d\n", workout.ID)

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(workout)
}

// UpdateWorkoutHandler actualiza un workout existente
func UpdateWorkoutHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "ID inválido", http.StatusBadRequest)
		return
	}

	userID, ok := r.Context().Value("user_id").(string)
	if !ok || userID == "" {
		http.Error(w, "Unauthorized: user_id not found in context", http.StatusUnauthorized)
		return
	}

	var req models.CreateWorkoutRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	// Validaciones
	if req.Reps != nil && *req.Reps <= 0 {
		http.Error(w, "Repeticiones deben ser mayores a 0 si se proporcionan", http.StatusBadRequest)
		return
	}
	
	// Validar peso si se proporciona
	if req.Weight != nil && *req.Weight <= 0 {
		http.Error(w, "Peso debe ser mayor a 0 si se proporciona", http.StatusBadRequest)
		return
	}

	query := `
		UPDATE workouts 
		SET weight = $1, reps = $2, set = $3, seconds = $4, observations = $5
		WHERE id = $6 AND user_id = $7
		RETURNING id, exercise_id, weight, reps, set, seconds, observations, workout_day_id, created_at
	`

	var setValue int = 1
	if req.Set != nil {
		setValue = *req.Set
	}

	// Obtener valor de peso de forma segura
	var weightValue float64 = 0
	if req.Weight != nil {
		weightValue = *req.Weight
	}
	
	// Obtener valor de reps de forma segura
	var repsValue int = 0
	if req.Reps != nil {
		repsValue = *req.Reps
	}

	var workout models.Workout
	err = database.DB.QueryRow(
		query,
		weightValue, repsValue, setValue, req.Seconds, req.Observations,
		id, userID,
	).Scan(
		&workout.ID, &workout.ExerciseID, &workout.Weight, &workout.Reps,
		&workout.Set, &workout.Seconds, &workout.Observations,
		&workout.WorkoutDayID, &workout.CreatedAt,
	)

	if err != nil {
		http.Error(w, "Workout no encontrado o error actualizando", http.StatusNotFound)
		return
	}

	workout.UserID = userID
	workout.CreatedAt = convertToArgentinaTime(workout.CreatedAt)
	json.NewEncoder(w).Encode(workout)
}

// UpdateWorkoutDayNameHandler actualiza el nombre de un día de entrenamiento
func UpdateWorkoutDayNameHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "ID inválido", http.StatusBadRequest)
		return
	}

	userID, ok := r.Context().Value("user_id").(string)
	if !ok || userID == "" {
		http.Error(w, "Unauthorized: user_id not found in context", http.StatusUnauthorized)
		return
	}

	var req struct {
		Name string `json:"name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	// Validaciones
	if req.Name == "" {
		http.Error(w, "El nombre no puede estar vacío", http.StatusBadRequest)
		return
	}

	if len(req.Name) > 100 {
		http.Error(w, "El nombre no puede tener más de 100 caracteres", http.StatusBadRequest)
		return
	}

	query := `
		UPDATE workout_days 
		SET name = $1
		WHERE id = $2 AND user_id = $3
		RETURNING id, user_id, date, name, effort, mood, created_at
	`

	var workoutDay struct {
		ID        int       `json:"id"`
		UserID    string    `json:"user_id"`
		Date      time.Time `json:"date"`
		Name      string    `json:"name"`
		Effort    *int      `json:"effort"`
		Mood      *int      `json:"mood"`
		CreatedAt time.Time `json:"created_at"`
	}

	err = database.DB.QueryRow(query, req.Name, id, userID).Scan(
		&workoutDay.ID, &workoutDay.UserID, &workoutDay.Date,
		&workoutDay.Name, &workoutDay.Effort, &workoutDay.Mood, &workoutDay.CreatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "Día de entrenamiento no encontrado", http.StatusNotFound)
		} else {
			http.Error(w, "Error actualizando el día de entrenamiento", http.StatusInternalServerError)
		}
		return
	}

	workoutDay.CreatedAt = convertToArgentinaTime(workoutDay.CreatedAt)
	json.NewEncoder(w).Encode(workoutDay)
}

// DeleteWorkoutHandler elimina un workout
func DeleteWorkoutHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "ID inválido", http.StatusBadRequest)
		return
	}

	userID, ok := r.Context().Value("user_id").(string)
	if !ok || userID == "" {
		http.Error(w, "Unauthorized: user_id not found in context", http.StatusUnauthorized)
		return
	}

	// Verificar que el workout existe y pertenece al usuario
	var workoutExists bool
	err = database.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM workouts WHERE id = $1 AND user_id = $2)", id, userID).Scan(&workoutExists)
	if err != nil {
		http.Error(w, "Error verificando workout", http.StatusInternalServerError)
		return
	}
	if !workoutExists {
		http.Error(w, "Workout no encontrado", http.StatusNotFound)
		return
	}

	// Eliminar el workout
	_, err = database.DB.Exec("DELETE FROM workouts WHERE id = $1 AND user_id = $2", id, userID)
	if err != nil {
		http.Error(w, "Error eliminando workout", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}


