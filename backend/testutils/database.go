package testutils

import (
	"os"
	"testing"

	"github.com/goalritmo/gym/backend/database"
	"github.com/joho/godotenv"
)

// SetupTestDatabase configura la conexión con Supabase para testing
func SetupTestDatabase(t *testing.T) {
	// Cargar variables de entorno de testing
	if err := godotenv.Load("../env.test"); err != nil {
		// Intentar desde el directorio raíz
		if err := godotenv.Load("env.test"); err != nil {
			t.Logf("No se encontró env.test, usando variables del sistema")
		}
	}

	// Verificar que tenemos la URL de la base de datos
	dbURL := os.Getenv("SUPABASE_DB_URL")
	if dbURL == "" {
		t.Skip("SUPABASE_DB_URL no configurada, skipping test con DB real")
	}

	// Inicializar conexión con la base de datos
	if database.DB == nil {
		if err := database.InitDB(); err != nil {
			t.Fatalf("Error conectando a la base de datos de test: %v", err)
		}
	}

	// Verificar que la conexión funciona
	if err := database.DB.Ping(); err != nil {
		t.Fatalf("Error haciendo ping a la base de datos: %v", err)
	}

	t.Logf("✅ Conectado a Supabase para testing")

	// Cleanup al final del test
	t.Cleanup(func() {
		// No cerramos la conexión porque otros tests pueden usarla
		// database.CloseDB()
	})
}

// CleanupTestData limpia datos de prueba específicos del usuario
func CleanupTestData(t *testing.T, userID string) {
	if database.DB == nil {
		return
	}

	// Limpiar workouts de prueba
	_, err := database.DB.Exec("DELETE FROM workouts WHERE user_id = $1", userID)
	if err != nil {
		t.Logf("Warning: No se pudieron limpiar workouts de test: %v", err)
	}

	// Limpiar sesiones de prueba
	_, err = database.DB.Exec("DELETE FROM workout_sessions WHERE user_id = $1", userID)
	if err != nil {
		t.Logf("Warning: No se pudieron limpiar sesiones de test: %v", err)
	}

	t.Logf("🧹 Datos de prueba limpiados para user_id: %s", userID)
}

// CreateTestUser crea datos de usuario para testing (si es necesario)
func CreateTestUser(t *testing.T, userID string) {
	// En el futuro, si implementamos tabla de usuarios
	// Por ahora, solo usamos el user_id como string
	t.Logf("👤 Usuario de prueba: %s", userID)
}

// VerifyDatabaseSchema verifica que las tablas necesarias existan
func VerifyDatabaseSchema(t *testing.T) {
	if database.DB == nil {
		t.Fatal("Base de datos no inicializada")
	}

	// Verificar tablas principales en public schema
	publicTables := []string{"workouts", "workout_sessions", "exercises", "equipment"}
	
	for _, table := range publicTables {
		var exists bool
		query := `
			SELECT EXISTS (
				SELECT FROM information_schema.tables 
				WHERE table_schema = 'public' 
				AND table_name = $1
			)
		`
		
		err := database.DB.QueryRow(query, table).Scan(&exists)
		if err != nil {
			t.Fatalf("Error verificando tabla public.%s: %v", table, err)
		}
		
		if !exists {
			t.Fatalf("Tabla requerida 'public.%s' no existe en la base de datos", table)
		}
	}

	// Verificar que auth.users exista (tabla de Supabase Auth)
	var authUsersExists bool
	authQuery := `
		SELECT EXISTS (
			SELECT FROM information_schema.tables 
			WHERE table_schema = 'auth' 
			AND table_name = 'users'
		)
	`
	
	err := database.DB.QueryRow(authQuery).Scan(&authUsersExists)
	if err != nil {
		t.Fatalf("Error verificando auth.users: %v", err)
	}
	
	if !authUsersExists {
		t.Fatalf("Tabla 'auth.users' no existe - verificar configuración de Supabase Auth")
	}

	t.Logf("✅ Schema de base de datos verificado (public + auth)")
}

// GetTestUserID genera un UUID único para tests
func GetTestUserID(t *testing.T) string {
	// Generar un UUID v4 válido para testing
	// Formato: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
	// Para simplificar, usamos un UUID fijo para tests
	return "12345678-1234-4000-8000-123456789000"
}

// CreateTestUserInDB crea un usuario de prueba en auth.users (para Supabase Auth)
func CreateTestUserInDB(t *testing.T, userID string) {
	if database.DB == nil {
		t.Fatal("Base de datos no inicializada")
	}

	// Para testing, insertamos directamente en auth.users
	// En producción, esto se hace automáticamente via Google OAuth
	query := `
		INSERT INTO auth.users (
			id, 
			email, 
			role, 
			email_confirmed_at,
			created_at, 
			updated_at,
			raw_user_meta_data
		)
		VALUES (
			$1, 
			$2, 
			'authenticated',
			NOW(),
			NOW(), 
			NOW(),
			$3
		)
		ON CONFLICT (id) DO NOTHING
	`
	
	email := "test_" + userID + "@gym.test"
	metadata := `{"full_name": "Test User", "provider": "test"}`

	_, err := database.DB.Exec(query, userID, email, metadata)
	if err != nil {
		t.Logf("Warning: No se pudo crear usuario de prueba en auth.users: %v", err)
		return
	}

	t.Logf("👤 Usuario de prueba creado en auth.users: %s", userID)
}

// CleanupTestUser elimina un usuario de prueba y sus datos relacionados
func CleanupTestUser(t *testing.T, userID string) {
	if database.DB == nil {
		return
	}

	// Limpiar workouts y sessions primero (por las foreign keys)
	CleanupTestData(t, userID)

	// Luego eliminar de auth.users
	_, err := database.DB.Exec("DELETE FROM auth.users WHERE id = $1", userID)
	if err != nil {
		t.Logf("Warning: No se pudo eliminar usuario de prueba de auth.users: %v", err)
	} else {
		t.Logf("🗑️ Usuario de prueba eliminado de auth.users: %s", userID)
	}
}
