import { AuthProvider, useAuth } from './contexts/AuthContext'
import { TabProvider } from './contexts/TabContext'
import { LanguageProvider } from './contexts/LanguageContext'
import { Box, CircularProgress } from '@mui/material'
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

  // Mientras se está cargando la sesión inicial de Supabase, 
  // mostramos una pantalla de carga para evitar que parpadee el login
  if (isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        width: '100vw',
        bgcolor: '#FFD700' 
      }}>
        <CircularProgress sx={{ color: 'white' }} />
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

