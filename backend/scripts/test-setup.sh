#!/bin/bash

# Script para configurar testing con Supabase
echo "🔧 Configurando testing con Supabase..."

# Verificar que existe el archivo de configuración
if [ ! -f "env.test" ]; then
    echo "⚠️  Archivo env.test no encontrado"
    echo "📝 Creando env.test desde template..."
    
    cat > env.test << EOF
# Variables de entorno para testing con Supabase
SUPABASE_DB_URL=postgresql://postgres:[YOUR_PASSWORD]@db.[YOUR_PROJECT_REF].supabase.co:5432/postgres
PORT=3210

# Configuraciones específicas para testing
ENVIRONMENT=test
LOG_LEVEL=info
EOF

    echo "✅ Archivo env.test creado"
    echo "⚠️  IMPORTANTE: Edita env.test con tu URL real de Supabase"
    echo ""
    echo "Para obtener tu URL de Supabase:"
    echo "1. Ve a https://supabase.com/dashboard"
    echo "2. Selecciona tu proyecto"
    echo "3. Ve a Settings > Database"
    echo "4. Copia la 'Connection string' en el formato URI"
    echo ""
    exit 1
fi

# Verificar que la URL está configurada
if grep -q "\[YOUR_PASSWORD\]" env.test; then
    echo "⚠️  env.test contiene placeholders"
    echo "📝 Por favor edita env.test con tu URL real de Supabase"
    exit 1
fi

echo "🔗 Probando conexión con Supabase..."

# Ejecutar un test simple para verificar la conexión
go test -v -run="TestSupabaseIntegration" ./handlers -count=1

if [ $? -eq 0 ]; then
    echo "✅ Conexión con Supabase exitosa"
    echo "🧪 ¡Listo para ejecutar tests!"
    echo ""
    echo "Comandos disponibles:"
    echo "  make test-unit          # Tests unitarios"
    echo "  make test-integration   # Tests con base de datos"
    echo "  make test              # Todos los tests"
else
    echo "❌ Error conectando con Supabase"
    echo "📋 Verificar:"
    echo "  - URL de conexión en env.test"
    echo "  - Credenciales correctas"
    echo "  - Red/firewall permite conexión"
fi
