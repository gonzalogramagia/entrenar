package main

import (
	"database/sql"
	"fmt"
	"io/ioutil"
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

	// Leer el archivo SQL
	sqlFile := "database/create_notifications_table.sql"
	content, err := ioutil.ReadFile(sqlFile)
	if err != nil {
		log.Fatalf("Error leyendo archivo SQL: %v", err)
	}

	// Ejecutar la migración
	_, err = db.Exec(string(content))
	if err != nil {
		log.Fatalf("Error ejecutando migración: %v", err)
	}

	fmt.Println("✅ Tabla de notificaciones creada exitosamente")
	fmt.Println("✅ Índices creados")
	fmt.Println("✅ Trigger configurado")
	fmt.Println("✅ Notificaciones de ejemplo insertadas")
}
