# Testing Guide - Entrenar API Backend

## 📋 Tipos de Tests Implementados

### 1. **Tests Unitarios** (`*_test.go`)
Prueban funciones individuales sin dependencias externas.

```bash
# Ejecutar solo tests unitarios
make test-unit

# Con coverage
make test-coverage
```

### 2. **Tests de Integración** (`integration_test.go`)
Prueban interacciones con la base de datos y servicios externos.

```bash
# Ejecutar tests de integración
make test-integration
```

### 3. **Benchmarks** (`Benchmark*`)
Miden performance de endpoints críticos.

```bash
# Ejecutar benchmarks
make benchmark
```

## 🛠️ Estrategias de Testing

### Testing de Endpoints HTTP

#### Opción 1: Testing Manual Básico
```go
func TestCreateWorkout(t *testing.T) {
    req := httptest.NewRequest("POST", "/api/workouts", body)
    rr := httptest.NewRecorder()
    
    handler := http.HandlerFunc(CreateWorkoutHandler)
    handler.ServeHTTP(rr, req)
    
    if rr.Code != http.StatusCreated {
        t.Errorf("Expected 201, got %d", rr.Code)
    }
}
```

#### Opción 2: Con Utilities (Recomendado)
```go
func TestWorkoutAPI(t *testing.T) {
    suite := testutils.NewAPITestSuite(t)
    
    rr := suite.MakeRequest(testutils.TestRequest{
        Method: "POST",
        URL:    "/api/workouts",
        Body:   workoutData,
        UserID: "test_user",
    })
    
    suite.AssertStatus(rr, 201)
    suite.AssertJSON(rr, &workout)
}
```

### Table-Driven Tests
Ideal para validaciones múltiples:

```go
func TestWorkoutValidation(t *testing.T) {
    tests := []struct {
        name           string
        data           models.CreateWorkoutRequest
        expectedStatus int
        shouldContain  string
    }{
        {
            name: "Valid workout",
            data: models.CreateWorkoutRequest{Weight: 80, Reps: 10},
            expectedStatus: 201,
        },
        {
            name: "Invalid weight",
            data: models.CreateWorkoutRequest{Weight: -10, Reps: 10},
            expectedStatus: 400,
            shouldContain: "peso",
        },
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            // Test logic here
        })
    }
}
```

## 🗄️ Testing con Base de Datos

### Opción 1: Base de Datos Real (Recomendado para CI/CD)
```go
func TestWithRealDB(t *testing.T) {
    if testing.Short() {
        t.Skip("Skipping integration test")
    }
    
    // Setup test database
    testDB := setupTestDB(t)
    defer testDB.Cleanup()
    
    // Run tests
}
```

### Opción 2: Mocks (Para tests unitarios)
```go
type MockDB struct {
    shouldFail bool
    returnData []models.Workout
}

func (m *MockDB) Query(query string, args ...interface{}) {
    if m.shouldFail {
        return nil, errors.New("mock error")
    }
    return mockRows(m.returnData), nil
}
```

### Opción 3: Docker Test Containers
```bash
# docker-compose.test.yml
version: '3.8'
services:
  test-db:
    image: postgres:15
    environment:
      POSTGRES_DB: gym_test
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
    ports:
      - "5433:5432"
```

## 🚀 Comandos de Testing

### Desarrollo Diario
```bash
# Tests rápidos durante desarrollo
make test-unit

# Tests completos antes de commit
make test

# Con coverage para ver qué falta testear
make test-coverage
```

### CI/CD Pipeline
```bash
# Tests con race condition detection
make test-race

# Benchmarks para detectar regresiones de performance
make benchmark

# Coverage mínimo requerido
go test -coverprofile=coverage.out ./...
go tool cover -func=coverage.out | grep total | awk '{print $3}' | sed 's/%//'
```

### Debug de Tests
```bash
# Ejecutar un test específico
go test -v -run="TestCreateWorkout" ./handlers

# Con más detalle
go test -v -run="TestCreateWorkout" ./handlers -args -test.v

# Con timeouts personalizados
go test -timeout 30s ./...
```

## 📊 Métricas de Calidad

### Coverage Targets
- **Handlers**: >85% (críticos para la API)
- **Models**: >80% (lógica de negocio)
- **Middleware**: >90% (seguridad crítica)
- **Utils**: >75% (funciones auxiliares)

### Performance Benchmarks
```go
func BenchmarkCreateWorkout(b *testing.B) {
    for i := 0; i < b.N; i++ {
        // Código a medir
    }
}

// Objetivos:
// - CreateWorkout: <10ms per operation
// - GetWorkouts: <5ms per operation
// - Authentication: <1ms per operation
```

## 🔧 Setup para Testing

### Variables de Entorno para Tests
```bash
# .env.test
SUPABASE_DB_URL=postgresql://test:test@localhost:5433/gym_test
LOG_LEVEL=debug
ENVIRONMENT=test
```

### Fixtures de Datos
```go
// testdata/fixtures.go
func LoadWorkoutFixtures() []models.Workout {
    return []models.Workout{
        {ID: 1, Weight: 80, Reps: 10, ExerciseName: "Bench Press"},
        {ID: 2, Weight: 100, Reps: 8, ExerciseName: "Deadlift"},
    }
}
```

### Helper Functions
```go
// testutils/db.go
func SetupTestDB(t *testing.T) *sql.DB {
    db, err := sql.Open("postgres", testDBURL)
    if err != nil {
        t.Fatalf("Failed to connect to test DB: %v", err)
    }
    
    // Run migrations
    runMigrations(db)
    
    t.Cleanup(func() {
        cleanupTestDB(db)
    })
    
    return db
}
```

## 🚨 Gotchas y Mejores Prácticas

### ❌ Evitar
- Tests que dependen del orden de ejecución
- Datos hardcodeados que pueden cambiar
- Tests que modifican el estado global
- Timeouts muy largos en tests unitarios

### ✅ Hacer
- Usar `t.Cleanup()` para limpieza automática
- Paralelizar tests independientes con `t.Parallel()`
- Usar `testing.Short()` para separar tests rápidos/lentos
- Crear factories para datos de prueba
- Mockear dependencias externas
- Testear casos edge y errores

### Ejemplo de Test Completo
```go
func TestCompleteWorkoutFlow(t *testing.T) {
    // Setup
    suite := testutils.NewAPITestSuite(t)
    mockData := testutils.NewMockData()
    
    // Test creation
    t.Run("Create", func(t *testing.T) {
        rr := suite.MakeRequest(testutils.TestRequest{
            Method: "POST",
            URL:    "/api/workouts",
            Body:   mockData.ValidWorkout(),
            UserID: mockData.UserID,
        })
        
        suite.AssertStatus(rr, 201)
        
        var workout models.Workout
        suite.AssertJSON(rr, &workout)
        
        assert.Equal(t, mockData.ValidWorkout().Weight, workout.Weight)
    })
    
    // Test retrieval
    t.Run("Get", func(t *testing.T) {
        // Implementation
    })
    
    // Test update
    t.Run("Update", func(t *testing.T) {
        // Implementation
    })
    
    // Test deletion
    t.Run("Delete", func(t *testing.T) {
        // Implementation
    })
}
```

## 📚 Recursos Adicionales

- [Go Testing Documentation](https://golang.org/pkg/testing/)
- [httptest Package](https://golang.org/pkg/net/http/httptest/)
- [testify - Testing Toolkit](https://github.com/stretchr/testify)
- [gomock - Mocking Framework](https://github.com/golang/mock)
