package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

func main() {
	// Cargar variables de entorno
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// Cargar variables de entorno
	supabaseURL := os.Getenv("SUPABASE_DB_URL")
	if supabaseURL == "" {
		log.Fatal("SUPABASE_DB_URL no está configurada")
	}

	// Conectar a la base de datos
	db, err := sql.Open("postgres", supabaseURL)
	if err != nil {
		log.Fatalf("Error conectando a la base de datos: %v", err)
	}
	defer db.Close()

	// Verificar conexión
	if err = db.Ping(); err != nil {
		log.Fatalf("Error haciendo ping a la base de datos: %v", err)
	}

	fmt.Println("✅ Conexión a la base de datos establecida")

	// Agregar columna favorite_exercises si no existe
	query := `
		ALTER TABLE user_settings 
		ADD COLUMN IF NOT EXISTS favorite_exercises INTEGER[] DEFAULT '{}';
	`

	_, err = db.Exec(query)
	if err != nil {
		log.Fatalf("Error agregando columna favorite_exercises: %v", err)
	}

	fmt.Println("✅ Columna favorite_exercises agregada exitosamente")

	// Verificar que la columna se agregó correctamente
	var columnExists bool
	checkQuery := `
		SELECT EXISTS (
			SELECT 1 
			FROM information_schema.columns 
			WHERE table_name = 'user_settings' 
			AND column_name = 'favorite_exercises'
		);
	`

	err = db.QueryRow(checkQuery).Scan(&columnExists)
	if err != nil {
		log.Fatalf("Error verificando columna: %v", err)
	}

	if columnExists {
		fmt.Println("✅ Columna favorite_exercises verificada exitosamente")
	} else {
		log.Fatal("❌ La columna favorite_exercises no se agregó correctamente")
	}
}
