package middleware

import (
	"log"
	"net/http"
	"time"
)

// LoggingMiddleware registra todas las requests HTTP
func LoggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		// Crear un wrapper para capturar el status code
		wrapper := &responseWrapper{
			ResponseWriter: w,
			statusCode:     http.StatusOK,
		}

		next.ServeHTTP(wrapper, r)

		duration := time.Since(start)
		log.Printf(
			"%s %s %d %v %s",
			r.Method,
			r.URL.Path,
			wrapper.statusCode,
			duration,
			r.RemoteAddr,
		)
	})
}

// responseWrapper envuelve http.ResponseWriter para capturar el status code
type responseWrapper struct {
	http.ResponseWriter
	statusCode int
}

func (rw *responseWrapper) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}
