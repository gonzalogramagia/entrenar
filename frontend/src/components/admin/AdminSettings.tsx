import { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Typography,
  FormControlLabel,
  Switch,
  Alert,
  TextField,
  CircularProgress,
  Button,
  Snackbar
} from '@mui/material'
import { Download as DownloadIcon } from '@mui/icons-material'
import { apiClient } from '../../lib/api'

type Exercise = {
  id: number
  name: string
  is_sport?: boolean
}

type AdminSettingsProps = {
  onClose?: () => void
}

export function AdminSettings({ onClose }: AdminSettingsProps) {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [favoriteExercises, setFavoriteExercises] = useState<number[]>([])
  const [tempFavoriteExercises, setTempFavoriteExercises] = useState<number[]>([])
  const [exerciseSearchTerm, setExerciseSearchTerm] = useState('')
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [downloading, setDownloading] = useState(false)

  // Cargar ejercicios y configuraciones al montar el componente
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)

        // Cargar ejercicios
        const response = await apiClient.getExercises() as Exercise[]
        setExercises(response || [])

        // Cargar configuraciones desde localStorage
        const savedSettings = localStorage.getItem('admin-exercise-settings')
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings)
          setFavoriteExercises(parsed.favoriteExercises || [])
          setTempFavoriteExercises(parsed.favoriteExercises || [])
        } else {
          // Si no hay configuraciones guardadas, inicializar solo con ejercicios no-deportes
          const nonSportExerciseIds = (response as Exercise[])?.filter((ex: Exercise) => !ex.is_sport).map((ex: Exercise) => ex.id) || []
          setFavoriteExercises(nonSportExerciseIds)
          setTempFavoriteExercises(nonSportExerciseIds)

          // Guardar automáticamente la configuración inicial
          const settingsToSave = {
            favoriteExercises: nonSportExerciseIds,
            hasConfigured: true,
            lastUpdated: new Date().toISOString()
          }
          localStorage.setItem('admin-exercise-settings', JSON.stringify(settingsToSave))
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Actualizar configuraciones temporales cuando cambien las reales
  useEffect(() => {
    setTempFavoriteExercises(favoriteExercises)
  }, [favoriteExercises])

  // Verificar si hay cambios en ejercicios favoritos o configuraciones
  useEffect(() => {
    const hasFavoriteChanges = JSON.stringify(tempFavoriteExercises) !== JSON.stringify(favoriteExercises)
    setHasChanges(hasFavoriteChanges)
  }, [tempFavoriteExercises, favoriteExercises])

  const handleToggleFavoriteExercise = (exerciseId: number) => {
    const isFavorite = tempFavoriteExercises.includes(exerciseId)
    const newFavorites = isFavorite
      ? tempFavoriteExercises.filter(id => id !== exerciseId)
      : [...tempFavoriteExercises, exerciseId]

    setTempFavoriteExercises(newFavorites)
    setHasChanges(true)
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      // Guardar en localStorage
      const settingsToSave = {
        favoriteExercises: tempFavoriteExercises,
        hasConfigured: true,
        lastUpdated: new Date().toISOString()
      }
      localStorage.setItem('admin-exercise-settings', JSON.stringify(settingsToSave))


      // Actualizar el estado
      setFavoriteExercises(tempFavoriteExercises)
      setHasChanges(false)
      setShowSuccessMessage(true)

      // Cerrar el panel después de un breve delay para mostrar el mensaje
      if (onClose) {
        setTimeout(() => {
          onClose()
        }, 1000)
      }
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setTempFavoriteExercises(favoriteExercises)
    setHasChanges(false)
    setExerciseSearchTerm('')
  }

  const handleDownloadWorkouts = async () => {
    try {
      setDownloading(true)

      // Intentar primero con el endpoint de exportación
      let response = await fetch('/api/workouts/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      // Si falla con 405, usar método alternativo
      if (!response.ok && response.status === 405) {
        console.log('Endpoint /workouts/export no disponible, usando método alternativo...')

        // Método alternativo: obtener datos y generar CSV en el frontend
        try {
          const workouts = await apiClient.getWorkouts() as any[]

          // Generar CSV
          const csvContent = generateCSVFromWorkouts(workouts)

          // Descargar archivo
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `entrenamientos_${new Date().toISOString().split('T')[0]}.csv`
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)

          return // Salir exitosamente
        } catch (altError) {
          throw new Error('Error generando archivo CSV: ' + (altError instanceof Error ? altError.message : 'Error desconocido'))
        }
      }

      if (!response.ok) {
        throw new Error(`Error al exportar entrenamientos: ${response.status}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `entrenamientos_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

    } catch (error) {
      console.error('Error downloading workouts:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      alert(`Error al descargar entrenamientos: ${errorMessage}`)
    } finally {
      setDownloading(false)
    }
  }

  // Función para generar CSV desde los datos de entrenamientos
  const generateCSVFromWorkouts = (workouts: any[]) => {
    const headers = ['Fecha', 'Ejercicio', 'Peso (kg)', 'Repeticiones', 'Serie', 'Tiempo (seg)', 'Observaciones', 'Día de Entrenamiento']

    let csvContent = '\uFEFF' // BOM para UTF-8

    // Agregar encabezados
    csvContent += headers.map(header => `"${header}"`).join(',') + '\n'

    // Agregar datos
    workouts.forEach(workout => {
      const row = [
        new Date(workout.created_at).toLocaleString('es-AR'),
        workout.exercise_name || '',
        workout.weight ? (workout.weight / 10).toFixed(1) : '',
        workout.reps || '',
        workout.set || '',
        workout.seconds || '',
        workout.observations || '',
        workout.workout_day_name || ''
      ]
      csvContent += row.map(field => `"${field}"`).join(',') + '\n'
    })

    return csvContent
  }

  // Filtrar ejercicios por término de búsqueda (mostrar todos, incluyendo deportes)
  const filteredExercises = useMemo(() => {
    if (!exerciseSearchTerm.trim()) {
      return exercises
    }
    return exercises.filter(exercise =>
      exercise.name.toLowerCase().includes(exerciseSearchTerm.toLowerCase())
    )
  }, [exercises, exerciseSearchTerm])

  if (loading) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress size={60} thickness={4} sx={{ color: 'primary.main' }} />
        <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
          Cargando configuraciones...
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{
      maxWidth: '900px',
      mx: 'auto',
      px: { xs: 2, sm: 3, md: 4 },
      height: 'calc(100vh - 300px)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 3,
        pt: 2 // Padding superior para bajar el contenido
      }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
          Mis Configuraciones
        </Typography>
      </Box>

      {/* Contenido scrolleable */}
      <Box sx={{
        flex: 1,
        overflow: 'auto',
        minHeight: 0,
        maxHeight: '400px' // Limitar altura para asegurar que los botones sean visibles
      }}>

        {/* Sección EXPORTAR DATOS */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            📊 EXPORTAR MIS DATOS
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Descarga todos tus entrenamientos en formato CSV para análisis o respaldo
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
            <Button
              variant="outlined"
              startIcon={downloading ? <CircularProgress size={16} /> : <DownloadIcon />}
              onClick={handleDownloadWorkouts}
              disabled={downloading}
            >
              {downloading ? 'Generando archivo...' : 'Descargar entrenamientos (CSV)'}
            </Button>

            {/* 
            <Button
              variant="outlined"
              startIcon={<Box sx={{ mr: 1 }}>✉️</Box>}
              onClick={() => {
                const mailtoLink = `mailto:?subject=Mis Entrenamientos&body=Hola, te adjunto mis entrenamientos.`
                window.location.href = mailtoLink
              }}
            >
              Enviar por mail
            </Button>
            */}
          </Box>

        </Box>

        {/* Sección EJERCICIOS FAVORITOS */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            💪 EJERCICIOS DEL REGISTRO
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Configura qué ejercicios aparecen en tu selector del registro de entrenamiento
          </Typography>

          {/* Buscador y botones de selección rápida */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            <TextField
              placeholder="Buscar ejercicios..."
              value={exerciseSearchTerm}
              onChange={(e) => setExerciseSearchTerm(e.target.value)}
              size="small"
              fullWidth
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                size="small" 
                variant="outlined" 
                onClick={() => setTempFavoriteExercises(exercises.map(ex => ex.id))}
                sx={{ whiteSpace: 'nowrap' }}
              >
                Seleccionar todos
              </Button>
              <Button 
                size="small" 
                variant="outlined" 
                color="inherit"
                onClick={() => setTempFavoriteExercises([])}
                sx={{ whiteSpace: 'nowrap' }}
              >
                Deseleccionar
              </Button>
            </Box>
          </Box>

          {exercises.length > 0 ? (
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
                gap: 1,
                alignItems: 'start'
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
                      backgroundColor: tempFavoriteExercises.includes(exercise.id) ? 'primary.50' : 'background.paper',
                      minHeight: '40px',
                      width: '100%',
                      '&:hover': {
                        backgroundColor: tempFavoriteExercises.includes(exercise.id) ? 'primary.100' : 'grey.50'
                      }
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Switch
                          checked={tempFavoriteExercises.includes(exercise.id)}
                          onChange={() => handleToggleFavoriteExercise(exercise.id)}
                          size="small"
                          color="primary"
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <span>{exercise.name}</span>
                          {exercise.is_sport && (
                            <Box
                              sx={{
                                fontSize: '0.7rem',
                                color: 'primary.main',
                                fontWeight: 'bold',
                                px: 0.5,
                                py: 0.25,
                                borderRadius: 0.5,
                                backgroundColor: 'primary.50',
                                border: '1px solid',
                                borderColor: 'primary.200'
                              }}
                            >
                              DEPORTE
                            </Box>
                          )}
                        </Box>
                      }
                      sx={{
                        m: 0,
                        width: '100%',
                        '& .MuiFormControlLabel-label': {
                          fontSize: '0.875rem',
                          fontWeight: tempFavoriteExercises.includes(exercise.id) ? 500 : 400
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
      </Box>

      {/* Botones de acción - SIEMPRE VISIBLES */}
      <Box sx={{
        flexShrink: 0,
        display: 'flex',
        gap: 2,
        justifyContent: 'flex-end',
        p: 3,
        pt: 1,
        borderTop: '1px solid',
        borderColor: 'divider'
      }}>
        <Button
          onClick={handleCancel}
          disabled={saving}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!hasChanges || saving}
        >
          {saving ? (
            <>
              <CircularProgress size={16} sx={{ mr: 1 }} />
              Guardando...
            </>
          ) : (
            'Guardar Cambios'
          )}
        </Button>
      </Box>

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
    </Box>
  )
}
