package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/goalritmo/gym/backend/database"
	"github.com/gorilla/mux"
)

// AdminNotification representa una notificación del administrador
type AdminNotification struct {
	ID          int       `json:"id"`
	Title       string    `json:"title"`
	Message     string    `json:"message"`
	Type        string    `json:"type"` // 'info', 'warning', 'success', 'error'
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	CreatedBy   string    `json:"created_by"`
	UpdatedBy   string    `json:"updated_by"`
}

// AdminExercise representa un ejercicio para el panel de admin
type AdminExercise struct {
	ID               int       `json:"id"`
	Name             string    `json:"name"`
	MuscleGroup      string    `json:"muscle_group"`
	Equipment        string    `json:"equipment"`
	PrimaryMuscles   []string  `json:"primary_muscles"`
	SecondaryMuscles []string  `json:"secondary_muscles"`
	VideoURL         *string   `json:"video_url"`
	Bodyweight       bool      `json:"bodyweight"`
	CreatedAt        time.Time `json:"created_at"`
}

// CreateNotificationRequest representa la solicitud para crear una notificación
type CreateNotificationRequest struct {
	Title    string `json:"title"`
	Message  string `json:"message"`
	Type     string `json:"type"`
}

// UpdateNotificationRequest representa la solicitud para actualizar una notificación
type UpdateNotificationRequest struct {
	Title    string `json:"title"`
	Message  string `json:"message"`
	Type     string `json:"type"`
}

// NotificationHistory representa un registro en el historial de cambios
type NotificationHistory struct {
	ID          int       `json:"id"`
	NotificationID int    `json:"notification_id"`
	Action      string    `json:"action"` // 'created', 'updated'
	OldTitle    *string   `json:"old_title"`
	NewTitle    *string   `json:"new_title"`
	OldMessage  *string   `json:"old_message"`
	NewMessage  *string   `json:"new_message"`
	OldType     *string   `json:"old_type"`
	NewType     *string   `json:"new_type"`
	ChangedBy   string    `json:"changed_by"`
	ChangedAt   time.Time `json:"changed_at"`
}

// CreateExerciseRequest representa la solicitud para crear un ejercicio
type CreateExerciseRequest struct {
	Name             string   `json:"name"`
	MuscleGroup      string   `json:"muscle_group"`
	Equipment        string   `json:"equipment"`
	PrimaryMuscles   []string `json:"primary_muscles"`
	SecondaryMuscles []string `json:"secondary_muscles"`
	VideoURL         *string  `json:"video_url"`
	Bodyweight       bool     `json:"bodyweight"`
}

// Middleware para verificar si el usuario es administrador
func AdminMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := r.Context().Value("user_id").(string)
		if !ok || userID == "" {
			http.Error(w, "Unauthorized: user_id not found in context", http.StatusUnauthorized)
			return
		}

		// Verificar si el usuario es administrador
		var isAdmin bool
		query := `SELECT COALESCE(is_admin, false) FROM user_profiles WHERE user_id = $1`
		err := database.DB.QueryRow(query, userID).Scan(&isAdmin)
		if err != nil {
			// Si no existe el perfil, crear uno por defecto (no admin)
			_, err = database.DB.Exec(`INSERT INTO user_profiles (user_id, is_admin) VALUES ($1, false) ON CONFLICT (user_id) DO NOTHING`, userID)
			if err != nil {
				http.Error(w, "Error verificando permisos de administrador", http.StatusInternalServerError)
				return
			}
			isAdmin = false
		}

		if !isAdmin {
			http.Error(w, "Forbidden: Admin access required", http.StatusForbidden)
			return
		}

		next.ServeHTTP(w, r)
	}
}

