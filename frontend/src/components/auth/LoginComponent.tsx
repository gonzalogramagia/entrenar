import { useState } from 'react'
import { Button, Typography, Alert, Box, Backdrop, CircularProgress } from '@mui/material'
import { Google as GoogleIcon } from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
import { useLanguage } from '../../contexts/LanguageContext'
import { translations } from '../../i18n/translations'

export default function LoginComponent() {
  const [error, setError] = useState('')
  const { signInWithGoogle, isSigningIn, enterAsGuest } = useAuth()
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
        transform: { xs: 'translateY(-5vh)', md: 'translateY(-3vh)' }, // Subir visualmente la caja blanca
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
          mb: 0.5,
          height: '144px',
          overflow: 'hidden'
        }}>
          <Box
            component="a"
            href={`https://mas.moovimiento.com${language === 'en' ? '/en' : ''}`}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              display: 'block',
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'scale(1.05)',
              }
            }}
          >
            <img
              src="/entrenate-emoji.png"
              alt="Entrenate.net"
              style={{
                height: '240px',
                width: 'auto',
                maxWidth: '100%',
                objectFit: 'contain',
                marginTop: '-48px'
              }}
            />
          </Box>
        </Box>

        <Typography variant="h4" sx={{ fontWeight: 800, textAlign: 'center', mb: 1.5, color: '#333', letterSpacing: '-0.5px', fontSize: '2.3rem' }}>
          Entrenate.net
        </Typography>

        {/* Google OAuth Login */}
        <Button
          onClick={handleGoogleSignIn}
          disabled={isSigningIn}
          variant="outlined"
          startIcon={<GoogleIcon />}
          sx={{
            width: '82%',
            mx: 'auto',
            display: 'flex',
            py: 1.5,
            borderRadius: 3,
            borderColor: '#4285f4',
            color: '#4285f4',
            textTransform: 'none',
            fontSize: '0.95rem',
            fontWeight: 'bold',
            '&:hover': {
              borderColor: '#357ae8',
              backgroundColor: 'rgba(66, 133, 244, 0.04)'
            },
            // En pantallas grandes, usar color azul
            '@media (min-width: 768px)': {
              borderColor: '#1976d2',
              color: '#1976d2',
              '&:hover': {
                borderColor: '#1565c0',
                backgroundColor: 'rgba(25, 118, 210, 0.04)'
              }
            }
          }}
        >
          {isSigningIn ? t.signingIn : t.continueWithGoogle}
        </Button>

        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography
            variant="body2"
            onClick={enterAsGuest}
            sx={{
              color: 'text.secondary',
              cursor: 'pointer',
              textDecoration: 'underline',
              '&:hover': {
                color: 'primary.main'
              }
            }}
          >
            {language === 'es' ? 'Modo invitado' : 'Guest mode'}
          </Typography>
        </Box>

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
            marginTop: '-120px' // Mover más arriba
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
            {t.authenticating}
          </Typography>
        </Box>
      </Backdrop>
    </Box>
  )
}


