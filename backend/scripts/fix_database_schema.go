package main

import (
	"database/sql"
	"fmt"
	"log"
	_ "github.com/lib/pq"
)

func main() {
	// Conectar a la base de datos
	db, err := sql.Open("postgres", "postgresql://postgres:password@localhost:5432/gym_db?sslmode=disable")
	if err != nil {
		log.Fatal("Error conectando a la base de datos:", err)
	}
	defer db.Close()

	fmt.Println("🔍 Verificando y arreglando estructura de user_settings...")
	
	// Verificar qué columnas existen
	rows, err := db.Query(`
		SELECT column_name 
		FROM information_schema.columns 
		WHERE table_name = 'user_settings' 
		ORDER BY ordinal_position
	`)
	if err != nil {
		log.Fatal("Error consultando columnas:", err)
	}
	defer rows.Close()

	var existingColumns []string
	for rows.Next() {
		var columnName string
		if err := rows.Scan(&columnName); err != nil {
			log.Fatal("Error escaneando columna:", err)
		}
		existingColumns = append(existingColumns, columnName)
	}

	fmt.Printf("Columnas existentes: %v\n", existingColumns)

	// Eliminar columnas que no deberían existir
	columnsToRemove := []string{"show_own_workouts_in_social", "unc_notifications_enabled", "show_routines_tab"}
	
	for _, column := range columnsToRemove {
		// Verificar si la columna existe
		exists := false
		for _, existing := range existingColumns {
			if existing == column {
				exists = true
				break
			}
		}
		
		if exists {
			fmt.Printf("🗑️ Eliminando columna: %s\n", column)
			_, err := db.Exec(fmt.Sprintf("ALTER TABLE user_settings DROP COLUMN IF EXISTS %s", column))
			if err != nil {
				log.Printf("Error eliminando columna %s: %v", column, err)
			} else {
				fmt.Printf("✅ Columna %s eliminada exitosamente\n", column)
			}
		} else {
			fmt.Printf("ℹ️ Columna %s no existe, saltando\n", column)
		}
	}

	// Verificar que las columnas necesarias existen
	requiredColumns := []string{"user_id", "has_configured_favorites", "favorite_exercises", "created_at", "updated_at"}
	
	for _, column := range requiredColumns {
		exists := false
		for _, existing := range existingColumns {
			if existing == column {
				exists = true
				break
			}
		}
		
		if !exists {
			fmt.Printf("⚠️ Columna requerida %s no existe\n", column)
		} else {
			fmt.Printf("✅ Columna requerida %s existe\n", column)
		}
	}

	// Agregar columna favorite_exercises si no existe
	fmt.Println("🔍 Verificando columna favorite_exercises...")
	_, err = db.Exec(`
		ALTER TABLE user_settings 
		ADD COLUMN IF NOT EXISTS favorite_exercises INTEGER[] DEFAULT '{}'
	`)
	if err != nil {
		log.Printf("Error agregando columna favorite_exercises: %v", err)
	} else {
		fmt.Println("✅ Columna favorite_exercises verificada/agregada")
	}

	fmt.Println("🎉 Verificación y arreglo de esquema completado")
}
