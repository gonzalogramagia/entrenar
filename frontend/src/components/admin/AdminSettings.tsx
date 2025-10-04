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
import { apiClient } from '../../lib/api'

type Exercise = {
  id: number
  name: string
}

export function AdminSettings() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [favoriteExercises, setFavoriteExercises] = useState<number[]>([])
  const [tempFavoriteExercises, setTempFavoriteExercises] = useState<number[]>([])
  const [exerciseSearchTerm, setExerciseSearchTerm] = useState('')
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

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
          // Si no hay configuraciones guardadas, mostrar todos los ejercicios
          const allExerciseIds = (response as Exercise[])?.map((ex: Exercise) => ex.id) || []
          setFavoriteExercises(allExerciseIds)
          setTempFavoriteExercises(allExerciseIds)
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

  // Verificar si hay cambios en ejercicios favoritos
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
        lastUpdated: new Date().toISOString()
      }
      localStorage.setItem('admin-exercise-settings', JSON.stringify(settingsToSave))
      
      
      // Actualizar el estado
      setFavoriteExercises(tempFavoriteExercises)
      setHasChanges(false)
      setShowSuccessMessage(true)
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

  // Filtrar ejercicios por término de búsqueda
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
        <CircularProgress size={60} thickness={4} sx={{ color: '#1976d2' }} />
        <Typography variant="body1" sx={{ fontWeight: 500, color: '#1976d2' }}>
          Cargando configuraciones...
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Contenido scrolleable */}
      <Box sx={{ 
        flex: 1, 
        overflow: 'auto', 
        p: 2 
      }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: 'primary.main' }}>
          ⚙️ Mis Configuraciones
        </Typography>

        {/* Sección EJERCICIOS FAVORITOS */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            💪 EJERCICIOS DEL REGISTRO
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Configura qué ejercicios aparecen en tu selector del registro de entrenamiento
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
                maxHeight: 250,
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
                      label={exercise.name}
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

      {/* Botones de acción - siempre visibles */}
      <Box sx={{ 
        flexShrink: 0,
        display: 'flex', 
        gap: 2, 
        justifyContent: 'flex-end',
        p: 2,
        borderTop: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper'
      }}>
        <Button
          onClick={handleCancel}
          variant="outlined"
          disabled={saving}
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
