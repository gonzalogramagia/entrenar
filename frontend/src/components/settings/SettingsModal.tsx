import { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControlLabel,
  Switch,
  Typography,
  Box,
  Divider,
  Alert,
  IconButton,
  TextField,
  CircularProgress,
  Snackbar
} from '@mui/material'
import {
  Close,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material'

type Exercise = {
  id: number
  name: string
  is_sport?: boolean
}

type SettingsModalProps = {
  open: boolean
  onClose: () => void
  exercises?: Exercise[] // Lista de ejercicios disponibles
}

export default function SettingsModal({ open, onClose, exercises = [] }: SettingsModalProps) {
  const [hasChanges, setHasChanges] = useState(false)
  const [tempSettings, setTempSettings] = useState<{ favoriteExercises: number[] }>({ favoriteExercises: [] })
  const [exerciseSearchTerm, setExerciseSearchTerm] = useState('')
  const [saving, setSaving] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  // Actualizar configuraciones temporales cuando cambien las reales
  useEffect(() => {
    // Todos los usuarios usan localStorage
    try {
      const adminSettings = localStorage.getItem('admin-exercise-settings')
      if (adminSettings) {
        const parsed = JSON.parse(adminSettings)
        setTempSettings(prev => ({
          ...prev,
          favoriteExercises: parsed.favoriteExercises || []
        }))
      } else {
        // Si no hay configuraciones guardadas, inicializar con todos los ejercicios disponibles
        const allExerciseIds = exercises.filter(ex => !ex.is_sport).map(ex => ex.id)
        setTempSettings(prev => ({
          ...prev,
          favoriteExercises: allExerciseIds
        }))
        
        // Guardar automáticamente todos los ejercicios como favoritos en localStorage
        const settingsToSave = {
          favoriteExercises: allExerciseIds,
          lastUpdated: new Date().toISOString()
        }
        localStorage.setItem('admin-exercise-settings', JSON.stringify(settingsToSave))
        console.log('🔍 Initial settings saved to localStorage:', settingsToSave)
      }
    } catch (error) {
      console.error('Error loading exercise settings:', error)
      // Fallback: inicializar con todos los ejercicios disponibles
      const allExerciseIds = exercises.filter(ex => !ex.is_sport).map(ex => ex.id)
      setTempSettings(prev => ({
        ...prev,
        favoriteExercises: allExerciseIds
      }))
      
      // Guardar automáticamente en localStorage
      const settingsToSave = {
        favoriteExercises: allExerciseIds,
        lastUpdated: new Date().toISOString()
      }
      localStorage.setItem('admin-exercise-settings', JSON.stringify(settingsToSave))
      console.log('🔍 Fallback settings saved to localStorage:', settingsToSave)
    }
  }, [exercises])

  // Verificar si hay cambios solo en ejercicios favoritos
  useEffect(() => {
    let hasFavoriteChanges = false
    
    try {
      const adminSettings = localStorage.getItem('admin-exercise-settings')
      if (adminSettings) {
        const parsed = JSON.parse(adminSettings)
        hasFavoriteChanges = JSON.stringify(tempSettings.favoriteExercises) !== JSON.stringify(parsed.favoriteExercises || [])
      } else {
        // Si no hay configuraciones guardadas, cualquier cambio es válido
        hasFavoriteChanges = tempSettings.favoriteExercises.length > 0
      }
    } catch (error) {
      console.error('Error checking settings changes:', error)
      hasFavoriteChanges = false
    }
    
    setHasChanges(hasFavoriteChanges)
  }, [tempSettings.favoriteExercises])




  // const handleToggleShowOwnWorkoutsInSocial = () => {
  //   setTempSettings(prev => ({
  //     ...prev,
  //     showOwnWorkoutsInSocial: !prev.showOwnWorkoutsInSocial
  //   }))
  //   setHasChanges(true)
  // }



  const handleToggleFavoriteExercise = (exerciseId: number) => {
    const isFavorite = tempSettings.favoriteExercises.includes(exerciseId)
    const newFavorites = isFavorite
      ? tempSettings.favoriteExercises.filter(id => id !== exerciseId)
      : [...tempSettings.favoriteExercises, exerciseId]

    setTempSettings(prev => ({
      ...prev,
      favoriteExercises: newFavorites
    }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      // Guardar en localStorage para todos los usuarios
      const settingsToSave = {
        favoriteExercises: tempSettings.favoriteExercises,
        lastUpdated: new Date().toISOString()
      }
      localStorage.setItem('admin-exercise-settings', JSON.stringify(settingsToSave))
      console.log('🔍 Settings saved to localStorage:', settingsToSave)
      
      setHasChanges(false)
      setShowSuccessMessage(true)
      // Cerrar el modal después de un breve delay para mostrar el mensaje
      setTimeout(() => {
        onClose()
      }, 1000)
    } catch (error) {
      console.error('Error saving settings:', error)
      // Aquí podrías mostrar un mensaje de error al usuario
    } finally {
      setSaving(false)
    }
  }

  // Filtrar ejercicios disponibles (solo excluir deportes, mostrar todos para configuración)
  const availableExercises = useMemo(() => {
    // Solo excluir deportes, mostrar todos los ejercicios para que puedan ser configurados
    return exercises.filter(exercise => !exercise.is_sport)
  }, [exercises])

  // Filtrar ejercicios por término de búsqueda
  const filteredExercises = useMemo(() => {
    if (!exerciseSearchTerm.trim()) {
      return availableExercises
    }
    return availableExercises.filter(exercise =>
      exercise.name.toLowerCase().includes(exerciseSearchTerm.toLowerCase())
    )
  }, [availableExercises, exerciseSearchTerm])

  const handleCancel = () => {
    // Recargar configuraciones desde localStorage
    try {
      const adminSettings = localStorage.getItem('admin-exercise-settings')
      if (adminSettings) {
        const parsed = JSON.parse(adminSettings)
        setTempSettings(prev => ({
          ...prev,
          favoriteExercises: parsed.favoriteExercises || []
        }))
      }
    } catch (error) {
      console.error('Error loading settings for cancel:', error)
    }
    setHasChanges(false)
    setExerciseSearchTerm('')
    onClose()
  }



  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '95vh',
          width: { xs: '95vw', sm: '90vw', md: '80vw' },
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        bgcolor: 'primary.main',
        color: 'white',
        pb: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AdminIcon sx={{ fontSize: 24, color: 'white' }} />
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            Panel de Usuario
          </Typography>
        </Box>
        <IconButton
          onClick={handleCancel}
          size="small"
          sx={{
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, overflow: 'auto', flex: 1 }}>
        <Box sx={{ p: { xs: 1, sm: 2 } }}>
        {/* Sección NOTIFICACIONES UNC - OCULTA */}
        {/* <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            NOTIFICACIONES
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={tempSettings.uncNotificationsEnabled}
                onChange={handleToggleUncNotifications}
                color="primary"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    Notificaciones de la UNC
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {tempSettings.uncNotificationsEnabled
                      ? 'Recibirás notificaciones sobre el gimnasio de la UNC'
                      : 'No recibirás notificaciones sobre el gimnasio de la UNC'
                    }
                  </Typography>
                </Box>
              </Box>
            }
            sx={{
              alignItems: 'flex-start',
              width: '100%',
              m: 0,
              p: 2,
              borderRadius: 1,
              backgroundColor: 'grey.50',
              '&:hover': {
                backgroundColor: 'grey.100'
              }
            }}
          />
        </Box>

        <Divider sx={{ my: 2 }} /> */}

        {/* Sección FEED SOCIAL - OCULTA */}
        {/* <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            FEED SOCIAL
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={tempSettings.showOwnWorkoutsInSocial}
                onChange={handleToggleShowOwnWorkoutsInSocial}
                color="primary"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    Mostrar mis ejercicios
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {tempSettings.showOwnWorkoutsInSocial
                      ? 'Tus entrenamientos aparecen en el feed social'
                      : 'Tus entrenamientos están ocultos del feed social'
                    }
                  </Typography>
                </Box>
              </Box>
            }
            sx={{
              alignItems: 'flex-start',
              width: '100%',
              m: 0,
              p: 2,
              borderRadius: 1,
              backgroundColor: 'grey.50',
              '&:hover': {
                backgroundColor: 'grey.100'
              }
            }}
          />
        </Box>

        <Divider sx={{ my: 2 }} /> */}



        <Divider sx={{ my: 2 }} />

        {/* Sección EJERCICIOS FAVORITOS */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            EJERCICIOS FAVORITOS
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Selecciona los ejercicios que quieres que aparezcan en el selector del registro de entrenamiento
          </Typography>

          {/* Buscador de ejercicios */}
          <TextField
            placeholder="Buscar ejercicios..."
            value={exerciseSearchTerm}
            onChange={(e) => setExerciseSearchTerm(e.target.value)}
            size="small"
            fullWidth
            sx={{ mb: 2 }}
          />

          {availableExercises.length > 0 ? (
            <Box>
              <Box sx={{
                maxHeight: 400,
                overflowY: 'auto',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                p: 1,
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1
              }}>
                {filteredExercises.map(exercise => (
                  <Box
                    key={exercise.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      py: 0.5,
                      px: 1,
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      backgroundColor: tempSettings.favoriteExercises.includes(exercise.id) ? 'primary.50' : 'background.paper',
                      minWidth: '200px',
                      flex: '1 1 200px',
                      '&:hover': {
                        backgroundColor: tempSettings.favoriteExercises.includes(exercise.id) ? 'primary.100' : 'grey.50'
                      }
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Switch
                          checked={tempSettings.favoriteExercises.includes(exercise.id)}
                          onChange={() => handleToggleFavoriteExercise(exercise.id)}
                          size="small"
                          color="primary"
                        />
                      }
                      label={exercise.name}
                      sx={{
                        m: 0,
                        width: '100%',
                        '& .MuiFormControlLabel-label': {
                          fontSize: '0.875rem',
                          fontWeight: tempSettings.favoriteExercises.includes(exercise.id) ? 500 : 400
                        }
                      }}
                    />
                  </Box>
                ))}
              </Box>
            </Box>
          ) : (
            <Alert severity="info">
              <Typography variant="body2">
                Los ejercicios se cargarán automáticamente cuando estén disponibles
              </Typography>
            </Alert>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, flexShrink: 0, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button
          onClick={handleCancel}
          variant="outlined"
          sx={{ minWidth: 100 }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!hasChanges || saving}
          sx={{ minWidth: 100 }}
        >
          {saving ? (
            <>
              <CircularProgress size={16} sx={{ mr: 1 }} />
              Guardando...
            </>
          ) : (
            'Guardar'
          )}
        </Button>
      </DialogActions>

      {/* Mensaje de éxito */}
      <Snackbar
        open={showSuccessMessage}
        autoHideDuration={3000}
        onClose={() => setShowSuccessMessage(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowSuccessMessage(false)} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          ✅ Configuraciones guardadas exitosamente
        </Alert>
      </Snackbar>
    </Dialog>
  )
}
