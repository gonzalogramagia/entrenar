package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/goalritmo/gym/backend/database"
)

// UpdateLastSignInHandler actualiza el last_sign_in_at del usuario
func UpdateLastSignInHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userID, ok := r.Context().Value("user_id").(string)
	if !ok || userID == "" {
		http.Error(w, "Unauthorized: user_id not found in context", http.StatusUnauthorized)
		return
	}

	// Actualizar last_sign_in_at
	_, err := database.DB.Exec("UPDATE auth.users SET last_sign_in_at = $1 WHERE id = $2", time.Now(), userID)
	if err != nil {
		http.Error(w, "Error actualizando último acceso", http.StatusInternalServerError)
		return
	}

	// Crear notificaciones individuales para el usuario si no existen
	// Usar una transacción para evitar condiciones de carrera
	fmt.Printf("Debug: Iniciando creación de notificaciones para usuario %s\n", userID)
	err = createUserNotificationsWithTransaction(userID)
	if err != nil {
		// No fallar si hay error creando notificaciones, solo log
		fmt.Printf("Error creando notificaciones para usuario %s: %v\n", userID, err)
	} else {
		fmt.Printf("Debug: Proceso de creación de notificaciones completado para usuario %s\n", userID)
	}

	json.NewEncoder(w).Encode(map[string]string{"message": "Last sign in updated"})
}

// createUserNotificationsWithTransaction crea notificaciones individuales usando una transacción para evitar condiciones de carrera
func createUserNotificationsWithTransaction(userID string) error {
	// Iniciar transacción
	tx, err := database.DB.Begin()
	if err != nil {
		return fmt.Errorf("error iniciando transacción: %v", err)
	}
	defer tx.Rollback()

	fmt.Printf("Debug: Buscando admin_notifications para usuario %s\n", userID)
	
	// Obtener admin_notifications de los últimos 10 días que no tienen notificaciones individuales para este usuario
	query := `
		SELECT an.id, an.title, an.message, an.type
		FROM admin_notifications an
		WHERE an.created_at >= NOW() - INTERVAL '10 days'
		AND NOT EXISTS (
			SELECT 1 FROM notifications n 
			WHERE n.user_id = $1 
			AND n.type = 'announcement'
			AND n.data::jsonb->>'admin_notification_id' = an.id::text
		)
		ORDER BY an.created_at DESC
		FOR UPDATE SKIP LOCKED
	`

	fmt.Printf("Debug: Ejecutando query con userID: %s\n", userID)
	rows, err := tx.Query(query, userID)
	if err != nil {
		fmt.Printf("Debug: Error en Query: %v\n", err)
		return fmt.Errorf("error consultando admin_notifications: %v", err)
	}
	defer rows.Close()

	fmt.Printf("Debug: Query ejecutada exitosamente, procesando resultados...\n")
	
	var createdCount int
	var foundCount int
	for rows.Next() {
		foundCount++
		fmt.Printf("Debug: Procesando fila %d\n", foundCount)
		
		var adminID int
		var title, message, notificationType string

		err := rows.Scan(&adminID, &title, &message, &notificationType)
		if err != nil {
			fmt.Printf("Error escaneando admin_notification: %v\n", err)
			continue
		}
		
		fmt.Printf("Debug: Procesando admin_notification ID %d: %s\n", adminID, title)

		// Preparar datos para la notificación
		notificationData := map[string]interface{}{
			"admin_notification_id": adminID,
			"type":                  notificationType,
		}
		dataJSON, err := json.Marshal(notificationData)
		if err != nil {
			fmt.Printf("Error marshaling notification data: %v\n", err)
			continue
		}

		fmt.Printf("Debug: Intentando insertar notificación para admin_notification %d\n", adminID)
		
		// Crear notificación individual dentro de la transacción
		_, err = tx.Exec(`
			INSERT INTO notifications (user_id, type, title, message, data, is_read)
			VALUES ($1, $2, $3, $4, $5, false)
		`, userID, "announcement", title, message, string(dataJSON))

		if err != nil {
			fmt.Printf("Error creando notificación individual para admin_notification %d: %v\n", adminID, err)
		} else {
			createdCount++
			fmt.Printf("Debug: Notificación creada exitosamente para admin_notification %d\n", adminID)
		}
	}

	fmt.Printf("Debug: Bucle completado. Verificando si hubo error en rows.Err()...\n")
	if err := rows.Err(); err != nil {
		fmt.Printf("Debug: Error en rows.Err(): %v\n", err)
		return fmt.Errorf("error iterando admin_notifications: %v", err)
	}

	// Confirmar transacción
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("error confirmando transacción: %v", err)
	}

	fmt.Printf("Debug: Encontradas %d admin_notifications, creadas %d notificaciones individuales para usuario %s\n", foundCount, createdCount, userID)

	return nil
}

