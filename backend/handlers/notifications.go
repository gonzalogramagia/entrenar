package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gorilla/mux"
	"github.com/goalritmo/gym/backend/database"
)

// Notification representa una notificación del usuario
type Notification struct {
	ID        int       `json:"id" db:"id"`
	UserID    string    `json:"user_id" db:"user_id"`
	Type      string    `json:"type" db:"type"`
	Title     string    `json:"title" db:"title"`
	Message   string    `json:"message" db:"message"`
	Data      *string   `json:"data" db:"data"`
	IsRead    bool      `json:"is_read" db:"is_read"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

// GetNotificationsHandler obtiene las notificaciones del usuario
func GetNotificationsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userID, ok := r.Context().Value("user_id").(string)
	if !ok || userID == "" {
		http.Error(w, "Unauthorized: user_id not found in context", http.StatusUnauthorized)
		return
	}

	fmt.Printf("GetNotificationsHandler llamado para usuario: %s\n", userID)

	// Obtener parámetros de paginación
	limit := 20
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

	query := `
		SELECT id, user_id, type, title, message, data, is_read, created_at
		FROM notifications 
		WHERE user_id = $1 
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := database.DB.Query(query, userID, limit, offset)
	if err != nil {
		fmt.Printf("Error consultando notificaciones: %v\n", err)
		http.Error(w, "Error consultando notificaciones", http.StatusInternalServerError)
		return
	}
	fmt.Printf("Query ejecutada exitosamente para usuario %s\n", userID)
	defer rows.Close()

	var notifications []Notification
	for rows.Next() {
		var notification Notification
		err := rows.Scan(
			&notification.ID,
			&notification.UserID,
			&notification.Type,
			&notification.Title,
			&notification.Message,
			&notification.Data,
			&notification.IsRead,
			&notification.CreatedAt,
		)
		if err != nil {
			fmt.Printf("Error escaneando notificación: %v\n", err)
			continue
		}

		// Convertir fecha a zona horaria de Argentina
		notification.CreatedAt = convertToArgentinaTime(notification.CreatedAt)
		notifications = append(notifications, notification)

	}



	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(notifications)
}

// MarkNotificationAsReadHandler marca una notificación como leída
func MarkNotificationAsReadHandler(w http.ResponseWriter, r *http.Request) {
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

	query := `
		UPDATE notifications 
		SET is_read = true, updated_at = NOW()
		WHERE id = $1 AND user_id = $2
		RETURNING id, user_id, type, title, message, data, is_read, created_at
	`

	var notification Notification
	err = database.DB.QueryRow(query, id, userID).Scan(
		&notification.ID,
		&notification.UserID,
		&notification.Type,
		&notification.Title,
		&notification.Message,
		&notification.Data,
		&notification.IsRead,
		&notification.CreatedAt,
	)

	if err != nil {
		http.Error(w, "Notificación no encontrada", http.StatusNotFound)
		return
	}

	notification.CreatedAt = convertToArgentinaTime(notification.CreatedAt)

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(notification)
}

// MarkAllNotificationsAsReadHandler marca todas las notificaciones del usuario como leídas
func MarkAllNotificationsAsReadHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userID, ok := r.Context().Value("user_id").(string)
	if !ok || userID == "" {
		http.Error(w, "Unauthorized: user_id not found in context", http.StatusUnauthorized)
		return
	}

	query := `
		UPDATE notifications 
		SET is_read = true, updated_at = NOW()
		WHERE user_id = $1 AND is_read = false
	`

	result, err := database.DB.Exec(query, userID)
	if err != nil {
		fmt.Printf("Error marcando notificaciones como leídas: %v\n", err)
		http.Error(w, "Error marcando notificaciones como leídas", http.StatusInternalServerError)
		return
	}

	rowsAffected, _ := result.RowsAffected()
	fmt.Printf("Marcadas %d notificaciones como leídas para usuario %s\n", rowsAffected, userID)

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": fmt.Sprintf("Marcadas %d notificaciones como leídas", rowsAffected),
		"count":   rowsAffected,
	})
}

// GetUnreadNotificationsCountHandler obtiene el conteo de notificaciones no leídas
func GetUnreadNotificationsCountHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userID, ok := r.Context().Value("user_id").(string)
	if !ok || userID == "" {
		http.Error(w, "Unauthorized: user_id not found in context", http.StatusUnauthorized)
		return
	}

	query := `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false`

	var count int
	err := database.DB.QueryRow(query, userID).Scan(&count)
	if err != nil {
		fmt.Printf("Error contando notificaciones no leídas: %v\n", err)
		http.Error(w, "Error contando notificaciones", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"unread_count": count,
	})
}

// GetSystemNotificationsHandler obtiene las notificaciones del sistema (admin_notifications)
func GetSystemNotificationsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	query := `
		SELECT id, title, message, type, created_at
		FROM admin_notifications 
		ORDER BY created_at DESC
	`

	rows, err := database.DB.Query(query)
	if err != nil {
		fmt.Printf("Error consultando notificaciones del sistema: %v\n", err)
		http.Error(w, "Error consultando notificaciones del sistema", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var notifications []map[string]interface{}
	for rows.Next() {
		var id int
		var title, message, notificationType string
		var createdAt time.Time
		
		err := rows.Scan(&id, &title, &message, &notificationType, &createdAt)
		if err != nil {
			fmt.Printf("Error escaneando notificación del sistema: %v\n", err)
			continue
		}

		// Convertir fecha a zona horaria de Argentina
		createdAt = convertToArgentinaTime(createdAt)
		
		// Determinar prioridad basada en el tipo
		priority := "medium"
		if notificationType == "error" {
			priority = "high"
		}
		
		notifications = append(notifications, map[string]interface{}{
			"id":         id,
			"type":       "announcement",
			"title":      title,
			"message":    message,
			"created_at": createdAt,
			"read":       false, // Las notificaciones del sistema siempre se muestran como no leídas
			"priority":   priority,
		})
	}



	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(notifications)
}

// DeleteNotificationHandler elimina una notificación
func DeleteNotificationHandler(w http.ResponseWriter, r *http.Request) {
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

	// Verificar que la notificación existe y pertenece al usuario
	var notificationExists bool
	err = database.DB.QueryRow("SELECT EXISTS(SELECT 1 FROM notifications WHERE id = $1 AND user_id = $2)", id, userID).Scan(&notificationExists)
	if err != nil {
		http.Error(w, "Error verificando notificación", http.StatusInternalServerError)
		return
	}
	if !notificationExists {
		http.Error(w, "Notificación no encontrada", http.StatusNotFound)
		return
	}

	// Eliminar la notificación
	_, err = database.DB.Exec("DELETE FROM notifications WHERE id = $1 AND user_id = $2", id, userID)
	if err != nil {
		http.Error(w, "Error eliminando notificación", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}


