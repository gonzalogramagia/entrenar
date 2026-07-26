// Script para obtener detalles específicos del error de registro
// Ejecutar en la consola del navegador en https://entrenar.app

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = 'https://kqilsdwiqzkfdsqtissv.supabase.co'
const supabaseAnonKey = 'sb_publishable_C1lUiTyWNpFJjXtigA_Llw_Oq1cUOlM'

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

// Función para obtener detalles específicos del error
async function getErrorDetails() {
  console.log('=== OBTENIENDO DETALLES DEL ERROR ===')
  
  try {
    // Generar email único
    const testEmail = `error-details-${Date.now()}@example.com`
    const testPassword = 'ErrorDetails123!'
    
    console.log('1. Configuración:')
    console.log('- URL:', supabaseUrl)
    console.log('- Email:', testEmail)
    console.log('- Password:', testPassword)
    
    // Verificar configuración del cliente
    console.log('2. Verificando configuración del cliente...')
    console.log('- Cliente creado:', !!supabase)
    console.log('- Auth config:', supabase.auth)
    
    // Verificar conexión
    console.log('3. Verificando conexión...')
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    console.log('- Session check:', sessionError ? 'ERROR' : 'OK')
    if (sessionError) {
      console.error('  Session error:', sessionError)
      console.error('  Error message:', sessionError.message)
      console.error('  Error status:', sessionError.status)
      console.error('  Error name:', sessionError.name)
    }
    
    // Intentar registro con captura detallada de errores
    console.log('4. Intentando registro...')
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: {
            name: 'Error Details User',
            is_admin: false
          }
        }
      })
      
      console.log('5. Respuesta del registro:')
      console.log('- Data:', data)
      console.log('- Error:', error)
      
      if (error) {
        console.error('6. ERROR DETECTADO:')
        console.error('- Message:', error.message)
        console.error('- Status:', error.status)
        console.error('- Name:', error.name)
        console.error('- Stack:', error.stack)
        
        // Análisis detallado del error
        if (error.message.includes('fetch')) {
          console.error('- Tipo: Error de red/conectividad')
          console.error('- Posible causa: Problema de CORS o conectividad')
        } else if (error.message.includes('configuration')) {
          console.error('- Tipo: Error de configuración')
          console.error('- Posible causa: URL o API key incorrectos')
        } else if (error.message.includes('database')) {
          console.error('- Tipo: Error de base de datos')
          console.error('- Posible causa: Problema con triggers o permisos')
        } else if (error.message.includes('auth')) {
          console.error('- Tipo: Error de autenticación')
          console.error('- Posible causa: Configuración de Supabase Auth')
        } else if (error.message.includes('server_error')) {
          console.error('- Tipo: Error del servidor')
          console.error('- Posible causa: Problema interno de Supabase')
        } else if (error.message.includes('unexpected_failure')) {
          console.error('- Tipo: Falla inesperada')
          console.error('- Posible causa: Error interno no manejado')
        } else {
          console.error('- Tipo: Error desconocido')
          console.error('- Posible causa: Error no catalogado')
        }
        
        return { success: false, error: error.message, details: error }
      }
      
      console.log('6. REGISTRO EXITOSO:')
      console.log('- User ID:', data.user?.id)
      console.log('- Email:', data.user?.email)
      console.log('- Confirmed:', data.user?.email_confirmed_at)
      console.log('- Session:', data.session ? 'Creada' : 'No creada')
      
      return { success: true, user: data.user }
      
    } catch (signUpError) {
      console.error('7. ERROR EN SIGNUP:')
      console.error('- Error:', signUpError)
      console.error('- Message:', signUpError.message)
      console.error('- Stack:', signUpError.stack)
      
      return { success: false, error: signUpError.message, type: 'signup_exception' }
    }
    
  } catch (error) {
    console.error('8. ERROR GENERAL:')
    console.error('- Error:', error)
    console.error('- Message:', error.message)
    console.error('- Stack:', error.stack)
    
    return { success: false, error: error.message, type: 'general_exception' }
  }
}

// Ejecutar debug de errores
console.log('Iniciando debug de errores...')
getErrorDetails().then(result => {
  console.log('=== RESULTADO FINAL ===')
  console.log(result)
})
