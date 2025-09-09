import { useEffect } from 'react'
import { Box, Button, Typography, Alert, CircularProgress, Stack, Paper } from '@mui/material'
import { useHealthCheck, useWorkouts, useCurrentUser } from '../../hooks/useApi'
import { useAuth } from '../../contexts/AuthContext'

export default function ApiTest() {
  const { user, session } = useAuth()
  const healthCheck = useHealthCheck()
  const workouts = useWorkouts()
  const currentUser = useCurrentUser()

  useEffect(() => {
    // Auto-ejecutar health check al montar
    healthCheck.execute()
  }, [])

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        🧪 API Test
      </Typography>
      
      <Stack spacing={3}>
        {/* Información de autenticación */}
        <Paper elevation={2} sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            🔐 Authentication Status
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography><strong>Usuario:</strong> {user?.email || 'No autenticado'}</Typography>
            <Typography><strong>Session:</strong> {session ? '✅ Activa' : '❌ Inactiva'}</Typography>
            <Typography><strong>Token:</strong> {session?.access_token ? `${session.access_token.substring(0, 20)}...` : 'Sin token'}</Typography>
          </Box>
        </Paper>

        {/* Tests de API */}
        <Paper elevation={2} sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            🌐 Backend API Tests
          </Typography>

          {/* Health Check */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Health Check:
            </Typography>
            {healthCheck.loading && <CircularProgress size={20} />}
            {healthCheck.error && (
              <Alert severity="error">Error: {healthCheck.error}</Alert>
            )}
            {healthCheck.data && (
              <Alert severity="success">
                ✅ Backend conectado: {JSON.stringify(healthCheck.data)}
              </Alert>
            )}
            <Button 
              variant="outlined" 
              onClick={() => healthCheck.execute()}
              sx={{ mt: 1 }}
              disabled={healthCheck.loading}
            >
              Test Health
            </Button>
          </Box>

          {/* Workouts */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Workouts:
            </Typography>
            {workouts.loading && <CircularProgress size={20} />}
            {workouts.error && (
              <Alert severity="error">Error: {workouts.error}</Alert>
            )}
            {workouts.data && (
              <Alert severity="success">
                ✅ Workouts obtenidos: {Array.isArray(workouts.data) ? `${workouts.data.length} items` : 'Datos recibidos'}
              </Alert>
            )}
            <Button 
              variant="outlined" 
              onClick={() => workouts.execute()}
              sx={{ mt: 1 }}
              disabled={workouts.loading || !session}
            >
              Get Workouts
            </Button>
          </Box>

          {/* Current User */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Current User:
            </Typography>
            {currentUser.loading && <CircularProgress size={20} />}
            {currentUser.error && (
              <Alert severity="error">Error: {currentUser.error}</Alert>
            )}
            {currentUser.data && (
              <Alert severity="success">
                ✅ Usuario del backend obtenido
              </Alert>
            )}
            <Button 
              variant="outlined" 
              onClick={() => currentUser.execute()}
              sx={{ mt: 1 }}
              disabled={currentUser.loading || !session}
            >
              Get User Info
            </Button>
          </Box>
        </Paper>
      </Stack>
    </Box>
  )
}
