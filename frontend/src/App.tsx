import { AuthProvider, useAuth } from './contexts/AuthContext'
import { TabProvider } from './contexts/TabContext'
import { LanguageProvider } from './contexts/LanguageContext'
import { Box, CircularProgress, Typography } from '@mui/material'
import { useLanguage } from './contexts/LanguageContext'
import { translations } from './i18n/translations'
import LoginComponent from './components/auth/LoginComponent'
import AuthenticatedApp from './components/app/AuthenticatedApp'
import AppLayout from './components/layout/AppLayout'
import ApiTestPage from './pages/ApiTestPage'
import './App.css'

function AppContent() {
  const { isAuthenticated } = useAuth()

  return (
    <AppLayout
      showFooter={isAuthenticated}
    >
      <AppContentInner />
    </AppLayout>
  )
}

function AppContentInner() {
  const { isAuthenticated, isLoading } = useAuth()
  const { language } = useLanguage()
  const t = translations[language].login

  // Mientras se está cargando la sesión inicial de Supabase, 
  // mostramos una pantalla de carga para evitar que parpadee el login
  if (isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        width: '100vw',
        bgcolor: '#FFD700',
        gap: 2
      }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: 2,
          marginTop: '-60px'
        }}>
          <CircularProgress 
            size={48}
            thickness={4}
            sx={{ 
              color: 'white',
              '& .MuiCircularProgress-circle': {
                strokeLinecap: 'round'
              }
            }} 
          />
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
            {t.authenticating}
          </Typography>
        </Box>
      </Box>
    )
  }

  if (!isAuthenticated) {
    return <LoginComponent />
  }

  return <AuthenticatedApp />
}

function App() {
  // Detectar si estamos en la ruta /api
  const isApiTestPage = window.location.pathname === '/api'

  if (isApiTestPage) {
    return (
      <AuthProvider>
        <ApiTestPage />
      </AuthProvider>
    )
  }

  return (
    <LanguageProvider>
      <AuthProvider>
        <TabProvider>
          <AppContent />
        </TabProvider>
      </AuthProvider>
    </LanguageProvider>
  )
}

export default App