// Middleware para verificar si el usuario es administrador o profesor
func AdminOrTeacherMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := r.Context().Value("user_id").(string)
		if !ok || userID == "" {
			http.Error(w, "Unauthorized: user_id not found in context", http.StatusUnauthorized)
			return
		}

		// Verificar si el usuario es administrador o profesor
		var isAdmin bool
		var role string
		query := `SELECT COALESCE(is_admin, false), COALESCE(role, 'user') FROM user_profiles WHERE user_id = $1`
		err := database.DB.QueryRow(query, userID).Scan(&isAdmin, &role)
		if err != nil {
			// Si no existe el perfil, crear uno por defecto
			_, err = database.DB.Exec(`INSERT INTO user_profiles (user_id, is_admin, role) VALUES ($1, false, 'user') ON CONFLICT (user_id) DO NOTHING`, userID)
			if err != nil {
				http.Error(w, "Error verificando permisos", http.StatusInternalServerError)
				return
			}
			isAdmin = false
			role = "user"
		}

		// Permitir acceso si es admin o profesor
		if !isAdmin && role != "profe" {
			http.Error(w, "Forbidden: Admin or Teacher access required", http.StatusForbidden)
			return
		}

		next.ServeHTTP(w, r)
	}
}

// Middleware para verificar si el usuario es administrador, staff o profesor
func AdminStaffOrTeacherMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := r.Context().Value("user_id").(string)
		if !ok || userID == "" {
			http.Error(w, "Unauthorized: user_id not found in context", http.StatusUnauthorized)
			return
		}

		// Verificar si el usuario es administrador, staff o profesor
		var isAdmin bool
		var role string
		query := `SELECT COALESCE(is_admin, false), COALESCE(role, 'user') FROM user_profiles WHERE user_id = $1`
		err := database.DB.QueryRow(query, userID).Scan(&isAdmin, &role)
		if err != nil {
			// Si no existe el perfil, crear uno por defecto
			_, err = database.DB.Exec(`INSERT INTO user_profiles (user_id, is_admin, role) VALUES ($1, false, 'user') ON CONFLICT (user_id) DO NOTHING`, userID)
			if err != nil {
				http.Error(w, "Error verificando permisos", http.StatusInternalServerError)
				return
			}
			isAdmin = false
			role = "user"
		}

		// Permitir acceso si es admin, staff o profesor
		if !isAdmin && role != "profe" && role != "staff" {
			http.Error(w, "Forbidden: Admin, Staff or Teacher access required", http.StatusForbidden)
			return
		}

		next.ServeHTTP(w, r)
	}
}

