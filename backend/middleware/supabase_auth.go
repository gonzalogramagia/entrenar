package middleware

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/goalritmo/gym/backend/database"
)

// SupabaseAuthMiddleware valida JWT tokens de Supabase
func SupabaseAuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fmt.Printf("🔐 Auth Middleware - %s %s\n", r.Method, r.URL.Path)
		
		// Permitir preflight requests
		if r.Method == "OPTIONS" {
			fmt.Printf("✅ OPTIONS request permitida\n")
			next.ServeHTTP(w, r)
			return
		}

		// Permitir health check sin autenticación
		if strings.HasSuffix(r.URL.Path, "/health") {
			fmt.Printf("✅ Health check permitido\n")
			next.ServeHTTP(w, r)
			return
		}

		// Obtener token JWT del header
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Authorization header requerido", http.StatusUnauthorized)
			return
		}

		// Verificar formato "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			http.Error(w, "Formato de autorización inválido", http.StatusUnauthorized)
			return
		}

		tokenString := parts[1]

		// Permitir setup de usuario sin verificar existencia en DB (para usuarios nuevos)
		if strings.HasSuffix(r.URL.Path, "/setup") {
			fmt.Printf("🔧 Setup endpoint detectado - validando JWT sin verificar DB\n")
			// Validar JWT pero no verificar existencia en DB
			userID, err := validateSupabaseJWT(tokenString)
			if err != nil {
				fmt.Printf("❌ JWT inválido en setup: %v\n", err)
				http.Error(w, fmt.Sprintf("Token inválido: %v", err), http.StatusUnauthorized)
				return
			}
			fmt.Printf("✅ JWT válido para setup - UserID: %s\n", userID)
			// Agregar user_id al contexto sin verificar existencia en DB
			ctx := context.WithValue(r.Context(), "user_id", userID)
			next.ServeHTTP(w, r.WithContext(ctx))
			return
		}

		// Validar JWT de Supabase
		fmt.Printf("🔍 Validando JWT para endpoint: %s\n", r.URL.Path)
		userID, err := validateSupabaseJWT(tokenString)
		if err != nil {
			fmt.Printf("❌ JWT inválido: %v\n", err)
			http.Error(w, fmt.Sprintf("Token inválido: %v", err), http.StatusUnauthorized)
			return
		}
		fmt.Printf("✅ JWT válido - UserID: %s\n", userID)

		// Verificar que el usuario existe en la base de datos
		if !userExistsInDatabase(userID) {
			fmt.Printf("🚫 Usuario %s no existe en DB - bloqueando acceso a %s\n", userID, r.URL.Path)
			http.Error(w, "Usuario no encontrado o ha sido eliminado", http.StatusUnauthorized)
			return
		}

		fmt.Printf("✅ Usuario %s autorizado para %s\n", userID, r.URL.Path)
		// Agregar user_id al contexto
		ctx := context.WithValue(r.Context(), "user_id", userID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// validateSupabaseJWT valida un JWT token de Supabase usando JWT Signing Keys
func validateSupabaseJWT(tokenString string) (string, error) {
	// Usar JWKS (JSON Web Key Set) validation como método principal
	supabaseURL := os.Getenv("SUPABASE_URL")
	if supabaseURL == "" {
		return "", fmt.Errorf("SUPABASE_URL no configurado")
	}

	// Intentar validación con JWKS primero
	userID, err := validateWithJWKS(tokenString, supabaseURL)
	if err == nil {
		return userID, nil
	}

	// Solo como fallback para desarrollo local, intentar con JWT secret
	jwtSecret := os.Getenv("SUPABASE_JWT_SECRET")
	if jwtSecret != "" {
		userID, err := validateWithSecret(tokenString, jwtSecret)
		if err == nil {
			return userID, nil
		}
	}

	return "", fmt.Errorf("JWT validation failed: %v", err)
}

// validateWithJWKS valida JWT usando JWKS de Supabase
func validateWithJWKS(tokenString, supabaseURL string) (string, error) {
	// Obtener las claves JWKS de Supabase
	jwksURL := supabaseURL + "/auth/v1/.well-known/jwks.json"
	jwks, err := FetchJWKS(jwksURL)
	if err != nil {
		return "", fmt.Errorf("error fetching JWKS: %v", err)
	}

	// Parsear el token sin validar primero para obtener el kid
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Verificar que el algoritmo sea compatible (RSA o ECDSA)
		switch token.Method.(type) {
		case *jwt.SigningMethodRSA, *jwt.SigningMethodECDSA:
			// Algoritmos soportados
		default:
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}

		// Obtener el kid del header
		kid, ok := token.Header["kid"].(string)
		if !ok {
			return nil, fmt.Errorf("kid not found in token header")
		}

		// Buscar la clave correspondiente en JWKS
		for _, key := range jwks.Keys {
			if key.Kid == kid {
				// Convertir JWK a clave pública (RSA o ECDSA)
				publicKey, err := JWKToPublicKey(key)
				if err != nil {
					return nil, fmt.Errorf("error converting JWK to public key: %v", err)
				}
				return publicKey, nil
			}
		}

		return nil, fmt.Errorf("key with kid %s not found in JWKS", kid)
	})

	if err != nil {
		return "", fmt.Errorf("error parsing token: %v", err)
	}

	if !token.Valid {
		return "", fmt.Errorf("token is not valid")
	}

	// Extraer el user ID de los claims
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return "", fmt.Errorf("invalid token claims")
	}

	// El user ID en Supabase JWT está en el claim "sub"
	userID, ok := claims["sub"].(string)
	if !ok || userID == "" {
		return "", fmt.Errorf("user ID not found in token claims")
	}

	return userID, nil
}

