import { useState } from 'react'
import { Button, Typography, Alert, Box, Backdrop, CircularProgress } from '@mui/material'
import { Google as GoogleIcon } from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'

export default function LoginComponent() {
  const [error, setError] = useState('')
  const { signInWithGoogle, isSigningIn } = useAuth()



  const handleGoogleSignIn = async () => {
    setError('')
    
    try {
      const { error } = await signInWithGoogle()
      if (error) {
        setError('Error al iniciar sesión con Google. Inténtalo de nuevo.')
        console.error('Google sign in error:', error)
      }
    } catch (error) {
      setError('Error inesperado. Inténtalo de nuevo.')
      console.error('Unexpected error:', error)
    }
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', // Centrado en todos los dispositivos
      height: '100%',
      backgroundColor: '#FFD700', // Amarillo dorado
      borderRadius: { xs: 0, sm: 1 }, // Sin bordes en mobile, con bordes en desktop
      mx: { xs: 0, sm: 1 }, // Sin márgenes en mobile, con márgenes en desktop
      my: { xs: 0, sm: 1 }, // Sin márgenes en mobile, con márgenes en desktop
      width: '100%',
      minHeight: '100vh',
      // En desktop, mover un poco hacia arriba del centro
      '@media (min-width: 768px)': {
        alignItems: 'flex-start',
        paddingTop: '32vh' // 32% del viewport height desde arriba
      },
      // Solo en mobile, ocupar toda la pantalla
      '@media (max-width: 767px)': {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: 0,
        borderRadius: 0,
        zIndex: 9999
      }
    }}>
      <Box sx={{ 
        bgcolor: 'white', 
        p: 3, 
        borderRadius: 2, 
        boxShadow: 3,
        maxWidth: '90%',
        width: '100%',
        '@media (min-width: 768px)': {
          bgcolor: 'transparent',
          boxShadow: 'none',
          p: 0
        }
      }}>
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom 
          textAlign="center"
          sx={{ 
            mb: 3, 
            fontWeight: 'bold', 
            color: '#FFB732',
            '@media (min-width: 768px)': {
              color: '#FFB732'
            }
          }}
        >
          Entrenar.app
        </Typography>
        
        {/* Google OAuth Login */}
        <Button
          onClick={handleGoogleSignIn}
          disabled={isSigningIn}
          variant="outlined"
          fullWidth
          size="large"
          startIcon={<GoogleIcon />}
          sx={{
            borderColor: '#4285f4',
            fontWeight: 'bold',
            color: '#4285f4',
            '&:hover': {
              borderColor: '#3367d6',
              backgroundColor: 'rgba(66, 133, 244, 0.04)'
            }
          }}
        >
          {isSigningIn ? 'Iniciando...' : 'Continuar'}
        </Button>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Box>

      {/* Loader completo para login */}
      <Backdrop
        sx={{
          color: 'white',
          zIndex: (theme) => theme.zIndex.modal + 1,
          backgroundColor: 'rgba(255, 215, 0, 0.9)', // Amarillo dorado con transparencia
          backdropFilter: 'blur(4px)',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        open={isSigningIn}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2
          }}
        >
          <CircularProgress size={48} thickness={4} sx={{ color: 'white' }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
            Iniciando sesión...
          </Typography>
        </Box>
      </Backdrop>
    </Box>
  )
}


