import { Box, Typography, Paper, Button } from '@mui/material'
import { ArrowBack } from '@mui/icons-material'
import ApiTest from '../components/debug/ApiTest'

export default function ApiTestPage() {
  const handleGoBack = () => {
    window.location.href = '/'
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      p: 3
    }}>
      <Paper sx={{ 
        maxWidth: 1200, 
        mx: 'auto', 
        p: 4,
        borderRadius: 3,
        boxShadow: 4
      }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={handleGoBack}
            variant="outlined"
            sx={{ mr: 3 }}
          >
            Volver a la App
          </Button>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              🔧 API Testing Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Diagnósticos y pruebas de conexión con el backend
            </Typography>
          </Box>
        </Box>

        {/* API Test Component */}
        <ApiTest />
      </Paper>
    </Box>
  )
}
