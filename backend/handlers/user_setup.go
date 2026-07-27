package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gonzagramaglia/entrenate/backend/database"
)

// UserSetupRequest representa la solicitud para configurar un usuario
type UserSetupRequest struct {
	UserID   string `json:"user_id"`
	Email    string `json:"email"`
	Name     string `json:"name"`
	Language string `json:"language"`
}

// UserSetupHandler crea los registros necesarios para un usuario recién registrado
func UserSetupHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Verificar que el usuario está autenticado
	userID, ok := r.Context().Value("user_id").(string)
	if !ok || userID == "" {
		http.Error(w, "Unauthorized: user_id not found in context", http.StatusUnauthorized)
		return
	}

	// Decodificar la solicitud
	var req UserSetupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Verificar que el user_id coincide con el usuario autenticado
	if req.UserID != userID {
		http.Error(w, "Unauthorized: user_id mismatch", http.StatusUnauthorized)
		return
	}

	// Iniciar transacción
	tx, err := database.DB.Begin()
	if err != nil {
		fmt.Printf("Error iniciando transacción: %v\n", err)
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	// Obtener nombre de Google desde la base de datos
	var fullName string
	var avatarURL string
	err = tx.QueryRow(`
		SELECT 
			COALESCE(
				raw_user_meta_data->>'name',
				raw_user_meta_data->>'given_name',
				raw_user_meta_data->>'display_name',
				$1
			) as user_name,
			COALESCE(raw_user_meta_data->>'avatar_url', '') as avatar_url
		FROM auth.users 
		WHERE id = $2
	`, req.Name, req.UserID).Scan(&fullName, &avatarURL)

	if err != nil {
		fmt.Printf("Error obteniendo nombre de Google: %v\n", err)
		// Fallback al nombre proporcionado o email
		fullName = req.Name
		if fullName == "" {
			fullName = extractNameFromEmail(req.Email)
		}
	}

	// Extraer solo el primer nombre
	userName := extractFirstName(fullName)
	fmt.Printf("🔧 SetupUser - UserID: %s, FullName: %s, FinalName: %s\n", req.UserID, fullName, userName)

	// 1. Crear perfil de usuario
	result, err := tx.Exec(`
		INSERT INTO user_profiles (user_id, name, is_admin, role, avatar_url)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (user_id) DO UPDATE SET
			name = EXCLUDED.name,
			is_admin = EXCLUDED.is_admin,
			avatar_url = EXCLUDED.avatar_url
			-- No actualizar el rol para preservar roles existentes
	`, req.UserID, userName, false, "user", avatarURL)

	if err == nil {
		rowsAffected, _ := result.RowsAffected()
		fmt.Printf("✅ Perfil creado/actualizado para %s: %d filas afectadas\n", req.UserID, rowsAffected)
	}

	if err != nil {
		fmt.Printf("Error creando perfil: %v\n", err)
		http.Error(w, "Error creating user profile", http.StatusInternalServerError)
		return
	}

	// 2. user_settings ya no se usa (se maneja con localStorage)

	// 3. Crear notificación de bienvenida (solo si no existe)
	fmt.Printf("Creando notificación de bienvenida para usuario %s\n", req.UserID)
	title := "¡Te damos la bienvenida! 🎉"
	message := "¡Estamos emocionados de que te unas a nuestra comunidad fitness! Aquí podrás registrar tus entrenamientos, crear rutinas y ver tu progreso. ¡Buen entrenamiento!"

	if req.Language == "en" {
		title = "Welcome! 🎉"
		message = "We're excited to have you join our fitness community! Here you can register your workouts, create routines, and track your progress. Have a great workout!"
	}

	result, err = tx.Exec(`
		INSERT INTO notifications (user_id, title, message, type, created_at)
		SELECT $1, $2, $3, $4, $5
		WHERE NOT EXISTS (
			SELECT 1 FROM notifications 
			WHERE user_id = $1 AND type = 'welcome'
		)
	`, req.UserID, title, message, "welcome", time.Now())

	if err != nil {
		fmt.Printf("Error creando notificación: %v\n", err)
		// No es crítico si falla la notificación
	} else {
		rowsAffected, _ := result.RowsAffected()
		fmt.Printf("Notificación de bienvenida creada: %d filas afectadas\n", rowsAffected)
	}

	// Confirmar transacción
	if err = tx.Commit(); err != nil {
		fmt.Printf("Error confirmando transacción: %v\n", err)
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	// Responder con éxito
	json.NewEncoder(w).Encode(map[string]string{
		"message": "User setup completed successfully",
		"user_id": req.UserID,
		"name":    userName,
	})
}

// extractNameFromEmail extrae el nombre del email
func extractNameFromEmail(email string) string {
	// Buscar el @ y tomar la parte antes
	for i, char := range email {
		if char == '@' {
			return email[:i]
		}
	}
	return email
}

// extractFirstName extrae el nombre completo, no solo el primer nombre
func extractFirstName(fullName string) string {
	// Limpiar espacios al inicio y final
	fullName = strings.TrimSpace(fullName)

	// Si está vacío, devolver tal como está
	if fullName == "" {
		return fullName
	}

	// Capitalizar la primera letra de cada palabra
	words := strings.Fields(fullName)
	var capitalizedWords []string

	for _, word := range words {
		if len(word) > 0 {
			capitalizedWords = append(capitalizedWords, strings.ToUpper(string(word[0]))+strings.ToLower(word[1:]))
		}
	}

	return strings.Join(capitalizedWords, " ")
}
