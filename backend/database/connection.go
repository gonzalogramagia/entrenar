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
	// Intentar obtener la URL de conexión de múltiples variables de entorno
	// SUPABASE_DB_URL es nuestra específica, DATABASE_URL es el estándar de Railway/Heroku
	supabaseURL := os.Getenv("SUPABASE_DB_URL")
	if supabaseURL == "" {
		supabaseURL = os.Getenv("DATABASE_URL")
	}

	if supabaseURL == "" {
		return fmt.Errorf("SUPABASE_DB_URL o DATABASE_URL no están configuradas")
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
		DB.SetMaxOpenConns(5)
		DB.SetMaxIdleConns(1)
		DB.SetConnMaxLifetime(0)
		DB.SetConnMaxIdleTime(0)

		// Ejecutar migraciones básicas de forma síncrona
		runBasicMigrations(DB)
	})

	return err
}

func runBasicMigrations(db *sql.DB) {
	fmt.Println("🚀 Ejecutando migraciones básicas...")
	// Añadir columna avatar_url a user_profiles si no existe
	_, err := db.Exec("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;")
	if err != nil {
		fmt.Printf("⚠️ Aviso: No se pudo añadir avatar_url a user_profiles: %v\n", err)
	} else {
		fmt.Println("✅ Columna avatar_url verificada/añadida en user_profiles")
	}
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
