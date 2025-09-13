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
      alignItems: 'center', 
      height: '100%',
      backgroundColor: '#FFD700', // Amarillo dorado
      borderRadius: 1,
      mx: 1,
      my: 1
    }}>
      <Box sx={{ 
        bgcolor: 'white', 
        p: 3, 
        borderRadius: 2, 
        boxShadow: 3,
        maxWidth: '90%',
        width: '100%'
      }}>
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom 
          textAlign="center"
          sx={{ 
            mb: 3, 
            fontWeight: 'bold', 
            color: '#FFB732' 
          }}
        >
          entrenar.app
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
          color: 'primary.main',
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
          <CircularProgress size={48} thickness={4} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
            Iniciando sesión...
          </Typography>
        </Box>
      </Backdrop>
    </Box>
  )
}


