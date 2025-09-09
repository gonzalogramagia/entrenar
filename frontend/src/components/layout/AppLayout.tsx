import { Box, Container, CssBaseline, ThemeProvider, createTheme, Typography, Link } from '@mui/material'
import type { ReactNode } from 'react'
import { useState, useEffect } from 'react'

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
  activeTab?: number
  isAuthenticated?: boolean
}

export default function AppLayout({ children, activeTab = 0, isAuthenticated = false }: AppLayoutProps) {
  const [showFooter, setShowFooter] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      // En login, mostrar footer inmediatamente y fijo
      setShowFooter(true)
    } else {
      // En app autenticada, animar con delay
      setShowFooter(false)
      const timer = setTimeout(() => {
        setShowFooter(true)
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [activeTab, isAuthenticated])

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
          }}
        >
          <Box sx={{ 
            flexGrow: 1, 
            overflow: 'auto', 
            minHeight: 0,
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
                flexShrink: 0
              }}
            >
              <Link 
                href="https://www.moovimiento.com" 
                target="_blank" 
                rel="noopener noreferrer"
                sx={{ 
                  textDecoration: 'none',
                  color: 'rgba(25, 118, 210, 0.7)',
                  fontWeight: 500,
                  opacity: showFooter ? 1 : 0,
                  display: 'inline-block',
                  transition: showFooter ? 'all 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'all 0.05s ease-out',
                  '&:hover': {
                    color: '#ff9800'
                  }
                }}
              >
                <Typography variant="caption" sx={{ fontSize: '0.8rem', letterSpacing: '0.5px' }}>
                  ⚡ Powered by Moovimiento
                </Typography>
              </Link>
            </Box>
        </Container>
      </Box>
    </ThemeProvider>
  )
}