// GetAdminNotificationsHandler obtiene todas las notificaciones del administrador
func GetAdminNotificationsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	query := `
		SELECT 
			an.id, an.title, an.message, an.type, an.created_at, an.updated_at,
			COALESCE(up_created.name, 'Supabase') as created_by,
			COALESCE(up_updated.name, 'Supabase') as updated_by
		FROM admin_notifications an
		LEFT JOIN user_profiles up_created ON an.created_by = up_created.user_id
		LEFT JOIN user_profiles up_updated ON an.updated_by = up_updated.user_id
		ORDER BY an.created_at DESC
	`

	rows, err := database.DB.Query(query)
	if err != nil {
		http.Error(w, "Error obteniendo notificaciones", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var notifications []AdminNotification
	for rows.Next() {
		var notification AdminNotification
		err := rows.Scan(
			&notification.ID,
			&notification.Title,
			&notification.Message,
			&notification.Type,
			&notification.CreatedAt,
			&notification.UpdatedAt,
			&notification.CreatedBy,
			&notification.UpdatedBy,
		)
		if err != nil {
			http.Error(w, "Error escaneando notificación", http.StatusInternalServerError)
			return
		}
		notifications = append(notifications, notification)
	}

	json.NewEncoder(w).Encode(notifications)
}

// UpdateAdminNotificationHandler actualiza una notificación del sistema
func UpdateAdminNotificationHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userID, ok := r.Context().Value("user_id").(string)
	if !ok || userID == "" {
		http.Error(w, "Unauthorized: user_id not found in context", http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "ID inválido", http.StatusBadRequest)
		return
	}

	var req UpdateNotificationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	// Validaciones
	if req.Title == "" || req.Message == "" {
		http.Error(w, "Título y mensaje son requeridos", http.StatusBadRequest)
		return
	}

	// Iniciar transacción
	tx, err := database.DB.Begin()
	if err != nil {
		http.Error(w, "Error iniciando transacción", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	// Obtener la notificación actual para el historial
	var currentNotification AdminNotification
	err = tx.QueryRow(`
		SELECT id, title, message, type, created_at, updated_at
		FROM admin_notifications WHERE id = $1
	`, id).Scan(
		&currentNotification.ID,
		&currentNotification.Title,
		&currentNotification.Message,
		&currentNotification.Type,
		&currentNotification.CreatedAt,
		&currentNotification.UpdatedAt,
	)
	if err != nil {
		http.Error(w, "Notificación no encontrada", http.StatusNotFound)
		return
	}

	// Registrar en el historial
	_, err = tx.Exec(`
		INSERT INTO notification_history (
			notification_id, action, old_title, new_title, old_message, new_message, 
			old_type, new_type, changed_by, changed_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`, id, "updated", currentNotification.Title, req.Title, currentNotification.Message, req.Message,
		currentNotification.Type, req.Type, userID, time.Now())
	if err != nil {
		http.Error(w, "Error registrando historial", http.StatusInternalServerError)
		return
	}

	// Actualizar la notificación
	_, err = tx.Exec(`
		UPDATE admin_notifications 
		SET title = $1, message = $2, type = $3, updated_at = $4, updated_by = $5
		WHERE id = $6
	`, req.Title, req.Message, req.Type, time.Now(), userID, id)
	if err != nil {
		http.Error(w, "Error actualizando notificación", http.StatusInternalServerError)
		return
	}

	// Actualizar las notificaciones individuales
	_, err = tx.Exec(`
		UPDATE notifications 
		SET title = $1, message = $2, updated_at = $3
		WHERE data::jsonb->>'admin_notification_id' = $4
	`, req.Title, req.Message, time.Now(), id)
	if err != nil {
		http.Error(w, "Error actualizando notificaciones individuales", http.StatusInternalServerError)
		return
	}

	// Confirmar transacción
	if err = tx.Commit(); err != nil {
		http.Error(w, "Error confirmando transacción", http.StatusInternalServerError)
		return
	}

	// Obtener la notificación actualizada
	var updatedNotification AdminNotification
	err = database.DB.QueryRow(`
		SELECT 
			an.id, an.title, an.message, an.type, an.created_at, an.updated_at,
			COALESCE(up_created.name, 'Supabase') as created_by,
			COALESCE(up_updated.name, 'Supabase') as updated_by
		FROM admin_notifications an
		LEFT JOIN user_profiles up_created ON an.created_by = up_created.user_id
		LEFT JOIN user_profiles up_updated ON an.updated_by = up_updated.user_id
		WHERE an.id = $1
	`, id).Scan(
		&updatedNotification.ID,
		&updatedNotification.Title,
		&updatedNotification.Message,
		&updatedNotification.Type,
		&updatedNotification.CreatedAt,
		&updatedNotification.UpdatedAt,
		&updatedNotification.CreatedBy,
		&updatedNotification.UpdatedBy,
	)
	if err != nil {
		http.Error(w, "Error obteniendo notificación actualizada", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(updatedNotification)
}

// GetNotificationHistoryHandler obtiene el historial de cambios de una notificación
func GetNotificationHistoryHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "ID inválido", http.StatusBadRequest)
		return
	}

	query := `
		SELECT 
			nh.id, nh.notification_id, nh.action, nh.old_title, nh.new_title,
			nh.old_message, nh.new_message, nh.old_type, nh.new_type,
			COALESCE(up.name, 'Supabase') as changed_by, nh.changed_at
		FROM notification_history nh
		LEFT JOIN user_profiles up ON nh.changed_by = up.user_id
		WHERE nh.notification_id = $1
		ORDER BY nh.changed_at DESC
	`

	rows, err := database.DB.Query(query, id)
	if err != nil {
		http.Error(w, "Error obteniendo historial", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var history []NotificationHistory
	for rows.Next() {
		var record NotificationHistory
		err := rows.Scan(
			&record.ID,
			&record.NotificationID,
			&record.Action,
			&record.OldTitle,
			&record.NewTitle,
			&record.OldMessage,
			&record.NewMessage,
			&record.OldType,
			&record.NewType,
			&record.ChangedBy,
			&record.ChangedAt,
		)
		if err != nil {
			http.Error(w, "Error escaneando historial", http.StatusInternalServerError)
			return
		}
		history = append(history, record)
	}

	json.NewEncoder(w).Encode(history)
}

// DeleteAdminNotificationHandler elimina una notificación del sistema
func DeleteAdminNotificationHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "ID inválido", http.StatusBadRequest)
		return
	}

	// Verificar que la notificación existe
	var notificationExists bool
	err = database.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM admin_notifications WHERE id = $1)", id).Scan(&notificationExists)
	if err != nil {
		http.Error(w, "Error verificando notificación", http.StatusInternalServerError)
		return
	}
	if !notificationExists {
		http.Error(w, "Notificación no encontrada", http.StatusNotFound)
		return
	}

	// Iniciar transacción
	tx, err := database.DB.Begin()
	if err != nil {
		http.Error(w, "Error iniciando transacción", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	// 1. Eliminar la notificación del sistema
	_, err = tx.Exec("DELETE FROM admin_notifications WHERE id = $1", id)
	if err != nil {
		http.Error(w, "Error eliminando notificación del sistema", http.StatusInternalServerError)
		return
	}

	// 2. Eliminar todas las notificaciones individuales asociadas
	_, err = tx.Exec("DELETE FROM notifications WHERE data::jsonb->>'admin_notification_id' = $1", id)
	if err != nil {
		http.Error(w, "Error eliminando notificaciones individuales", http.StatusInternalServerError)
		return
	}

	// Confirmar transacción
	if err = tx.Commit(); err != nil {
		http.Error(w, "Error confirmando transacción", http.StatusInternalServerError)
		return
	}

	fmt.Printf("Notificación del sistema eliminada con ID %d\n", id)

	response := map[string]interface{}{
		"message": "Notificación eliminada exitosamente",
		"id":      id,
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// CreateNotificationHandler crea una nueva notificación del administrador
func CreateNotificationHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userID, ok := r.Context().Value("user_id").(string)
	if !ok || userID == "" {
		http.Error(w, "Unauthorized: user_id not found in context", http.StatusUnauthorized)
		return
	}

	var req CreateNotificationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Error decodificando solicitud", http.StatusBadRequest)
		return
	}

	// Validar campos requeridos
	if req.Title == "" || req.Message == "" {
		http.Error(w, "Título y mensaje son requeridos", http.StatusBadRequest)
		return
	}

	// Validar tipo de notificación
	validTypes := map[string]bool{"info": true, "warning": true, "success": true, "error": true}
	if !validTypes[req.Type] {
		req.Type = "info" // Valor por defecto
	}

	// Iniciar transacción
	tx, err := database.DB.Begin()
	if err != nil {
		http.Error(w, "Error iniciando transacción", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	// 1. Crear la notificación del sistema
	adminQuery := `
		INSERT INTO admin_notifications (title, message, type, created_by, updated_by)
		VALUES ($1, $2, $3, $4, $4)
		RETURNING id, created_at, updated_at
	`

	var notification AdminNotification
	err = tx.QueryRow(adminQuery, req.Title, req.Message, req.Type, userID).Scan(
		&notification.ID,
		&notification.CreatedAt,
		&notification.UpdatedAt,
	)

	if err != nil {
		http.Error(w, "Error creando notificación del sistema", http.StatusInternalServerError)
		return
	}

	// Registrar en el historial
	_, err = tx.Exec(`
		INSERT INTO notification_history (
			notification_id, action, new_title, new_message, new_type, changed_by, changed_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7)
	`, notification.ID, "created", req.Title, req.Message, req.Type, userID, time.Now())
	if err != nil {
		http.Error(w, "Error registrando historial", http.StatusInternalServerError)
		return
	}

	// Confirmar transacción (solo admin_notification + notification_history)
	if err := tx.Commit(); err != nil {
		http.Error(w, "Error confirmando transacción", http.StatusInternalServerError)
		return
	}

	notification.Title = req.Title
	notification.Message = req.Message
	notification.Type = req.Type

	fmt.Printf("Notificación del sistema creada con ID %d. Las notificaciones individuales se crearán cuando los usuarios inicien sesión.\n", notification.ID)

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(notification)
}

// GetAdminExercisesHandler obtiene todos los ejercicios para el panel de admin
func GetAdminExercisesHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")



	// Primero verificar si la tabla existe
	var tableExists bool
	err := database.DB.QueryRow("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'exercises')").Scan(&tableExists)
	if err != nil {
		http.Error(w, "Error verificando estructura de base de datos", http.StatusInternalServerError)
		return
	}

	if !tableExists {
		// Devolver array vacío en lugar de error
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode([]AdminExercise{})
		return
	}

	query := `
		SELECT 
			id, name, muscle_group, equipment, video_url, created_at
		FROM exercises
		ORDER BY name ASC
	`

	rows, err := database.DB.Query(query)
	if err != nil {
		http.Error(w, "Error obteniendo ejercicios", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var exercises []AdminExercise
	count := 0
	for rows.Next() {
		var exercise AdminExercise
		var muscleGroup sql.NullString
		var equipment sql.NullString
		var videoURL sql.NullString
		
		err := rows.Scan(
			&exercise.ID,
			&exercise.Name,
			&muscleGroup,
			&equipment,
			&videoURL,
			&exercise.CreatedAt,
		)
		if err != nil {
			http.Error(w, "Error escaneando ejercicio", http.StatusInternalServerError)
			return
		}

		// Manejar valores NULL
		if muscleGroup.Valid {
			exercise.MuscleGroup = muscleGroup.String
		} else {
			exercise.MuscleGroup = "General"
		}
		
		if equipment.Valid {
			exercise.Equipment = equipment.String
		} else {
			exercise.Equipment = "Peso libre"
		}
		
		if videoURL.Valid {
			exercise.VideoURL = &videoURL.String
		} else {
			exercise.VideoURL = nil
		}

		// Arrays vacíos por defecto
		exercise.PrimaryMuscles = []string{}
		exercise.SecondaryMuscles = []string{}
		
		exercises = append(exercises, exercise)
		count++
	}

	json.NewEncoder(w).Encode(exercises)
}

// CreateExerciseHandler crea un nuevo ejercicio
func CreateExerciseHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var req CreateExerciseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Error decodificando solicitud", http.StatusBadRequest)
		return
	}

	// Validar campos requeridos
	if req.Name == "" || req.MuscleGroup == "" {
		http.Error(w, "Nombre y grupo muscular son requeridos", http.StatusBadRequest)
		return
	}

	query := `
		INSERT INTO exercises (name, muscle_group, equipment, video_url, bodyweight)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at
	`

	// Usar "Peso libre" como default
	equipment := "Peso libre"

	var exercise AdminExercise
	err := database.DB.QueryRow(query, 
		req.Name, 
		req.MuscleGroup, 
		equipment,
		req.VideoURL,
		req.Bodyweight,
	).Scan(&exercise.ID, &exercise.CreatedAt)

	if err != nil {
		http.Error(w, fmt.Sprintf("Error creando ejercicio: %v", err), http.StatusInternalServerError)
		return
	}

	exercise.Name = req.Name
	exercise.MuscleGroup = req.MuscleGroup
	exercise.Equipment = "Peso libre"
	exercise.PrimaryMuscles = []string{}
	exercise.SecondaryMuscles = []string{}
	exercise.VideoURL = req.VideoURL
	exercise.Bodyweight = req.Bodyweight

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(exercise)
}
