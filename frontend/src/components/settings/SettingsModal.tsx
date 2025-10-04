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
  Close
} from '@mui/icons-material'
import { useUserSettings } from '../../contexts/UserSettingsContext'
import { useAuth } from '../../contexts/AuthContext'

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
  const {
    settings,
    setFavoriteExercises,
    setHasConfiguredFavorites
  } = useUserSettings()
  const { userRole, isAdmin } = useAuth()
  const [hasChanges, setHasChanges] = useState(false)
  const [tempSettings, setTempSettings] = useState(settings)
  const [exerciseSearchTerm, setExerciseSearchTerm] = useState('')
  const [saving, setSaving] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  // Actualizar configuraciones temporales cuando cambien las reales
  useEffect(() => {
    // Para usuarios Admin, Staff o Profe, usar localStorage
    if (userRole === 'admin' || userRole === 'staff' || userRole === 'profe' || isAdmin) {
      try {
        const adminSettings = localStorage.getItem('admin-exercise-settings')
        if (adminSettings) {
          const parsed = JSON.parse(adminSettings)
          setTempSettings(prev => ({
            ...prev,
            favoriteExercises: parsed.favoriteExercises || []
          }))
        } else {
          // Si no hay configuraciones guardadas, usar todos los ejercicios disponibles
          const allExerciseIds = exercises.filter(ex => !ex.is_sport).map(ex => ex.id)
          setTempSettings(prev => ({
            ...prev,
            favoriteExercises: allExerciseIds
          }))
        }
      } catch (error) {
        console.error('Error loading admin exercise settings:', error)
        setTempSettings(settings)
      }
    } else {
      // Para usuarios normales, usar el contexto
      setTempSettings(settings)
    }
  }, [settings, userRole, isAdmin, exercises])

  // Verificar si hay cambios solo en ejercicios favoritos
  useEffect(() => {
    let hasFavoriteChanges = false
    
    if (userRole === 'admin' || userRole === 'staff' || userRole === 'profe' || isAdmin) {
      // Para usuarios admin, comparar con localStorage
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
        console.error('Error checking admin settings changes:', error)
        hasFavoriteChanges = false
      }
    } else {
      // Para usuarios normales, comparar con el contexto
      hasFavoriteChanges = JSON.stringify(tempSettings.favoriteExercises) !== JSON.stringify(settings.favoriteExercises)
    }
    
    setHasChanges(hasFavoriteChanges)
  }, [tempSettings.favoriteExercises, settings.favoriteExercises, userRole, isAdmin])




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
      
      // Para usuarios Admin, Staff o Profe, guardar en localStorage
      if (userRole === 'admin' || userRole === 'staff' || userRole === 'profe' || isAdmin) {
        const settingsToSave = {
          favoriteExercises: tempSettings.favoriteExercises,
          lastUpdated: new Date().toISOString()
        }
        localStorage.setItem('admin-exercise-settings', JSON.stringify(settingsToSave))
        console.log('🔍 Admin settings saved to localStorage:', settingsToSave)
      } else {
        // Para usuarios normales, usar el contexto
        if (JSON.stringify(tempSettings.favoriteExercises) !== JSON.stringify(settings.favoriteExercises)) {
          await setFavoriteExercises(tempSettings.favoriteExercises)
          // Marcar que el usuario ha configurado manualmente sus favoritos
          await setHasConfiguredFavorites(true)
        }
      }
      
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

  // Filtrar ejercicios disponibles (excluir deportes y aplicar filtros de favoritos)
  const availableExercises = useMemo(() => {
    // Primero excluir deportes
    let filtered = exercises.filter(exercise => !exercise.is_sport)
    
    // Para usuarios Admin, Staff o Profe, usar configuraciones de localStorage
    if (userRole === 'admin' || userRole === 'staff' || userRole === 'profe' || isAdmin) {
      try {
        const adminSettings = localStorage.getItem('admin-exercise-settings')
        if (adminSettings) {
          const parsed = JSON.parse(adminSettings)
          if (parsed.favoriteExercises && parsed.favoriteExercises.length > 0) {
            filtered = filtered.filter(exercise => parsed.favoriteExercises.includes(exercise.id))
          }
        }
      } catch (error) {
        console.error('Error loading admin exercise settings:', error)
      }
    } else {
      // Para usuarios normales, usar configuraciones del contexto
      if (settings.hasConfiguredFavorites && settings.favoriteExercises.length > 0) {
        filtered = filtered.filter(exercise => settings.favoriteExercises.includes(exercise.id))
      }
    }
    
    return filtered
  }, [exercises, settings.hasConfiguredFavorites, settings.favoriteExercises, userRole, isAdmin])

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
    setTempSettings(prev => ({
      ...prev,
      favoriteExercises: settings.favoriteExercises
    }))
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
          maxHeight: '90vh',
          overflow: 'hidden',
          width: { xs: '95vw', sm: '90vw', md: '80vw' }
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
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            ⚙️ Panel de Usuario
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

      <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
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
                maxHeight: 300,
                overflowY: 'auto',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                p: 1,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
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
                      '&:hover': {
                        backgroundColor: 'grey.50'
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
                          fontSize: '0.875rem'
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

      <DialogActions sx={{ px: 3, pb: 3 }}>
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
