package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/goalritmo/gym/backend/database"
)

// SupabaseUser representa información básica del usuario de Supabase Auth
type SupabaseUser struct {
	ID       string                 `json:"id"`
	Email    *string                `json:"email"`
	Metadata map[string]interface{} `json:"user_metadata"`
	IsAdmin  bool                   `json:"is_admin"`
	Role     string                 `json:"role"`
	ProfileName *string             `json:"profile_name"`
}

// GetCurrentUserHandler obtiene el usuario actual desde Supabase Auth
func GetCurrentUserHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userID, ok := r.Context().Value("user_id").(string)
	if !ok || userID == "" {
		http.Error(w, "Unauthorized: user_id not found in context", http.StatusUnauthorized)
		return
	}

	// Consultar información básica del usuario desde auth.users y user_profiles
	query := `
		SELECT 
			u.id,
			u.email,
			COALESCE(u.raw_user_meta_data, '{}')::jsonb as user_metadata,
			COALESCE(up.is_admin, false) as is_admin,
			COALESCE(up.role, 'user') as role,
			up.name as profile_name
		FROM auth.users u
		LEFT JOIN user_profiles up ON u.id = up.user_id
		WHERE u.id = $1
	`

	var user SupabaseUser
	var userMetadataJSON []byte
	var profileName *string

	err := database.DB.QueryRow(query, userID).Scan(
		&user.ID,
		&user.Email,
		&userMetadataJSON,
		&user.IsAdmin,
		&user.Role,
		&profileName,
	)

	if err != nil {
		http.Error(w, "Usuario no encontrado", http.StatusNotFound)
		return
	}

	// Parsear metadata JSON
	if len(userMetadataJSON) > 0 {
		json.Unmarshal(userMetadataJSON, &user.Metadata)
	}

	// Asignar profile_name
	user.ProfileName = profileName

	json.NewEncoder(w).Encode(user)
}

