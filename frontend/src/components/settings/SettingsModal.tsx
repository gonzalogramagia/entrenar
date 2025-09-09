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
  CircularProgress
} from '@mui/material'
import {
  Settings,
  Close
} from '@mui/icons-material'
import { useUserSettings } from '../../contexts/UserSettingsContext'

type Exercise = {
  id: number
  name: string
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
  const [hasChanges, setHasChanges] = useState(false)
  const [tempSettings, setTempSettings] = useState(settings)
  const [exerciseSearchTerm, setExerciseSearchTerm] = useState('')
  const [saving, setSaving] = useState(false)

  // Actualizar configuraciones temporales cuando cambien las reales
  useEffect(() => {
    setTempSettings(settings)
  }, [settings])

  // Verificar si hay cambios solo en ejercicios favoritos
  useEffect(() => {
    const hasFavoriteChanges = JSON.stringify(tempSettings.favoriteExercises) !== JSON.stringify(settings.favoriteExercises)
    setHasChanges(hasFavoriteChanges)
  }, [tempSettings.favoriteExercises, settings.favoriteExercises])




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
      // Aplicar cambios
      // if (tempSettings.showOwnWorkoutsInSocial !== settings.showOwnWorkoutsInSocial) {
      //   await toggleShowOwnWorkoutsInSocial()
      // }
      if (JSON.stringify(tempSettings.favoriteExercises) !== JSON.stringify(settings.favoriteExercises)) {
        await setFavoriteExercises(tempSettings.favoriteExercises)
        // Marcar que el usuario ha configurado manualmente sus favoritos
        await setHasConfiguredFavorites(true)
      }
      setHasChanges(false)
      onClose()
    } catch (error) {
      console.error('Error saving settings:', error)
      // Aquí podrías mostrar un mensaje de error al usuario
    } finally {
      setSaving(false)
    }
  }

  // Filtrar ejercicios por término de búsqueda
  const filteredExercises = useMemo(() => {
    if (!exerciseSearchTerm.trim()) {
      return exercises
    }
    return exercises.filter(exercise =>
      exercise.name.toLowerCase().includes(exerciseSearchTerm.toLowerCase())
    )
  }, [exercises, exerciseSearchTerm])

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
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          maxHeight: '80vh'
        }
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        pb: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Settings sx={{ color: 'primary.main' }} />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Configuración
          </Typography>
        </Box>
        <IconButton
          onClick={handleCancel}
          size="small"
          sx={{
            color: 'text.secondary',
            '&:hover': {
              backgroundColor: 'grey.100'
            }
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
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

          {exercises.length > 0 ? (
            <Box>
              <Box sx={{
                maxHeight: 200,
                overflowY: 'auto',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                p: 1
              }}>
                {filteredExercises.map(exercise => (
                  <FormControlLabel
                    key={exercise.id}
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
                      py: 0.5,
                      px: 1,
                      borderRadius: 1,
                      '&:hover': {
                        backgroundColor: 'grey.50'
                      }
                    }}
                  />
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
    </Dialog>
  )
}
