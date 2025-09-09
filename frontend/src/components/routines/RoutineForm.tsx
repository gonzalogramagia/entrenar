import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  TextField,
  Button,
  Typography,
  Divider,
  IconButton,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon
} from '@mui/icons-material'
import { apiClient } from '../../lib/api'
import { useUserSettings } from '../../contexts/UserSettingsContext'
import type { RoutineWithExercises, CreateRoutineRequest, CreateRoutineExerciseRequest } from '../../types/routine'

interface Exercise {
  id: number
  name: string
  is_sport?: boolean
}

interface RoutineFormProps {
  routine?: RoutineWithExercises
  onSubmit: (data: CreateRoutineRequest) => void
  onCancel: () => void
}

const RoutineForm: React.FC<RoutineFormProps> = ({ routine, onSubmit, onCancel }) => {
  const { settings } = useUserSettings()
  const [name, setName] = useState(routine?.name || '')
  const [description, setDescription] = useState(routine?.description || '')
  const [exercises, setExercises] = useState<CreateRoutineExerciseRequest[]>(
    routine?.exercises?.map(ex => ({
      exercise_id: ex.exercise_id,
      order_index: ex.order_index,
      sets: ex.sets,
      reps: ex.reps,
      weight: ex.weight,
      rest_time_seconds: ex.rest_time_seconds,
      notes: ex.notes || ''
    })) || []
  )
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadExercises = useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiClient.getExercises() as Exercise[]
      
      // Filtrar ejercicios: excluir deportes y aplicar filtros de favoritos
      let filteredExercises = data.filter(exercise => !exercise.is_sport) // Excluir deportes
      
      // Filtrar solo los ejercicios favoritos si el usuario ha configurado manualmente sus favoritos
      if (settings.hasConfiguredFavorites && settings.favoriteExercises.length > 0) {
        filteredExercises = filteredExercises.filter(exercise => settings.favoriteExercises.includes(exercise.id))
      }
      
      setAvailableExercises(filteredExercises)
    } catch (err) {
      console.error('Error cargando ejercicios:', err)
      setError('Error al cargar los ejercicios disponibles')
    } finally {
      setLoading(false)
    }
  }, [settings.favoriteExercises])

  useEffect(() => {
    loadExercises()
  }, [loadExercises])

  // Detectar si el ejercicio seleccionado es Running (ID: 18) o Bici
  const isRunningExercise = (exerciseId: number) => exerciseId === 18
  const isBiciExercise = (exerciseId: number) => {
    const exercise = availableExercises.find(ex => ex.id === exerciseId)
    return exercise?.name?.toLowerCase().includes('bici') || exerciseId === 30 || false
  }
  const isRunningOrBiciExercise = (exerciseId: number) => isRunningExercise(exerciseId) || isBiciExercise(exerciseId)

  const handleAddExercise = () => {
    const newExercise: CreateRoutineExerciseRequest = {
      exercise_id: 0,
      order_index: exercises.length,
      sets: 1,
      reps: 10,
      weight: undefined,
      rest_time_seconds: 60,
      notes: ''
    }
    setExercises([...exercises, newExercise])
  }

  const handleRemoveExercise = (index: number) => {
    const newExercises = exercises.filter((_, i) => i !== index)
    // Reordenar los índices
    const reorderedExercises = newExercises.map((ex, i) => ({
      ...ex,
      order_index: i
    }))
    setExercises(reorderedExercises)
  }

  const handleExerciseChange = (index: number, field: keyof CreateRoutineExerciseRequest, value: any) => {
    const newExercises = [...exercises]
    newExercises[index] = {
      ...newExercises[index],
      [field]: value
    }
    
    // Si se cambia el ejercicio a Running o Bici, establecer reps = 1 y sets = 1 automáticamente
    if (field === 'exercise_id' && (value === 18 || isBiciExercise(value))) {
      newExercises[index].reps = 1
      newExercises[index].sets = 1
    }
    
    setExercises(newExercises)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      setError('El nombre de la rutina es obligatorio')
      return
    }

    if (exercises.length === 0) {
      setError('Debes agregar al menos un ejercicio a la rutina')
      return
    }

    // Validar que todos los ejercicios tengan un ejercicio seleccionado
    const hasInvalidExercises = exercises.some(ex => ex.exercise_id === 0)
    if (hasInvalidExercises) {
      setError('Todos los ejercicios deben tener un ejercicio seleccionado')
      return
    }

    const routineData: CreateRoutineRequest = {
      name: name.trim(),
      description: description.trim() || undefined,
      exercises: exercises
    }

    onSubmit(routineData)
  }



  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          label="Nombre de la rutina"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          sx={{ mb: 2 }}
        />
      </Box>
      
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          label="Descripción (opcional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          multiline
          rows={3}
        />
      </Box>

      <Divider sx={{ my: 3 }}>
        <Typography variant="h6" component="span">
          Ejercicios de la rutina
        </Typography>
      </Divider>

      {exercises.map((exercise, index) => (
        <Card key={index} sx={{ mb: 2 }}>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <DragIcon sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="subtitle2" sx={{ flex: 1 }}>
                Ejercicio {index + 1}
              </Typography>
              <IconButton
                size="small"
                onClick={() => handleRemoveExercise(index)}
                sx={{ color: 'error.main' }}
              >
                <DeleteIcon />
              </IconButton>
            </Box>

            <Box sx={{ mb: 2 }}>
              <FormControl fullWidth required>
                <InputLabel>Ejercicio</InputLabel>
                <Select
                  value={exercise.exercise_id}
                  onChange={(e) => handleExerciseChange(index, 'exercise_id', e.target.value)}
                  label="Ejercicio"
                >
                  {availableExercises.map((ex) => (
                    <MenuItem key={ex.id} value={ex.id}>
                      {ex.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Ocultar campos Series y Repeticiones para Running y Bici */}
            {!isRunningOrBiciExercise(exercise.exercise_id) && (
              <Box display="flex" gap={2} sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  label="Repeticiones"
                  type="number"
                  value={exercise.reps}
                  onChange={(e) => handleExerciseChange(index, 'reps', parseInt(e.target.value))}
                  inputProps={{ min: 1, max: 100 }}
                  required
                />

                <TextField
                  fullWidth
                  label="Series"
                  type="number"
                  value={exercise.sets}
                  onChange={(e) => handleExerciseChange(index, 'sets', parseInt(e.target.value))}
                  inputProps={{ min: 1, max: 20 }}
                  required
                />
              </Box>
            )}

            <Box display="flex" gap={2} sx={{ mb: 2 }}>
              <TextField
                label={isRunningOrBiciExercise(exercise.exercise_id) ? "Distancia (km) - opcional" : "Peso (kg) - opcional"}
                type="number"
                value={exercise.weight || ''}
                onChange={(e) => handleExerciseChange(index, 'weight', e.target.value ? parseFloat(e.target.value) : undefined)}
                inputProps={{ 
                  min: 0, 
                  step: isRunningOrBiciExercise(exercise.exercise_id) ? 0.1 : 0.5,
                  max: isRunningOrBiciExercise(exercise.exercise_id) ? 100 : 1000
                }}
                sx={{
                  flex: isRunningOrBiciExercise(exercise.exercise_id) ? 2 : 1 // 2/3 del espacio para Running y Bici
                }}
              />

              <TextField
                label="Pausa entre series (segundos)"
                type="number"
                value={exercise.rest_time_seconds}
                onChange={(e) => handleExerciseChange(index, 'rest_time_seconds', parseInt(e.target.value))}
                inputProps={{ min: 0, max: 3600 }}
                sx={{ flex: 1 }}
              />
            </Box>

            <Box>
              <TextField
                fullWidth
                label="Notas (opcional)"
                value={exercise.notes}
                onChange={(e) => handleExerciseChange(index, 'notes', e.target.value)}
                multiline
                rows={2}
              />
            </Box>
          </CardContent>
        </Card>
      ))}

      <Box display="flex" justifyContent="center" mb={3}>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleAddExercise}
        >
          Agregar ejercicio
        </Button>
      </Box>

      {exercises.some(ex => ex.exercise_id === 0) && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Debes seleccionar un ejercicio para cada elemento de la rutina
        </Alert>
      )}

      <Box display="flex" justifyContent="space-between" sx={{ mt: 3 }}>
        <Button variant="outlined" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={!name.trim() || exercises.length === 0 || exercises.some(ex => ex.exercise_id === 0)}
        >
          {routine ? 'Actualizar rutina' : 'Crear rutina'}
        </Button>
      </Box>
    </Box>
  )
}

export default RoutineForm
