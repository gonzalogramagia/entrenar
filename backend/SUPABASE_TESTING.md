# Testing con Supabase - Guía Completa

## 🎯 Configuración Inicial

### 1. Configurar Credenciales

```bash
# Ejecutar script de configuración
make test-setup
```

O manualmente:

1. Copia tu URL de Supabase desde el dashboard
2. Edita `env.test` con tus credenciales:

```env
SUPABASE_DB_URL=postgresql://postgres:tu_password@db.tu_proyecto.supabase.co:5432/postgres
PORT=3210
ENVIRONMENT=test
LOG_LEVEL=info
```

### 2. Verificar Conexión

```bash
# Probar conexión básica
make test-db-connection

# Si funciona, ejecutar todos los tests con Supabase
make test-supabase
```

## 🏗️ Estructura de Tests

### Tests de Integración Completos
```go
func TestSupabaseIntegration(t *testing.T) {
    // Setup automático de DB
    testutils.SetupTestDatabase(t)
    testutils.VerifyDatabaseSchema(t)
    
    // Usuario único para este test
    testUserID := testutils.GetTestUserID(t)
    
    // Cleanup automático al final
    t.Cleanup(func() {
        testutils.CleanupTestData(t, testUserID)
    })
    
    // Tests reales contra Supabase...
}
```

### Ventajas de Testing con Supabase Real

✅ **Integración real** - Testa contra la DB de producción
✅ **Constraints reales** - Validaciones de DB funcionan
✅ **Performance real** - Mide latencia real de red
✅ **Triggers/Functions** - Testa funciones de PostgreSQL
✅ **Concurrencia real** - Detecta race conditions

## 🧪 Tipos de Tests Implementados

### 1. CRUD Completo de Workouts
```bash
# Test completo: Create → Read → Update → Delete
go test -v -run="TestSupabaseIntegration" ./handlers
```

**Lo que prueba:**
- ✅ Crear workout con datos válidos
- ✅ Obtener workouts del usuario
- ✅ Actualizar workout existente
- ✅ Eliminar workout
- ✅ Verificar que los datos persisten correctamente

### 2. Workout Sessions
```bash
# Test de sesiones de entrenamiento
go test -v -run="TestSupabaseWorkoutSessions" ./handlers
```

**Lo que prueba:**
- ✅ Crear sesión de entrenamiento
- ✅ Actualizar effort y mood
- ✅ Persistencia de datos de sesión

### 3. Validaciones de Base de Datos
```bash
# Verificar schema y constraints
go test -v -run="VerifyDatabaseSchema" ./handlers
```

**Lo que prueba:**
- ✅ Todas las tablas existen
- ✅ Schema coincide con expectativas
- ✅ Constraints funcionan correctamente

## 🔄 Gestión de Datos de Prueba

### Usuario Único por Test
Cada test crea un `user_id` único:
```
test_user_TestSupabaseIntegration_abc123
```

### Cleanup Automático
```go
t.Cleanup(func() {
    testutils.CleanupTestData(t, testUserID)
})
```

### Datos Aislados
- ✅ Tests no interfieren entre sí
- ✅ Datos se limpian automáticamente
- ✅ Paralelización segura

## 📊 Comandos de Testing

### Desarrollo Diario
```bash
# Tests rápidos (sin DB)
make test-unit

# Tests completos con Supabase
make test-supabase

# Verificar solo conexión
make test-db-connection
```

### Debug de Tests
```bash
# Test específico con logs detallados
go test -v -run="TestSupabaseIntegration/Create_workout" ./handlers

# Con timeout extendido (para conexiones lentas)
go test -timeout 60s -v -run="TestSupabase" ./handlers

# Con variables de entorno específicas
SUPABASE_DB_URL="..." go test -v ./handlers
```

### CI/CD Pipeline
```bash
# Tests completos para CI
make test  # Incluye tests con y sin DB

# Solo tests que requieren DB
make test-integration

# Con coverage
make test-coverage
```

## 🚨 Troubleshooting

### Error: "SUPABASE_DB_URL no configurada"
```bash
# Verificar archivo de configuración
cat env.test

# Ejecutar setup nuevamente
make test-setup
```

### Error: "connection refused"
- ✅ Verificar URL de Supabase
- ✅ Verificar password correcto
- ✅ Verificar firewall/red
- ✅ Verificar que el proyecto Supabase está activo

### Error: "table does not exist"
- ✅ Verificar que las migraciones están aplicadas
- ✅ Verificar schema de Supabase
- ✅ Verificar permisos de usuario

### Tests Lentos
```bash
# Solo tests unitarios (rápidos)
make test-unit

# Skip tests de integración
go test -short ./...
```

## 📈 Métricas y Performance

### Benchmarks con Supabase
```bash
# Medir performance de endpoints
go test -bench=. ./handlers

# Con análisis de memoria
go test -bench=. -benchmem ./handlers
```

### Análisis de Coverage
```bash
# Coverage incluyendo tests de integración
make test-coverage

# Solo coverage de lógica sin DB
make test-unit-coverage
```

## 🔒 Seguridad en Tests

### Datos Sensibles
- ❌ **NO** commitear credenciales reales
- ✅ Usar archivo `env.test` en `.gitignore`
- ✅ User IDs únicos para evitar colisiones

### Permisos Mínimos
El usuario de testing debería tener solo permisos para:
- ✅ SELECT, INSERT, UPDATE, DELETE en tablas de la app
- ❌ NO permisos de administrador
- ❌ NO acceso a otras bases de datos

## 🚀 Configuración para Equipos

### Variables de Equipo
```bash
# env.test.template
SUPABASE_DB_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
PORT=3210
ENVIRONMENT=test
LOG_LEVEL=info
```

### CI/CD Secrets
```yaml
# GitHub Actions
env:
  SUPABASE_DB_URL: ${{ secrets.SUPABASE_TEST_DB_URL }}
```

### Base de Datos Dedicada para Testing
Recomendación: Crear proyecto Supabase separado para testing
- ✅ Datos de producción protegidos
- ✅ Schema independiente
- ✅ Performance testing sin afectar usuarios

## 📚 Ejemplos Prácticos

### Test Simple
```go
func TestCreateWorkout(t *testing.T) {
    testutils.SetupTestDatabase(t)
    userID := testutils.GetTestUserID(t)
    
    // Test implementation...
    
    testutils.CleanupTestData(t, userID)
}
```

### Test Complejo con Transacciones
```go
func TestWorkoutFlow(t *testing.T) {
    testutils.SetupTestDatabase(t)
    userID := testutils.GetTestUserID(t)
    
    // 1. Crear sesión
    // 2. Crear múltiples workouts
    // 3. Verificar agrupamiento
    // 4. Actualizar ratings
    // 5. Verificar consistencia
    
    testutils.CleanupTestData(t, userID)
}
```

¡Con esta configuración tienes tests de integración robustos que prueban tu API contra la base de datos real de Supabase! 🎉