// GetUserStatsHandler obtiene estadísticas del usuario actual
func GetUserStatsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userID, ok := r.Context().Value("user_id").(string)
	if !ok || userID == "" {
		http.Error(w, "Unauthorized: user_id not found in context", http.StatusUnauthorized)
		return
	}

	// Consultar estadísticas del usuario
	query := `
		SELECT 
			COUNT(DISTINCT w.id) as total_workouts,
			COUNT(DISTINCT ws.id) as total_sessions,
			COUNT(DISTINCT DATE(w.created_at)) as workout_days,
			COALESCE(AVG(ws.effort), 0) as avg_effort,
			COALESCE(AVG(ws.mood), 0) as avg_mood
		FROM workouts w
		FULL OUTER JOIN workout_sessions ws ON ws.user_id = w.user_id 
			AND DATE(ws.session_date) = DATE(w.created_at)
		WHERE w.user_id = $1 OR ws.user_id = $1
	`

	type UserStats struct {
		TotalWorkouts int     `json:"total_workouts"`
		TotalSessions int     `json:"total_sessions"`
		WorkoutDays   int     `json:"workout_days"`
		AvgEffort     float64 `json:"avg_effort"`
		AvgMood       float64 `json:"avg_mood"`
	}

	var stats UserStats
	err := database.DB.QueryRow(query, userID).Scan(
		&stats.TotalWorkouts,
		&stats.TotalSessions,
		&stats.WorkoutDays,
		&stats.AvgEffort,
		&stats.AvgMood,
	)

	if err != nil {
		http.Error(w, "Error obteniendo estadísticas", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(stats)
}

// AdminUser representa información de usuario para el panel de administrador
type AdminUser struct {
	ID        string  `json:"id"`
	Email     *string `json:"email"`
	Name      *string `json:"name"`
	IsAdmin   bool    `json:"is_admin"`
	Role      string  `json:"role"`
	CreatedAt string  `json:"created_at"`
	LastLogin *string `json:"last_login"`
	Settings  *UserSettings `json:"settings"`
}

// GetAdminUsersHandler obtiene todos los usuarios para el panel de administrador
func GetAdminUsersHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Consultar todos los usuarios con información básica y configuraciones
	query := `
		SELECT 
			u.id,
			u.email,
			COALESCE(up.name, 'Sin nombre') as name,
			COALESCE(up.is_admin, false) as is_admin,
			COALESCE(up.role, 'user') as role,
			u.created_at,
			u.last_sign_in_at,
			true as show_own_workouts_in_social,
			true as unc_notifications_enabled
		FROM auth.users u
		LEFT JOIN user_profiles up ON u.id = up.user_id
		LEFT JOIN user_settings us ON u.id = us.user_id
		WHERE u.email_confirmed_at IS NOT NULL
		ORDER BY u.last_sign_in_at DESC NULLS LAST, u.created_at DESC
	`

	rows, err := database.DB.Query(query)
	if err != nil {
		http.Error(w, "Error obteniendo usuarios", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var users []AdminUser
	for rows.Next() {
		var user AdminUser
		var lastSignInAt *string
		var showOwnWorkoutsInSocial bool
		var uncNotificationsEnabled bool
		
		err := rows.Scan(
			&user.ID,
			&user.Email,
			&user.Name,
			&user.IsAdmin,
			&user.Role,
			&user.CreatedAt,
			&lastSignInAt,
			&showOwnWorkoutsInSocial,
			&uncNotificationsEnabled,
		)
		
		if err != nil {
			continue // Saltar usuarios con errores
		}
		
		// Formatear last_login
		if lastSignInAt != nil {
			user.LastLogin = lastSignInAt
		}
		
		// Agregar configuraciones
		user.Settings = &UserSettings{
			HasConfiguredFavorites: false,
			FavoriteExercises: []int{},
		}
		
		users = append(users, user)
	}

	if err = rows.Err(); err != nil {
		http.Error(w, "Error procesando usuarios", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(users)
}

// DeleteAdminUserHandler elimina un usuario (solo para administradores)
func DeleteAdminUserHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Obtener el ID del usuario a eliminar de la URL
	vars := mux.Vars(r)
	userID := vars["id"]

	if userID == "" {
		http.Error(w, "ID de usuario requerido", http.StatusBadRequest)
		return
	}

	// Iniciar transacción
	fmt.Printf("Iniciando eliminación de usuario %s\n", userID)
	tx, err := database.DB.Begin()
	if err != nil {
		fmt.Printf("Error iniciando transacción: %v\n", err)
		http.Error(w, "Error iniciando transacción", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	// Eliminar registros relacionados en orden (por restricciones de clave foránea)
	
	// 1. Eliminar de notification_history
	_, err = tx.Exec("DELETE FROM notification_history WHERE changed_by = $1", userID)
	if err != nil {
		http.Error(w, "Error eliminando historial de notificaciones", http.StatusInternalServerError)
		return
	}

	// 2. Actualizar admin_notifications (poner created_by y updated_by en NULL)
	_, err = tx.Exec("UPDATE admin_notifications SET created_by = NULL, updated_by = NULL WHERE created_by = $1 OR updated_by = $1", userID)
	if err != nil {
		http.Error(w, "Error actualizando notificaciones", http.StatusInternalServerError)
		return
	}

	// 3. Eliminar de user_settings
	_, err = tx.Exec("DELETE FROM user_settings WHERE user_id = $1", userID)
	if err != nil {
		http.Error(w, "Error eliminando configuraciones de usuario", http.StatusInternalServerError)
		return
	}

	// 4. Eliminar de user_profiles
	_, err = tx.Exec("DELETE FROM user_profiles WHERE user_id = $1", userID)
	if err != nil {
		http.Error(w, "Error eliminando perfil de usuario", http.StatusInternalServerError)
		return
	}

	// 5. Eliminar de workouts primero (porque tiene FK a workout_days)
	fmt.Printf("Eliminando workouts para usuario %s\n", userID)
	_, err = tx.Exec("DELETE FROM workouts WHERE user_id = $1", userID)
	if err != nil {
		fmt.Printf("Error eliminando workouts: %v\n", err)
		http.Error(w, "Error eliminando entrenamientos", http.StatusInternalServerError)
		return
	}

	// 6. Eliminar de workout_days después
	fmt.Printf("Eliminando workout_days para usuario %s\n", userID)
	_, err = tx.Exec("DELETE FROM workout_days WHERE user_id = $1", userID)
	if err != nil {
		fmt.Printf("Error eliminando workout_days: %v\n", err)
		http.Error(w, "Error eliminando días de entrenamiento", http.StatusInternalServerError)
		return
	}

	// 7. Eliminar de notifications
	_, err = tx.Exec("DELETE FROM notifications WHERE user_id = $1", userID)
	if err != nil {
		http.Error(w, "Error eliminando notificaciones", http.StatusInternalServerError)
		return
	}

	// 8. Eliminar de kudos (eliminar kudos de workout_days del usuario)
	fmt.Printf("Eliminando kudos para usuario %s\n", userID)
	
	// Eliminar kudos que apunten a workout_days del usuario
	_, err = tx.Exec(`
		DELETE FROM kudos 
		WHERE workout_day_id IN (
			SELECT id FROM workout_days WHERE user_id = $1
		)
	`, userID)
	
	if err != nil {
		fmt.Printf("Error eliminando kudos: %v\n", err)
		fmt.Printf("Continuando sin eliminar kudos...\n")
	} else {
		fmt.Printf("Kudos eliminados exitosamente\n")
	}

	// 9. Finalmente, eliminar de auth.users
	_, err = tx.Exec("DELETE FROM auth.users WHERE id = $1", userID)
	if err != nil {
		http.Error(w, "Error eliminando usuario de auth", http.StatusInternalServerError)
		return
	}

	// Confirmar transacción
	if err = tx.Commit(); err != nil {
		http.Error(w, "Error confirmando transacción", http.StatusInternalServerError)
		return
	}

	// Responder con éxito
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Usuario eliminado exitosamente",
	})
}

// UpdateUserRoleRequest representa la solicitud para actualizar el rol de un usuario
type UpdateUserRoleRequest struct {
	Role string `json:"role"`
}

// UpdateAdminUserRoleHandler actualiza el rol de un usuario (solo para administradores)
func UpdateAdminUserRoleHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Obtener el ID del usuario de la URL
	vars := mux.Vars(r)
	userID := vars["id"]

	if userID == "" {
		http.Error(w, "ID de usuario requerido", http.StatusBadRequest)
		return
	}

	// Decodificar el cuerpo de la solicitud
	var req UpdateUserRoleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	// Validar el rol
	validRoles := map[string]bool{
		"user":  true,
		"profe": true,
		"staff": true,
	}

	if !validRoles[req.Role] {
		http.Error(w, "Rol inválido. Roles válidos: user, profe, staff", http.StatusBadRequest)
		return
	}

	// Actualizar el rol del usuario
	query := `
		UPDATE user_profiles 
		SET role = $1, updated_at = NOW()
		WHERE user_id = $2
	`

	result, err := database.DB.Exec(query, req.Role, userID)
	if err != nil {
		http.Error(w, "Error actualizando rol de usuario", http.StatusInternalServerError)
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		http.Error(w, "Error verificando actualización", http.StatusInternalServerError)
		return
	}

	if rowsAffected == 0 {
		// Si no se actualizó ningún registro, crear el perfil
		_, err = database.DB.Exec(`
			INSERT INTO user_profiles (user_id, role, updated_at) 
			VALUES ($1, $2, NOW()) 
			ON CONFLICT (user_id) DO UPDATE SET role = $2, updated_at = NOW()
		`, userID, req.Role)
		
		if err != nil {
			http.Error(w, "Error creando/actualizando perfil de usuario", http.StatusInternalServerError)
			return
		}
	}

	// Responder con éxito
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Rol de usuario actualizado exitosamente",
	})
}

