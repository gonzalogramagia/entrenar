package database

import (
	"database/sql"
	"fmt"
	"os"
	"sync"

	_ "github.com/lib/pq"
)

var (
	DB   *sql.DB
	once sync.Once
)

// InitDB inicializa la conexión con la base de datos
func InitDB() error {
	supabaseURL := os.Getenv("SUPABASE_DB_URL")
	if supabaseURL == "" {
		return fmt.Errorf("SUPABASE_DB_URL no está configurada")
	}

	var err error
	once.Do(func() {
		DB, err = sql.Open("postgres", supabaseURL)
		if err != nil {
			err = fmt.Errorf("error conectando a la base de datos: %v", err)
			return
		}

		// Verificar que la conexión funciona
		if err = DB.Ping(); err != nil {
			err = fmt.Errorf("error haciendo ping a la base de datos: %v", err)
			return
		}

		// Configurar pool de conexiones para serverless
		// En serverless, las conexiones se crean y destruyen rápidamente
		DB.SetMaxOpenConns(5)  // Reducido para serverless
		DB.SetMaxIdleConns(1)  // Mínimo para serverless
		DB.SetConnMaxLifetime(0) // Sin límite de tiempo de vida
		DB.SetConnMaxIdleTime(0) // Sin límite de tiempo idle
	})

	return err
}

// GetDB retorna la conexión de base de datos, inicializándola si es necesario
func GetDB() (*sql.DB, error) {
	if DB == nil {
		if err := InitDB(); err != nil {
			return nil, err
		}
	}
	return DB, nil
}

// CloseDB cierra la conexión con la base de datos
func CloseDB() error {
	if DB != nil {
		return DB.Close()
	}
	return nil
}
