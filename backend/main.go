package main

import (
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	"github.com/rs/cors"

	"github.com/gonzalogramagia/entrenar/backend/database"
	"github.com/gonzalogramagia/entrenar/backend/handlers"
	"github.com/gonzalogramagia/entrenar/backend/middleware"
)

func main() {
	// Cargar variables de entorno
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// Inicializar conexión con la base de datos
	if err := database.InitDB(); err != nil {
		log.Fatalf("Error inicializando base de datos: %v", err)
	}
	defer database.CloseDB()

	log.Println("Conexión con base de datos establecida")

	// Crear router
	r := mux.NewRouter()

	// Middleware
	r.Use(middleware.LoggingMiddleware)
	r.Use(middleware.SupabaseAuthMiddleware)

	// API routes
	api := r.PathPrefix("/api").Subrouter()

	// Health check
	api.HandleFunc("/health", handlers.HealthHandler).Methods("GET")
	
	// Workouts endpoints
	api.HandleFunc("/workouts", handlers.GetWorkoutsHandler).Methods("GET")
	api.HandleFunc("/workouts", handlers.CreateWorkoutHandler).Methods("POST")
	api.HandleFunc("/workouts/export", handlers.ExportWorkoutsHandler).Methods("POST")
	api.HandleFunc("/workouts/{id}", handlers.UpdateWorkoutHandler).Methods("PUT")
	api.HandleFunc("/workouts/{id}", handlers.DeleteWorkoutHandler).Methods("DELETE")
	api.HandleFunc("/workout-days/{id}/name", handlers.UpdateWorkoutDayNameHandler).Methods("PUT")

	// Workout days endpoints
	api.HandleFunc("/workout-days", handlers.GetWorkoutDaysHandler).Methods("GET")

	// Exercises endpoints
	api.HandleFunc("/exercises", handlers.GetExercisesHandler).Methods("GET")
	api.HandleFunc("/exercises/{id}", handlers.GetExerciseHandler).Methods("GET")



	// Users endpoints (usando Supabase Auth)
	api.HandleFunc("/me", handlers.GetCurrentUserHandler).Methods("GET")
	api.HandleFunc("/me/stats", handlers.GetUserStatsHandler).Methods("GET")
	api.HandleFunc("/me/last-signin", handlers.UpdateLastSignInHandler).Methods("POST")
	api.HandleFunc("/me/setup", handlers.UserSetupHandler).Methods("POST")

	// Social endpoints
	api.HandleFunc("/social/workouts", handlers.GetSocialWorkoutsHandler).Methods("GET")

	// Notifications endpoints
	api.HandleFunc("/notifications", handlers.GetNotificationsHandler).Methods("GET")
	api.HandleFunc("/notifications/system", handlers.GetSystemNotificationsHandler).Methods("GET")
	api.HandleFunc("/notifications/count", handlers.GetUnreadNotificationsCountHandler).Methods("GET")
	api.HandleFunc("/notifications/{id}/read", handlers.MarkNotificationAsReadHandler).Methods("PUT")
	api.HandleFunc("/notifications/read-all", handlers.MarkAllNotificationsAsReadHandler).Methods("PUT")
	api.HandleFunc("/notifications/{id}", handlers.DeleteNotificationHandler).Methods("DELETE")
	
	// Welcome notification endpoints
	api.HandleFunc("/welcome-notification", handlers.CreateWelcomeNotificationHandler).Methods("POST")
	api.HandleFunc("/welcome-notification", handlers.GetWelcomeNotificationHandler).Methods("GET")


	// Admin endpoints (requieren permisos de administrador)
	api.HandleFunc("/admin/notifications", handlers.AdminStaffOrTeacherMiddleware(handlers.GetAdminNotificationsHandler)).Methods("GET")
	api.HandleFunc("/admin/notifications", handlers.AdminStaffOrTeacherMiddleware(handlers.CreateNotificationHandler)).Methods("POST")
	api.HandleFunc("/admin/notifications/{id}", handlers.AdminStaffOrTeacherMiddleware(handlers.UpdateAdminNotificationHandler)).Methods("PUT")
	api.HandleFunc("/admin/notifications/{id}", handlers.AdminStaffOrTeacherMiddleware(handlers.DeleteAdminNotificationHandler)).Methods("DELETE")
	api.HandleFunc("/admin/notifications/{id}/history", handlers.AdminStaffOrTeacherMiddleware(handlers.GetNotificationHistoryHandler)).Methods("GET")
	api.HandleFunc("/admin/exercises", handlers.AdminOrTeacherMiddleware(handlers.GetAdminExercisesHandler)).Methods("GET")
	api.HandleFunc("/admin/exercises", handlers.AdminOrTeacherMiddleware(handlers.CreateExerciseHandler)).Methods("POST")
	api.HandleFunc("/admin/users", handlers.AdminMiddleware(handlers.GetAdminUsersHandler)).Methods("GET")
	api.HandleFunc("/admin/users/{id}", handlers.AdminMiddleware(handlers.DeleteAdminUserHandler)).Methods("DELETE")
	api.HandleFunc("/admin/users/{id}/role", handlers.AdminMiddleware(handlers.UpdateAdminUserRoleHandler)).Methods("PUT")
	api.HandleFunc("/admin/users/{id}/name", handlers.AdminMiddleware(handlers.UpdateAdminUserNameHandler)).Methods("PUT")

	// Routines endpoints
	api.HandleFunc("/routines", handlers.GetUserRoutinesHandler).Methods("GET")
	api.HandleFunc("/routines", handlers.CreateUserRoutineHandler).Methods("POST")
	api.HandleFunc("/routines/{id}", handlers.GetUserRoutineHandler).Methods("GET")
	api.HandleFunc("/routines/{id}", handlers.UpdateUserRoutineHandler).Methods("PUT")
	api.HandleFunc("/routines/{id}", handlers.DeleteUserRoutineHandler).Methods("DELETE")

	// Configurar CORS
	corsOrigins := os.Getenv("CORS_ALLOWED_ORIGINS")
	if corsOrigins == "" {
		// Dominios permitidos por defecto (incluyendo localhost para desarrollo)
		// Se añade soporte para el dominio oficial de la app y subdominios de Railway
		corsOrigins = "http://localhost:3210,http://localhost:5173,https://entrenar.app,https://www.entrenar.app,https://entrenar.up.railway.app"
	}
	
	// Limpiar y validar orígenes
	rawOrigins := strings.Split(corsOrigins, ",")
	var allowedOrigins []string
	for _, origin := range rawOrigins {
		trimmed := strings.TrimSpace(origin)
		if trimmed != "" {
			allowedOrigins = append(allowedOrigins, trimmed)
		}
	}
	
	log.Printf("CORS configurado para los siguientes orígenes: %v", allowedOrigins)

	c := cors.New(cors.Options{
		AllowedOrigins:   allowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowedHeaders:   []string{
			"Accept",
			"Authorization",
			"Content-Type",
			"X-Requested-With",
			"Origin",
			"X-Client-Info",
			"X-Supabase-Auth",
			"apikey",
		},
		ExposedHeaders:   []string{"Content-Length", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           86400, // 24 horas
		Debug:            false, // Deshabilitado para producción
	})

	handler := c.Handler(r)

	port := os.Getenv("PORT")
	if port == "" {
		port = "3210"
	}

	log.Printf("Servidor iniciado en puerto %s", port)
	log.Fatal(http.ListenAndServe(":"+port, handler))
}
