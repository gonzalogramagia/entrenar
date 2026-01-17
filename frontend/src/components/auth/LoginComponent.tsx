import { useState } from 'react'
import { Button, Typography, Alert, Box, Backdrop, CircularProgress } from '@mui/material'
import { Google as GoogleIcon } from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import { useLanguage } from '../../contexts/LanguageContext'
import { translations } from '../../i18n/translations'

export default function LoginComponent() {
  const [error, setError] = useState('')
  const { signInWithGoogle, isSigningIn } = useAuth()
  const { language } = useLanguage()
  const t = translations[language].login



  const handleGoogleSignIn = async () => {
    setError('')

    try {
      const { error } = await signInWithGoogle()
      if (error) {
        setError(t.errorGoogle)
        console.error('Google sign in error:', error)
      }
    } catch (error) {
      setError(t.errorUnexpected)
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
      borderRadius: '20px !important', // Bordes redondeados
      mx: 0, // Sin márgenes horizontales
      my: 0, // Sin márgenes verticales
      width: '100%',
      minHeight: '100vh',
      position: 'relative', // Para que el Backdrop se posicione correctamente
      // En desktop, mover un poco hacia arriba del centro
      '@media (min-width: 768px)': {
        alignItems: 'flex-start',
        paddingTop: '25vh' // 25% del viewport height desde arriba
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
        borderRadius: '0px !important',
        zIndex: 9999
      }
    }}>
      <Box sx={{
        bgcolor: 'white',
        mb: { xs: '8vh', md: 0 }, // Subir visualmente en mobile
        px: 3,
        pb: 3,
        pt: 2,
        borderRadius: 4,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        maxWidth: '330px',
        width: '100%'
      }}>
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          mb: 2,
          height: '144px',
          overflow: 'hidden'
        }}>
          <img
            src="/entrenar-emoji.png"
            alt="Entrenar.app"
            style={{
              height: '240px',
              width: 'auto',
              maxWidth: '100%',
              objectFit: 'contain',
              marginTop: '-48px'
            }}
          />
        </Box>

        {/* Google OAuth Login */}
        <Button
          onClick={handleGoogleSignIn}
          disabled={isSigningIn}
          variant="outlined"
          fullWidth
          startIcon={<GoogleIcon />}
          sx={{
            py: 1.5,
            borderRadius: 3,
            borderColor: '#4285f4',
            color: '#4285f4',
            textTransform: 'none',
            fontSize: '1rem',
            fontWeight: 500,
            '&:hover': {
              borderColor: '#357ae8',
              backgroundColor: 'rgba(66, 133, 244, 0.04)'
            },
            // En pantallas grandes, usar color púrpura
            '@media (min-width: 768px)': {
              borderColor: '#6866D6',
              color: '#6866D6',
              '&:hover': {
                borderColor: '#5854c7',
                backgroundColor: 'rgba(104, 102, 214, 0.04)'
              }
            }
          }}
        >
          {isSigningIn ? t.signingIn : t.continueWithGoogle}
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
          backgroundColor: 'rgba(255, 215, 0, 0.95)', // Amarillo dorado con más opacidad
          backdropFilter: 'blur(2px)',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '20px !important',
          transition: 'all 0.2s ease-in-out',
          '@media (max-width: 767px)': {
            borderRadius: '0px !important'
          }
        }}
        open={isSigningIn}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            marginTop: '-60px' // Mover más arriba
          }}
        >
          <CircularProgress
            size={48}
            thickness={4}
            sx={{
              color: 'white',
              backgroundColor: 'transparent',
              '& .MuiCircularProgress-circle': {
                strokeLinecap: 'round'
              }
            }}
          />
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
            {t.signingInProgress}
          </Typography>
        </Box>
      </Backdrop>
    </Box>
  )
}