// createUserNotifications crea notificaciones individuales para el usuario basadas en admin_notifications de los últimos 10 días
func createUserNotifications(userID string) error {
	fmt.Printf("Debug: Buscando admin_notifications para usuario %s\n", userID)
	
	// Obtener admin_notifications de los últimos 10 días que no tienen notificaciones individuales para este usuario
	query := `
		SELECT an.id, an.title, an.message, an.type
		FROM admin_notifications an
		WHERE an.created_at >= NOW() - INTERVAL '10 days'
		AND NOT EXISTS (
			SELECT 1 FROM notifications n 
			WHERE n.user_id = $1 
			AND n.type = 'announcement'
			AND n.data::jsonb->>'admin_notification_id' = an.id::text
		)
		ORDER BY an.created_at DESC
	`

	fmt.Printf("Debug: Ejecutando query con userID: %s\n", userID)
	rows, err := database.DB.Query(query, userID)
	if err != nil {
		fmt.Printf("Debug: Error en Query: %v\n", err)
		return fmt.Errorf("error consultando admin_notifications: %v", err)
	}
	defer rows.Close()

	fmt.Printf("Debug: Query ejecutada exitosamente, procesando resultados...\n")
	
	var createdCount int
	var foundCount int
	for rows.Next() {
		foundCount++
		fmt.Printf("Debug: Procesando fila %d\n", foundCount)
		
		var adminID int
		var title, message, notificationType string

		err := rows.Scan(&adminID, &title, &message, &notificationType)
		if err != nil {
			fmt.Printf("Error escaneando admin_notification: %v\n", err)
			continue
		}
		
		fmt.Printf("Debug: Procesando admin_notification ID %d: %s\n", adminID, title)

		// Preparar datos para la notificación
		notificationData := map[string]interface{}{
			"admin_notification_id": adminID,
			"type":                  notificationType,
		}
		dataJSON, err := json.Marshal(notificationData)
		if err != nil {
			fmt.Printf("Error marshaling notification data: %v\n", err)
			continue
		}

		fmt.Printf("Debug: Intentando insertar notificación para admin_notification %d\n", adminID)
		
		// Crear notificación individual
		_, err = database.DB.Exec(`
			INSERT INTO notifications (user_id, type, title, message, data, is_read)
			VALUES ($1, $2, $3, $4, $5, false)
		`, userID, "announcement", title, message, string(dataJSON))

		if err != nil {
			fmt.Printf("Error creando notificación individual para admin_notification %d: %v\n", adminID, err)
		} else {
			createdCount++
			fmt.Printf("Debug: Notificación creada exitosamente para admin_notification %d\n", adminID)
		}
	}

	fmt.Printf("Debug: Bucle completado. Verificando si hubo error en rows.Err()...\n")
	if err := rows.Err(); err != nil {
		fmt.Printf("Debug: Error en rows.Err(): %v\n", err)
		return fmt.Errorf("error iterando admin_notifications: %v", err)
	}

	fmt.Printf("Debug: Encontradas %d admin_notifications, creadas %d notificaciones individuales para usuario %s\n", foundCount, createdCount, userID)

	return nil
}
