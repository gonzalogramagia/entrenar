package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/goalritmo/gym/backend/database"
)

// DebugUserRegistrationHandler prueba el registro de usuarios manualmente
func DebugUserRegistrationHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Solo permitir en desarrollo
	if r.Header.Get("X-Debug-Key") != "debug123" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Simular la creación de un usuario de prueba
	testUserID := "test-user-" + fmt.Sprintf("%d", time.Now().Unix())

	// Iniciar transacción
	tx, err := database.DB.Begin()
	if err != nil {
		http.Error(w, "Error iniciando transacción", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	// Probar inserción en user_profiles
	_, err = tx.Exec(`
		INSERT INTO user_profiles (user_id, name, is_admin, role)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (user_id) DO NOTHING
	`, testUserID, "Usuario de Prueba", false, "user")

	if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"error": "Error en user_profiles",
			"details": err.Error(),
		})
		return
	}

	// Probar inserción en user_settings
	_, err = tx.Exec(`
		INSERT INTO user_settings (user_id, has_configured_favorites, favorite_exercises)
		VALUES ($1, $2, $3)
		ON CONFLICT (user_id) DO NOTHING
	`, testUserID, false, []int{})

	if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"error": "Error en user_settings",
			"details": err.Error(),
		})
		return
	}

	// Confirmar transacción
	if err = tx.Commit(); err != nil {
		http.Error(w, "Error confirmando transacción", http.StatusInternalServerError)
		return
	}

	// Limpiar datos de prueba
	go func() {
		time.Sleep(5 * time.Second)
		database.DB.Exec("DELETE FROM user_profiles WHERE user_id = $1", testUserID)
		database.DB.Exec("DELETE FROM user_settings WHERE user_id = $1", testUserID)
	}()

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Registro de prueba exitoso",
		"test_user_id": testUserID,
	})
}