// validateWithSecret valida JWT con secret (legacy/desarrollo)
func validateWithSecret(tokenString, secret string) (string, error) {
	// Parsear y validar el token con secret
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Verificar que el método de firma sea el esperado
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("método de firma inesperado: %v", token.Header["alg"])
		}
		return []byte(secret), nil
	})

	if err != nil {
		return "", err
	}

	// Verificar que el token sea válido
	if !token.Valid {
		return "", fmt.Errorf("token inválido")
	}

	// Extraer claims
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return "", fmt.Errorf("claims inválidos")
	}

	// Verificar expiración
	if exp, ok := claims["exp"].(float64); ok {
		if time.Now().Unix() > int64(exp) {
			return "", fmt.Errorf("token expirado")
		}
	}

	// Extraer user_id (sub claim)
	if sub, ok := claims["sub"].(string); ok {
		return sub, nil
	}

	return "", fmt.Errorf("user_id no encontrado en token")
}

// GetUserInfoFromSupabase obtiene información del usuario desde Supabase Auth
func GetUserInfoFromSupabase(userID string) (*SupabaseUser, error) {
	// Esta función haría una llamada a la API de Supabase Auth
	// Por ahora, retornamos información básica
	return &SupabaseUser{
		ID:    userID,
		Email: "", // Se obtendría de Supabase
	}, nil
}

// SupabaseUser representa la información básica del usuario de Supabase
type SupabaseUser struct {
	ID       string          `json:"id"`
	Email    string          `json:"email"`
	Metadata json.RawMessage `json:"user_metadata"`
	AppData  json.RawMessage `json:"app_metadata"`
}

// userExistsInDatabase verifica si un usuario existe en la base de datos
func userExistsInDatabase(userID string) bool {
	if database.DB == nil {
		fmt.Printf("❌ Database connection is nil for user %s\n", userID)
		return false
	}
	
	var count int
	err := database.DB.QueryRow("SELECT COUNT(*) FROM user_profiles WHERE user_id = $1", userID).Scan(&count)
	if err != nil {
		fmt.Printf("❌ Error verificando existencia de usuario %s: %v\n", userID, err)
		return false
	}
	
	exists := count > 0
	fmt.Printf("🔍 Usuario %s existe en DB: %t (count: %d)\n", userID, exists, count)
	return exists
}
