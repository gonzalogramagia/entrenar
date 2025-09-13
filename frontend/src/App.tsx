import { AuthProvider, useAuth } from './contexts/AuthContext'
import { TabProvider } from './contexts/TabContext'
import LoginComponent from './components/auth/LoginComponent'
import AuthenticatedApp from './components/app/AuthenticatedApp'
import AppLayout from './components/layout/AppLayout'
import ApiTestPage from './pages/ApiTestPage'
import './App.css'

function AppContent() {
  return (
    <AppLayout>
      <AppContentInner />
    </AppLayout>
  )
}

function AppContentInner() {
  const { isAuthenticated } = useAuth()

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
    <AuthProvider>
      <TabProvider>
        <AppContent />
      </TabProvider>
    </AuthProvider>
  )
}

export default App
