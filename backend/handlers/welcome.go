package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/goalritmo/gym/backend/database"
)

// CreateWelcomeNotificationHandler crea una notificación de bienvenida para un nuevo usuario
func CreateWelcomeNotificationHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userID, ok := r.Context().Value("user_id").(string)
	if !ok || userID == "" {
		http.Error(w, "Unauthorized: user_id not found in context", http.StatusUnauthorized)
		return
	}

	// Verificar si el usuario ya tiene una notificación de bienvenida
	checkQuery := `
		SELECT COUNT(*) FROM notifications 
		WHERE user_id = $1 AND type = 'welcome'
	`
	
	var existingCount int
	err := database.DB.QueryRow(checkQuery, userID).Scan(&existingCount)
	if err != nil {
		http.Error(w, "Error verificando notificaciones existentes", http.StatusInternalServerError)
		return
	}

	// Si ya existe una notificación de bienvenida, no crear otra
	if existingCount > 0 {
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{
			"message": "Welcome notification already exists",
		})
		return
	}

	// Crear notificación de bienvenida
	insertQuery := `
		INSERT INTO notifications (user_id, type, title, message, created_at)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id
	`

	var notificationID int
	err = database.DB.QueryRow(
		insertQuery,
		userID,
		"welcome",
		"¡Te damos la bienvenida! 🎉",
		"¡Estamos emocionados de que te unas a nuestra comunidad fitness! Aquí podrás registrar tus entrenamientos, ver tu progreso y conectar con otros usuarios de la UNC. ¡Buen entrenamiento!",
		time.Now(),
	).Scan(&notificationID)

	if err != nil {
		fmt.Printf("Error creando notificación de bienvenida: %v\n", err)
		http.Error(w, "Error creando notificación de bienvenida", http.StatusInternalServerError)
		return
	}

	fmt.Printf("Notificación de bienvenida creada con ID %d para usuario %s\n", notificationID, userID)

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"id":      notificationID,
		"message": "Welcome notification created successfully",
	})
}

// GetWelcomeNotificationHandler obtiene la notificación de bienvenida del usuario
func GetWelcomeNotificationHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userID, ok := r.Context().Value("user_id").(string)
	if !ok || userID == "" {
		http.Error(w, "Unauthorized: user_id not found in context", http.StatusUnauthorized)
		return
	}

	query := `
		SELECT id, type, title, message, created_at, is_read
		FROM notifications 
		WHERE user_id = $1 AND type = 'welcome'
		ORDER BY created_at DESC
		LIMIT 1
	`

	type WelcomeNotification struct {
		ID        int       `json:"id"`
		Type      string    `json:"type"`
		Title     string    `json:"title"`
		Message   string    `json:"message"`
		CreatedAt time.Time `json:"created_at"`
		IsRead    bool      `json:"is_read"`
	}

	var notification WelcomeNotification
	err := database.DB.QueryRow(query, userID).Scan(
		&notification.ID,
		&notification.Type,
		&notification.Title,
		&notification.Message,
		&notification.CreatedAt,
		&notification.IsRead,
	)

	if err != nil {
		// Si no hay notificación de bienvenida, devolver 404
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{
			"message": "Welcome notification not found",
		})
		return
	}

	json.NewEncoder(w).Encode(notification)
}
