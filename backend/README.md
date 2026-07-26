# Entrenate.net Backend

REST API in Go for the Entrenate.net gym workout logging application.

## 🚀 Setup

### Prerequisites
- Go 1.21+
- PostgreSQL (via Supabase)

### Environment Variables
Create a `.env` file based on `env.example`:

```bash
cp env.example .env
```

Configure the following variables:
```env
SUPABASE_DB_URL=postgresql://username:password@db.supabase.co:5432/postgres
PORT=8080
```

### Installation
```bash
# Install dependencies
go mod tidy

# Run server
go run main.go
```

The server will be available at `http://localhost:3210`

## 📡 API Endpoints

### Health Check
```
GET /api/health
```

### Workouts
```
GET    /api/workouts                 # List workouts
POST   /api/workouts                 # Create workout
PUT    /api/workouts/{id}            # Update workout
DELETE /api/workouts/{id}            # Delete workout
```

### Workout Sessions
```
GET    /api/workout-sessions         # List sessions
POST   /api/workout-sessions         # Create session
PUT    /api/workout-sessions/{id}    # Update session
```

### Exercises
```
GET    /api/exercises                # List exercises
GET    /api/exercises/{id}           # Get exercise
```

### Users (Supabase Auth)
```
GET    /api/me                       # Current user
GET    /api/me/stats                 # User statistics
```

## 🔐 Authentication

### Production (Google OAuth via Supabase)
```
Authorization: Bearer <jwt_token_from_supabase>
```

See [GOOGLE_AUTH_SETUP.md](GOOGLE_AUTH_SETUP.md) for full configuration details.

## 📊 Data Structure

### Workout
```json
{
  "id": 1,
  "user_id": "user_mock_id",
  "exercise_id": 1,
  "exercise_name": "Bench Press",
  "weight": 80.5,
  "reps": 10,
  "serie": 1,
  "seconds": 45,
  "observations": "Good execution",
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
  "session_name": "Fullbody Routine",
  "total_exercises": 5,
  "effort": 3,
  "mood": 2,
  "notes": "Excellent session",
  "created_at": "2024-01-01T10:00:00Z",
  "updated_at": "2024-01-01T10:00:00Z"
}
```

## 🧪 Testing

### Initial Setup
```bash
# Setup testing with Supabase
make test-setup
```

### Unit Tests (No DB)
```bash
# Fast tests for development
make test-unit

# With coverage
make test-coverage
```

### Integration Tests (With Supabase)
```bash
# Full tests with real database
make test-supabase

# Verify connection only
make test-db-connection

# All tests
make test
```

### Specific Tests
```bash
# Specific test
go test -v -run="TestSupabaseIntegration" ./handlers

# With extended timeout
go test -timeout 60s -v ./handlers

# Benchmarks
make benchmark
```

See [SUPABASE_TESTING.md](SUPABASE_TESTING.md) for the complete testing guide.

## 🏗️ Architecture

```
backend/
├── main.go                              # Entry point
├── database/
│   ├── connection.go                    # Supabase connection
│   └── supabase_auth_migrations.sql    # Auth migrations
├── handlers/
│   ├── health.go                        # Health check
│   ├── workouts.go                      # Workouts + sessions CRUD
│   ├── exercises.go                     # Exercises endpoints
│   └── users.go                         # Current user (from JWT)
├── middleware/
│   ├── logging.go                       # Request logging
│   └── supabase_auth.go                 # JWT validation
├── testutils/
│   ├── testing_helpers.go               # Test utilities
│   └── database.go                      # Test DB setup
└── scripts/
    └── test-setup.sh                    # Setup script
```

## 🔄 Filters and Parameters

### Workouts
- `?date=2024-01-01` - Filter by date
- `?exercise_session_id=uuid` - Filter by workout session

### Exercises
- `?muscle_group=pecho` - Filter by muscle group
- `?search=press` - Search by name

## 🚦 HTTP Status Codes

- `200` - OK
- `201` - Created
- `204` - No Content
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

## 📝 Logs

The server logs all HTTP requests including:
- HTTP Method
- Path
- Status Code
- Duration
- Client IP

Example:
```
GET /api/workouts 200 15.2ms 127.0.0.1
```
