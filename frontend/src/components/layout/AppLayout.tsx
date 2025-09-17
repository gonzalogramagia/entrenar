import { Box, Container, CssBaseline, ThemeProvider, createTheme, Typography, Link } from '@mui/material'
import type { ReactNode } from 'react'

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
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: '48px',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: '48px',
          fontSize: '14px',
          fontWeight: 500,
        },
      },
    },
  },
})

type AppLayoutProps = {
  children: ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
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
        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)', // Gradiente azul de marca
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
          width: '375px',
          maxWidth: '375px',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          border: '1px solid #ccc',
          borderRadius: '20px',
          boxShadow: '0 0 20px rgba(0,0,0,0.3)',
          height: '667px',
          backgroundColor: 'white',
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
        <Container 
          maxWidth={false}
          sx={{ 
            flexGrow: 1, 
            py: 1,
            px: 2,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden',
            backgroundColor: 'white',
            // En mobile eliminar padding y borde blanco
            '@media (max-width: 767px)': {
              py: 0,
              px: 0,
              backgroundColor: 'transparent'
            }
          }}
        >
          <Box sx={{ 
            flexGrow: 1, 
            overflow: 'hidden', 
            minHeight: 0,
            touchAction: 'none',
            '&::-webkit-scrollbar': {
              display: 'none'
            },
            '&::-moz-scrollbar': {
              display: 'none'
            },
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}>
            {children}
          </Box>
                      <Box 
              sx={{ 
                py: 1.5,
                textAlign: 'center',
                flexShrink: 0,
                // En mobile solo mostrar espacio en blanco
                '@media (max-width: 767px)': {
                  py: 1.5,
                  '& *': {
                    display: 'none'
                  }
                }
              }}
            >
              <Link 
                href="https://gonza.gr" 
                target="_blank" 
                rel="noopener noreferrer"
                sx={{ 
                  textDecoration: 'none',
                  color: '#eab308', // yellow-500
                  fontWeight: 500,
                  opacity: 1,
                  display: 'inline-block',
                  transition: 'all 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  '&:hover': {
                    color: '#ca8a04' // yellow-600
                  }
                }}
              >
                <Typography variant="caption" sx={{ fontSize: '0.8rem', letterSpacing: '0.5px' }}>
                  💻 🧉 Desarrollado por Gonza
                </Typography>
              </Link>
            </Box>
        </Container>
      </Box>
    </ThemeProvider>
  )
}
