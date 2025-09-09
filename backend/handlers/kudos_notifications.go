package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/goalritmo/gym/backend/database"
)

// CreateKudosNotificationHandler crea o actualiza una notificación de kudos
func CreateKudosNotificationHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Obtener datos del request
	var req struct {
		WorkoutDayID int    `json:"workout_day_id"`
		FromUserID   string `json:"from_user_id"`
		ToUserID     string `json:"to_user_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Error decodificando solicitud", http.StatusBadRequest)
		return
	}

	// Verificar que el usuario que da kudos existe
	var fromUserName string
	err := database.DB.QueryRow("SELECT COALESCE(up.name, u.email) FROM auth.users u LEFT JOIN user_profiles up ON u.id = up.user_id WHERE u.id = $1", req.FromUserID).Scan(&fromUserName)
	if err != nil {
		http.Error(w, "Usuario que da kudos no encontrado", http.StatusNotFound)
		return
	}

	// Verificar que existe el workout day
	var workoutDate time.Time
	err = database.DB.QueryRow("SELECT created_at FROM workout_days WHERE id = $1 AND user_id = $2", req.WorkoutDayID, req.ToUserID).Scan(&workoutDate)
	if err != nil {
		http.Error(w, "Entrenamiento no encontrado", http.StatusNotFound)
		return
	}

	// Buscar si ya existe una notificación de kudos para este workout
	var existingNotificationID int
	var existingData map[string]interface{}
	
	checkQuery := `
		SELECT id, data 
		FROM notifications 
		WHERE user_id = $1 AND type = 'kudos' AND data::jsonb->>'workout_day_id' = $2
	`
	
	err = database.DB.QueryRow(checkQuery, req.ToUserID, fmt.Sprintf("%d", req.WorkoutDayID)).Scan(&existingNotificationID, &existingData)
	
	if err != nil {
		// No existe notificación, crear una nueva
		notificationData := map[string]interface{}{
			"workout_day_id": req.WorkoutDayID,
			"from_users": []map[string]interface{}{
				{
					"id":   req.FromUserID,
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
			req.ToUserID,
			"kudos",
			"¡Felicidades! 🎉",
			fmt.Sprintf("Recibiste kudos de %s por tu entrenamiento del %s", fromUserName, formatDate(workoutDate)),
			string(dataJSON),
			time.Now(),
		).Scan(&notificationID)
		
		if err != nil {
			fmt.Printf("Error creando notificación de kudos: %v\n", err)
			http.Error(w, "Error creando notificación de kudos", http.StatusInternalServerError)
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
				if userMap["id"] == req.FromUserID {
					userAlreadyExists = true
					break
				}
			}
		}
		
		if !userAlreadyExists {
			// Agregar nuevo usuario
			fromUsers = append(fromUsers, map[string]interface{}{
				"id":   req.FromUserID,
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
				http.Error(w, "Error actualizando notificación de kudos", http.StatusInternalServerError)
				return
			}
			
			fmt.Printf("Notificación de kudos actualizada con ID %d\n", existingNotificationID)
		}
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Kudos notification created/updated successfully",
	})
}


