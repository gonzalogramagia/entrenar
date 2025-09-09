package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"github.com/goalritmo/gym/backend/database"
)

// DebugSimpleHandler - Handler simple para debug
func DebugSimpleHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	fmt.Println("🔍 DebugSimpleHandler called")

	// Test 1: Verificar conexión a la base de datos
	err := database.DB.Ping()
	if err != nil {
		fmt.Printf("❌ Error conectando a la base de datos: %v\n", err)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"error": "Database connection failed",
			"details": err.Error(),
		})
		return
	}
	fmt.Println("✅ Conexión a base de datos OK")

	// Test 2: Verificar estructura de user_settings
	rows, err := database.DB.Query(`
		SELECT column_name, data_type 
		FROM information_schema.columns 
		WHERE table_name = 'user_settings' 
		ORDER BY ordinal_position
	`)
	if err != nil {
		fmt.Printf("❌ Error consultando estructura de user_settings: %v\n", err)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"error": "Failed to query user_settings structure",
			"details": err.Error(),
		})
		return
	}
	defer rows.Close()

	var columns []map[string]string
	for rows.Next() {
		var columnName, dataType string
		if err := rows.Scan(&columnName, &dataType); err != nil {
			fmt.Printf("❌ Error escaneando columna: %v\n", err)
			continue
		}
		columns = append(columns, map[string]string{
			"name": columnName,
			"type": dataType,
		})
	}

	fmt.Printf("✅ Estructura de user_settings: %+v\n", columns)

	// Test 3: Intentar query simple
	var count int
	err = database.DB.QueryRow("SELECT COUNT(*) FROM user_settings").Scan(&count)
	if err != nil {
		fmt.Printf("❌ Error contando registros en user_settings: %v\n", err)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"error": "Failed to count user_settings records",
			"details": err.Error(),
		})
		return
	}
	fmt.Printf("✅ Registros en user_settings: %d\n", count)

	// Test 4: Intentar query con columnas específicas
	var hasConfiguredFavorites bool
	var favoriteExercises []int
	err = database.DB.QueryRow(`
		SELECT has_configured_favorites, favorite_exercises 
		FROM user_settings 
		LIMIT 1
	`).Scan(&hasConfiguredFavorites, &favoriteExercises)
	
	if err != nil {
		fmt.Printf("❌ Error consultando columnas específicas: %v\n", err)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"error": "Failed to query specific columns",
			"details": err.Error(),
			"columns": columns,
		})
		return
	}
	fmt.Printf("✅ Query con columnas específicas OK: %t, %v\n", hasConfiguredFavorites, favoriteExercises)

	// Si llegamos aquí, todo está bien
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status": "OK",
		"message": "All tests passed",
		"user_settings_columns": columns,
		"user_settings_count": count,
		"sample_data": map[string]interface{}{
			"has_configured_favorites": hasConfiguredFavorites,
			"favorite_exercises": favoriteExercises,
		},
	})
}
