# Entrenar App Backend

API REST en Go para la aplicación de registro de entrenamientos de gimnasio.

## 🚀 Configuración

### Prerrequisitos
- Go 1.21+
- PostgreSQL (via Supabase)

### Variables de Entorno
Crea un archivo `.env` basado en `env.example`:

```bash
cp env.example .env
```

Configura las siguientes variables:
```env
SUPABASE_DB_URL=postgresql://username:password@db.supabase.co:5432/postgres
PORT=8080
```

### Instalación
```bash
# Instalar dependencias
go mod tidy

# Ejecutar servidor
go run main.go
```

El servidor estará disponible en `http://localhost:3210`

## 📡 API Endpoints

### Health Check
```
GET /api/health
```

### Workouts
```
GET    /api/workouts                 # Listar workouts
POST   /api/workouts                 # Crear workout
PUT    /api/workouts/{id}            # Actualizar workout
DELETE /api/workouts/{id}            # Eliminar workout
```

### Workout Sessions
```
GET    /api/workout-sessions         # Listar sesiones
POST   /api/workout-sessions         # Crear sesión
PUT    /api/workout-sessions/{id}    # Actualizar sesión
```

### Exercises
```
GET    /api/exercises                # Listar ejercicios
GET    /api/exercises/{id}           # Obtener ejercicio
```

### Equipment
```
GET    /api/equipment                # Listar equipos
GET    /api/equipment/{id}           # Obtener equipo
```

### Users (Supabase Auth)
```
GET    /api/me                       # Usuario actual
GET    /api/me/stats                 # Estadísticas del usuario
```

## 🔐 Autenticación

### Producción (Google OAuth via Supabase)
```
Authorization: Bearer <jwt_token_from_supabase>
```

Ver [GOOGLE_AUTH_SETUP.md](GOOGLE_AUTH_SETUP.md) para configuración completa.

## 📊 Estructura de Datos

### Workout
```json
{
  "id": 1,
  "user_id": "user_mock_id",
  "exercise_id": 1,
  "exercise_name": "Press de banca",
  "weight": 80.5,
  "reps": 10,
  "serie": 1,
  "seconds": 45,
  "observations": "Buena ejecución",
  "exercise_session_id": "uuid",
  "created_at": "2024-01-01T10:00:00Z"
}
```

### Workout Session
```json
{
  "id": 1,
  "user_id": "user_mock_id",
  "session_date": "2024-01-01",
  "session_name": "Rutina de Fullbody",
  "total_exercises": 5,
  "effort": 3,
  "mood": 2,
  "notes": "Excelente sesión",
  "created_at": "2024-01-01T10:00:00Z",
  "updated_at": "2024-01-01T10:00:00Z"
}
```

## 🧪 Testing

### Setup Inicial
```bash
# Configurar testing con Supabase
make test-setup
```

### Tests Unitarios (Sin DB)
```bash
# Tests rápidos para desarrollo
make test-unit

# Con coverage
make test-coverage
```

### Tests de Integración (Con Supabase)
```bash
# Tests completos con base de datos real
make test-supabase

# Verificar solo la conexión
make test-db-connection

# Todos los tests
make test
```

### Tests Específicos
```bash
# Test específico
go test -v -run="TestSupabaseIntegration" ./handlers

# Con timeout extendido
go test -timeout 60s -v ./handlers

# Benchmarks
make benchmark
```

Ver [SUPABASE_TESTING.md](SUPABASE_TESTING.md) para guía completa de testing.

## 🏗️ Arquitectura

```
backend/
├── main.go                              # Punto de entrada
├── database/
│   ├── connection.go                    # Conexión con Supabase
│   └── supabase_auth_migrations.sql    # Migraciones para Auth
├── handlers/
│   ├── health.go                        # Health check
│   ├── workouts.go                      # CRUD workouts + sessions
│   ├── exercises.go                     # Endpoints ejercicios
│   ├── equipment.go                     # Endpoints equipos
│   └── users.go                         # Usuario actual (desde JWT)
├── middleware/
│   ├── logging.go                       # Logging de requests
│   └── supabase_auth.go                 # JWT validation
├── testutils/
│   ├── testing_helpers.go               # Utilities para tests
│   └── database.go                      # Setup DB para tests
└── scripts/
    └── test-setup.sh                    # Script de configuración
```

## 🔄 Filtros y Parámetros

### Workouts
- `?date=2024-01-01` - Filtrar por fecha
- `?exercise_session_id=uuid` - Filtrar por sesión de ejercicio

### Exercises
- `?muscle_group=pecho` - Filtrar por grupo muscular
- `?equipment=mancuernas` - Filtrar por equipo
- `?search=press` - Búsqueda por nombre

### Equipment
- `?category=pesas_libres` - Filtrar por categoría
- `?search=mancuerna` - Búsqueda por nombre

## 🚦 Códigos de Estado HTTP

- `200` - OK
- `201` - Created
- `204` - No Content
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

## 📝 Logs

El servidor registra todas las requests HTTP con:
- Método HTTP
- Path
- Código de estado
- Duración
- IP del cliente

Ejemplo:
```
GET /api/workouts 200 15.2ms 127.0.0.1
```
