package database

import (
	"database/sql"
	"fmt"
	"os"

	_ "github.com/lib/pq"
)

var DB *sql.DB

// InitDB inicializa la conexión con la base de datos
func InitDB() error {
	supabaseURL := os.Getenv("SUPABASE_DB_URL")
	if supabaseURL == "" {
		return fmt.Errorf("SUPABASE_DB_URL no está configurada")
	}

	var err error
	DB, err = sql.Open("postgres", supabaseURL)
	if err != nil {
		return fmt.Errorf("error conectando a la base de datos: %v", err)
	}

	// Verificar que la conexión funciona
	if err = DB.Ping(); err != nil {
		return fmt.Errorf("error haciendo ping a la base de datos: %v", err)
	}

	// Configurar pool de conexiones
	DB.SetMaxOpenConns(25)
	DB.SetMaxIdleConns(5)

	return nil
}

// CloseDB cierra la conexión con la base de datos
func CloseDB() error {
	if DB != nil {
		return DB.Close()
	}
	return nil
}