// UpdateUserNameRequest representa la solicitud para actualizar el nombre de un usuario
type UpdateUserNameRequest struct {
	Name string `json:"name"`
}

// UpdateAdminUserNameHandler actualiza el nombre de un usuario (solo para administradores)
func UpdateAdminUserNameHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Obtener el ID del usuario de la URL
	vars := mux.Vars(r)
	userID := vars["id"]

	if userID == "" {
		http.Error(w, "ID de usuario requerido", http.StatusBadRequest)
		return
	}

	// Decodificar el cuerpo de la solicitud
	var req UpdateUserNameRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "JSON inválido", http.StatusBadRequest)
		return
	}

	// Validar que el nombre no esté vacío
	if req.Name == "" {
		http.Error(w, "El nombre no puede estar vacío", http.StatusBadRequest)
		return
	}

	// Actualizar el nombre del usuario
	query := `
		UPDATE user_profiles 
		SET name = $1, updated_at = NOW()
		WHERE user_id = $2
	`

	result, err := database.DB.Exec(query, req.Name, userID)
	if err != nil {
		http.Error(w, "Error actualizando nombre de usuario", http.StatusInternalServerError)
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		http.Error(w, "Error verificando actualización", http.StatusInternalServerError)
		return
	}

	if rowsAffected == 0 {
		// Si no se actualizó ningún registro, crear el perfil
		_, err = database.DB.Exec(`
			INSERT INTO user_profiles (user_id, name, updated_at) 
			VALUES ($1, $2, NOW()) 
			ON CONFLICT (user_id) DO UPDATE SET name = $2, updated_at = NOW()
		`, userID, req.Name)
		
		if err != nil {
			http.Error(w, "Error creando/actualizando perfil de usuario", http.StatusInternalServerError)
			return
		}
	}

	// Responder con éxito
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Nombre de usuario actualizado exitosamente",
	})
}