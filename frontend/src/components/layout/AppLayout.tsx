import { Box, CssBaseline, ThemeProvider, createTheme, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import FloatingLinks from '../navigation/FloatingLinks'

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  components: {
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: '16px',
          paddingRight: '16px',
          borderRadius: '0px !important',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
          borderRadius: '0px !important',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: '48px',
          borderRadius: '0px !important',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: '48px',
          fontSize: '14px',
          fontWeight: 500,
          borderRadius: '0px !important',
        },
      },
    },
  },
})

type AppLayoutProps = {
  children: ReactNode
  showFooter?: boolean
}

export default function AppLayout({ children, showFooter = true }: AppLayoutProps) {

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* Fondo con wallpaper */}
      <Box sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'url(/wallpaper.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        opacity: 0.05,
        zIndex: -1
      }} />
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        maxWidth: '100vw',
        overflow: 'hidden',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        '&::-webkit-scrollbar': {
          display: 'none'
        },
        '&::-moz-scrollbar': {
          display: 'none'
        },
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        // Ancho fijo para simular móvil en desktop
        '@media (min-width: 768px)': {
          width: '390px',
          maxWidth: '390px',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          border: 'none',
          borderRadius: '20px',
          boxShadow: '0 0 30px rgba(255, 255, 255, 0.3)',
          height: 'auto',
          minHeight: '720px',
          maxHeight: '92vh',
          backgroundColor: 'transparent',
          overflow: 'hidden',
          touchAction: 'none',
        },
        // Keyframes para la animación del footer
        '@keyframes slideInFromBottom': {
          '0%': {
            transform: 'translateY(60px)',
            opacity: 0
          },
          '15%': {
            transform: 'translateY(45px)',
            opacity: 0.05
          },
          '40%': {
            transform: 'translateY(20px)',
            opacity: 0.2
          },
          '70%': {
            transform: 'translateY(-8px)',
            opacity: 0.6
          },
          '100%': {
            transform: 'translateY(0)',
            opacity: 1
          }
        }
      }}>
        <Box sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
          backgroundColor: 'white',
          borderRadius: '20px !important',
          '@media (max-width: 767px)': {
            backgroundColor: 'white',
            borderRadius: '0px !important'
          },
          '&::-webkit-scrollbar': {
            display: 'none'
          },
          '&::-moz-scrollbar': {
            display: 'none'
          },
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          <Box sx={{
            flexGrow: 1,
            overflow: 'hidden',
            minHeight: 0,
            touchAction: 'none'
          }}>
            {children}
          </Box>
          {showFooter && (
            <Box
              sx={{
                py: 2,
                textAlign: 'center',
                flexShrink: 0,
                backgroundColor: 'white'
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.8rem',
                  letterSpacing: '0.5px',
                  color: '#666666',
                  fontWeight: 500,
                  opacity: 1,
                  display: 'inline-block'
                }}
              >
                Mens sana in corpore sano
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Enlaces flotantes externos - FUERA del contenedor para que sean visibles */}
      <FloatingLinks />
    </ThemeProvider>
  )
}
