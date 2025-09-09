# Google Authentication con Supabase - Configuración

## 🔑 Configurar Google Auth en Supabase

### Paso 1: Habilitar Google Provider

1. Ve a **Supabase Dashboard** → Tu proyecto
2. Ve a **Authentication** → **Providers**
3. Encuentra **Google** y haz clic en habilitar
4. Necesitarás:
   - **Client ID** de Google
   - **Client Secret** de Google

### Paso 2: Crear aplicación en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Ve a **APIs & Services** → **Credentials**
4. Haz clic en **"Create Credentials"** → **"OAuth client ID"**
5. Configura:
   - **Application type**: Web application
   - **Name**: Entrenar App
   - **Authorized redirect URIs**: 
     ```
     https://[tu-proyecto].supabase.co/auth/v1/callback
     ```

### Paso 3: Configurar en Supabase

1. Copia el **Client ID** y **Client Secret** de Google
2. Pégalos en la configuración de Google Provider en Supabase
3. Guarda los cambios

## 🔧 Configurar Backend para JWT

### Variables de entorno necesarias

Agrega a tu `env.test` (y `.env`):

```env
# Existing
SUPABASE_DB_URL=postgresql://postgres:password@db.project.supabase.co:5432/postgres
PORT=3210

# New for JWT Auth
SUPABASE_JWT_SECRET=tu_jwt_secret_aqui  # Para desarrollo (legacy)
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu_anon_key_aqui
```

**Nota sobre JWT:** Supabase ha migrado a JWT Signing Keys para mejor seguridad. Para desarrollo, puedes seguir usando `SUPABASE_JWT_SECRET`, pero para producción se recomienda implementar JWKS validation.

### Obtener las claves de Supabase

1. Ve a **Supabase Dashboard** → **Settings** → **API**
2. Copia:
   - **Project URL** → `SUPABASE_URL`
   - **Publishable key** (antes "anon public") → `SUPABASE_ANON_KEY`  
   - **JWT Secret** → `SUPABASE_JWT_SECRET` (legacy, para desarrollo)

### JWT Signing Keys (Nuevo Sistema)

Supabase ahora usa JWT Signing Keys en lugar del JWT Secret legacy:

1. Ve a **Supabase Dashboard** → **Settings** → **API** 
2. Busca la sección **"JWT Signing Keys"**
3. Para desarrollo local, puedes seguir usando el JWT Secret legacy
4. Para producción, deberías implementar JWKS validation

**Endpoint JWKS:** `https://tu-proyecto.supabase.co/auth/v1/jwks`

## 🔄 Migración de Base de Datos

Ejecuta la migración simplificada:

1. Ve a **Supabase Dashboard** → **SQL Editor**
2. Ejecuta el contenido de `backend/database/supabase_auth_migrations.sql`

Esto creará:
- ✅ Columnas `user_id` que referencian `auth.users`
- ✅ Row Level Security (RLS) automático
- ✅ Políticas de seguridad por usuario
- ✅ Índices para performance

## 🧪 Testing con Auth Real

### Para desarrollo local

El middleware usa Supabase Auth para validación:

```bash
curl -H "Authorization: Bearer <JWT_TOKEN>" http://localhost:3210/api/workouts
```

### Para testing con JWT real

1. Desde el frontend, obtén un token real de Supabase
2. Úsalo en las requests:

```bash
curl -H "Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJ..." \
     http://localhost:3210/api/workouts
```

## 🌐 Frontend Integration

### En tu React app

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://tu-proyecto.supabase.co',
  'tu_anon_key_aqui'
)

// Login con Google
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: 'http://localhost:5173/dashboard'
  }
})

// Obtener token para API calls
const { data: { session } } = await supabase.auth.getSession()
const token = session?.access_token

// Usar token en requests al backend
fetch('/api/workouts', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
```

## 🔒 Seguridad Automática

Con esta configuración:

### ✅ **Row Level Security (RLS)**
- Los usuarios solo ven sus propios workouts
- Los usuarios solo ven sus propias sesiones
- Protección automática a nivel de base de datos

### ✅ **JWT Validation**
- Tokens verificados contra Supabase
- Expiración automática
- User ID extraído del token

### ✅ **OAuth Security**
- Google maneja la autenticación
- Supabase maneja la autorización
- No almacenas passwords

## 📊 Nuevos Endpoints

```
GET /api/me              # Usuario actual (desde JWT)
GET /api/me/stats        # Estadísticas del usuario
```

### Ejemplo de respuesta `/api/me`:
```json
{
  "id": "uuid-del-usuario",
  "email": "usuario@gmail.com",
  "user_metadata": {
    "full_name": "Juan Pérez",
    "avatar_url": "https://...",
    "provider": "google"
  },
  "role": "authenticated"
}
```

### Ejemplo de respuesta `/api/me/stats`:
```json
{
  "total_workouts": 45,
  "total_sessions": 12,
  "workout_days": 8,
  "avg_effort": 2.3,
  "avg_mood": 2.8
}
```

## 🚀 Flujo Completo

1. **Usuario hace clic en "Login with Google"**
2. **Supabase redirige a Google OAuth**
3. **Google autentica y redirige de vuelta**
4. **Supabase crea usuario en `auth.users`**
5. **Frontend recibe JWT token**
6. **Frontend usa token para llamadas API**
7. **Backend valida JWT y extrae user_id**
8. **RLS protege datos por usuario automáticamente**

## 🔄 JWT Signing Keys (JWKS) - Implementación Completa ✅

### ¡El backend ahora soporta JWKS completamente!

**Método principal:**
- ✅ **JWKS validation** - Claves públicas desde `auth/v1/.well-known/jwks.json`
- ✅ **Soporte ECDSA** - ES256 (P-256), ES384 (P-384), ES512 (P-521)  
- ✅ **Soporte RSA** - RS256, RS384, RS512
- ✅ **Fallback automático** - JWT Secret legacy para desarrollo

**Configuración para producción:**
```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu_publishable_key_aqui
# No necesitas SUPABASE_JWT_SECRET
```

**Configuración para desarrollo:**
```env
SUPABASE_URL=https://tu-proyecto.supabase.co  
SUPABASE_ANON_KEY=tu_publishable_key_aqui
SUPABASE_JWT_SECRET=tu_jwt_secret_aqui  # Fallback opcional
```

### Beneficios implementados:
- ✅ **Más seguro** - Claves asimétricas (ECDSA/RSA)
- ✅ **Verificación local** - Sin llamadas adicionales al servidor
- ✅ **Rotación automática** - Soporte para múltiples claves
- ✅ **Estándar JWKS** - Protocolo industry standard

### Estado actual del backend:
```go
// ✅ Funciona con JWKS (ECDSA ES256)
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiJ9...

// ✅ Funciona con JWKS (RSA RS256)  
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...

// ✅ Fallback JWT Secret legacy
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

¡Con esto tienes autenticación completa de Google sin manejar passwords! 🎉
