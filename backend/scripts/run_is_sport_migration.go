package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/lib/pq"
)

func main() {
	// Obtener la URL de conexión desde las variables de entorno
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL environment variable is required")
	}

	// Conectar a la base de datos
	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatal("Error connecting to database:", err)
	}
	defer db.Close()

	// Verificar la conexión
	err = db.Ping()
	if err != nil {
		log.Fatal("Error pinging database:", err)
	}

	fmt.Println("✅ Connected to database successfully")

	// Leer el archivo de migración
	migrationSQL, err := os.ReadFile("database/add_is_sport_column.sql")
	if err != nil {
		log.Fatal("Error reading migration file:", err)
	}

	// Ejecutar la migración
	_, err = db.Exec(string(migrationSQL))
	if err != nil {
		log.Fatal("Error executing migration:", err)
	}

	fmt.Println("✅ Migration executed successfully")
	fmt.Println("✅ Added is_sport column to exercises table")
}
