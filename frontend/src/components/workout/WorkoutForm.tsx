import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useUserSettings } from '../../contexts/UserSettingsContext'

type Exercise = {
  id: number
  name: string
  bodyweight?: boolean
  is_sport?: boolean
}
import { 
  Box, 
  Button, 
  FormControl, 
  InputLabel, 
  MenuItem, 
  Select, 
  Stack, 
  TextField, 
  Typography,
  IconButton,
  Dialog,
  DialogContent,
  Autocomplete
} from '@mui/material'
import { 
  FitnessCenter as FitnessCenterIcon,
  KeyboardArrowDown,
  KeyboardArrowUp,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  Close as CloseIcon
} from '@mui/icons-material'
import { useState, useEffect, useMemo } from 'react'

// Esquema de validación con Zod
const workoutFormSchema = z.object({
  exercise_id: z.coerce.number().refine(val => val > 0, 'Debe seleccionar un ejercicio'),
  weight: z.string().transform((val) => {
    if (val === '' || val === '0') return undefined
    const num = parseFloat(val)
    return isNaN(num) ? undefined : num
  }).refine((val) => val === undefined || (val > 0 && val <= 1000), ' ').optional(), // Máximo 1000 kg, opcional
  reps: z.coerce.number().int().refine(val => val === 0 || (val > 0 && val <= 100), ' ').optional(), // Máximo 100 reps, opcional
  set: z.coerce.number().int().min(1, ' '),
  seconds: z.coerce.number().min(0).max(28800).optional(), // Máximo 8 horas (28800 segundos) para deportes
  restSeconds: z.coerce.number().min(0).max(3600).optional(), // Máximo 1 hora de descanso
  observations: z.string().default('')
})

type WorkoutFormData = z.infer<typeof workoutFormSchema>

type WorkoutFormProps = {
  exercises: Exercise[]
  onSubmit: (data: WorkoutFormData) => Promise<void>
  isLoading?: boolean
  activeRoutine?: any
  isRoutinePaused?: boolean
  onStopRoutine?: () => void
  preloadedExercise?: any
  onNavigateToRoutines?: () => void
}

export default function WorkoutForm({ 
  exercises, 
  onSubmit, 
  isLoading = false,
  activeRoutine,
  isRoutinePaused = false,
  onStopRoutine,
  preloadedExercise,
  onNavigateToRoutines
}: WorkoutFormProps) {
  const { 
    settings, 
    toggleExerciseCompleted, 
    getCompletedExercisesForRoutine, 
    getRoutineProgress 
  } = useUserSettings()
  
  // Filtrar ejercicios favoritos si están configurados manualmente y excluir deportes
  const filteredExercises = useMemo(() => {
    // Primero excluir deportes
    let filtered = exercises.filter(exercise => !exercise.is_sport)
    
    // Luego aplicar filtro de favoritos si está configurado
    if (settings.hasConfiguredFavorites && settings.favoriteExercises.length > 0) {
      filtered = filtered.filter(exercise => settings.favoriteExercises.includes(exercise.id))
    }
    
    
    return filtered
  }, [exercises, settings.hasConfiguredFavorites, settings.favoriteExercises])
  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm({
    resolver: zodResolver(workoutFormSchema),
    defaultValues: {
      exercise_id: undefined,
      weight: '',
      reps: '',
      set: 1,
      seconds: '',
      restSeconds: '',
      observations: ''
    }
  })
  
  const [messageInObservations, setMessageInObservations] = useState('')
  
  // Estado para el modal de descanso
  const [showRestModal, setShowRestModal] = useState(false)
  const [restTime, setRestTime] = useState(0)
  const [isRestRunning, setIsRestRunning] = useState(false)
  const [lastRegisteredExercise, setLastRegisteredExercise] = useState('')
  
  // Estado para controlar la expansión de la box de rutina
  const [showRoutineExercises, setShowRoutineExercises] = useState(false)
  
  // Estado para detectar si los ejercicios están cargando
  const isLoadingExercises = filteredExercises.length === 0
  
  // Obtener fecha actual y ejercicios completados
  const today = new Date().toISOString().split('T')[0]
  const completedExercises = activeRoutine 
    ? getCompletedExercisesForRoutine(today, activeRoutine.id)
    : {}
  
  // Calcular progreso real de la rutina
  const realRoutineProgress = activeRoutine 
    ? getRoutineProgress(today, activeRoutine.id, activeRoutine)
    : 0
  
  // Detectar si la rutina está completa
  const isRoutineComplete = realRoutineProgress === 100

  // Detectar si el ejercicio seleccionado es Running (ID: 18) o Bici
  const selectedExerciseId = watch('exercise_id')
  const selectedExercise = exercises.find(ex => ex.id === selectedExerciseId)
  
  const isRunningExercise = selectedExerciseId === 18
  const isBiciExercise = selectedExercise?.name?.toLowerCase().includes('bici') || selectedExercise?.id === 30 || false
  const isRunningOrBiciExercise = isRunningExercise || isBiciExercise
  
  const isBodyweightExercise = selectedExercise?.bodyweight || false
  
  // Detectar si el ejercicio seleccionado es un deporte
  const isSportExercise = selectedExercise?.is_sport || false
  
  // Establecer reps = 1 automáticamente cuando se selecciona Running, Bici o un deporte
  useEffect(() => {
    if (isRunningOrBiciExercise || isSportExercise) {
      setValue('reps', 1)
      setValue('set', 1) // Bloquear serie en 1 para deportes
    }
  }, [isRunningOrBiciExercise, isSportExercise, setValue])

  // Limpiar peso cuando se selecciona ejercicio de peso corporal
  useEffect(() => {
    if (isBodyweightExercise) {
      setValue('weight', '') // Dejar vacío para ejercicios de peso corporal
    }
  }, [isBodyweightExercise, setValue])

  // Pre-cargar ejercicio cuando se recibe desde la rutina
  useEffect(() => {
    if (preloadedExercise) {
      console.log('Pre-cargando ejercicio:', preloadedExercise)
      console.log('exercise_id a establecer:', preloadedExercise.exercise_id)
      setValue('exercise_id', preloadedExercise.exercise_id)
      
      // Para deportes, establecer valores específicos
      if (preloadedExercise.is_sport) {
        setValue('weight', '')
        setValue('reps', '1')
        setValue('set', '1')
        setValue('seconds', '')
        setValue('observations', preloadedExercise.notes || '')
      } else {
        // Para ejercicios normales
        setValue('weight', preloadedExercise.weight?.toString() || '')
        setValue('reps', preloadedExercise.reps || '')
        // Si hay currentSet (auto-completado), usar ese valor, sino usar 1
        setValue('set', preloadedExercise.currentSet || 1)
        setValue('seconds', preloadedExercise.rest_time_seconds?.toString() || '')
        setValue('observations', preloadedExercise.notes || '')
      }
      
      // Debug adicional después de establecer valores
      setTimeout(() => {
        console.log('Valor actual de exercise_id después de setValue:', watch('exercise_id'))
      }, 100)
    }
  }, [preloadedExercise, setValue, watch])

  // Timer para el modal de descanso
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (showRestModal && isRestRunning) {
      interval = setInterval(() => {
        setRestTime(prev => {
          if (prev <= 1) {
            // Detener el timer y cerrar el modal cuando llegue a 0
            setIsRestRunning(false)
            setShowRestModal(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    
    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [showRestModal, isRestRunning])

  // Función para validar y limitar valores en tiempo real
  const handleNumberInput = (field: 'weight' | 'reps' | 'seconds', value: string) => {
    // Si el valor está vacío, permitir que se borre
    if (value === '') {
      setValue(field, '')
      return
    }

    // Normalizar el valor: convertir coma a punto para parseFloat
    const normalizedValue = value.replace(',', '.')
    const numValue = parseFloat(normalizedValue)
    
    if (isNaN(numValue)) {
      setValue(field, '')
      return
    }

    let maxLimit: number
    let minLimit: number

    switch (field) {
      case 'weight':
        // Para Running y Bici, cambiar límites a distancia (km)
        if (isRunningOrBiciExercise) {
          maxLimit = 100 // 100 km máximo
          minLimit = 0.1 // 100 metros mínimo
        } else {
          maxLimit = 1000
          minLimit = 0.1
        }
        // Permitir valores vacíos para peso opcional
        if (value === '') {
          setValue(field, '')
          return
        }
        break
      case 'reps':
        maxLimit = 100
        minLimit = 1
        break
      case 'seconds':
        maxLimit = 3600
        minLimit = 0
        break
      default:
        return
    }

    if (numValue > maxLimit) {
      setValue(field, maxLimit.toString())
    } else if (numValue < minLimit && value !== '') {
      setValue(field, minLimit.toString())
    } else {
      // Mantener el formato original (coma o punto) que usó el usuario
      setValue(field, value)
    }
  }

  const submit = handleSubmit(async (data: WorkoutFormData) => {
    try {
      // Para deportes, validar que el tiempo sea requerido
      if (isSportExercise) {
        if (!data.seconds || data.seconds <= 0) {
          setMessageInObservations('❌ El tiempo de entrenamiento es obligatorio para deportes')
          setValue('observations', '❌ El tiempo de entrenamiento es obligatorio para deportes')
          return
        }
        // El valor ya está en segundos desde el onChange del campo
      } else {
        // Para ejercicios normales, usar la lógica del cronómetro
        // Removed timer-related logic as TimerComponent is removed
      }
      
      // Crear objeto de datos sin el campo weight si está vacío
      const workoutData: any = {
        exercise_id: data.exercise_id,
        set: data.set,
        seconds: data.seconds,
        observations: data.observations
      }
      
      // Solo incluir reps si tiene un valor válido mayor a 0
      if (data.reps !== undefined && data.reps !== null && data.reps > 0) {
        workoutData.reps = data.reps
      } else if (isRunningOrBiciExercise) {
        // Para Running y Bici, enviar 1 como valor mínimo
        workoutData.reps = 1
      }
      
      // Solo incluir weight si tiene un valor válido mayor a 0
      if (data.weight !== undefined && data.weight !== null && data.weight > 0) {
        workoutData.weight = data.weight
      }
      
      // Obtener el nombre del ejercicio seleccionado
      const selectedExercise = exercises.find(ex => ex.id === data.exercise_id)
      const exerciseName = selectedExercise ? selectedExercise.name : 'ejercicio'
      
      await onSubmit(workoutData)
      
      // Mostrar mensaje de éxito
      setMessageInObservations(`✅ '${exerciseName}' registrado exitosamente`)
      setValue('observations', `✅ '${exerciseName}' registrado exitosamente`)
      
      // Disparar evento para actualizar el feed social
      console.log('🔄 Disparando evento de actualización del feed social')
      window.dispatchEvent(new CustomEvent('socialFeedRefresh'))
      
      // Solo abrir el modal de descanso si hay un tiempo de descanso configurado
      if (data.restSeconds && data.restSeconds > 0) {
        setLastRegisteredExercise(exerciseName)
        setRestTime(data.restSeconds)
        setIsRestRunning(true)
        setShowRestModal(true)
      }
      
      reset({
        exercise_id: '',
        weight: '',
        reps: '',
        set: 1,
        seconds: '',
        restSeconds: '',
        observations: ''
      })
      
      // Resetear el cronómetro
      // Removed timer-related reset
      
      // Limpiar el mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setMessageInObservations('')
        setValue('observations', '')
      }, 3000)
    } catch (error) {
      console.error('Error al guardar el workout:', error)
      const selectedExercise = exercises.find(ex => ex.id === watch('exercise_id'))
      const exerciseName = selectedExercise ? selectedExercise.name : 'ejercicio'
      setMessageInObservations(`❌ Error al registrar '${exerciseName}'. Por favor, intenta de nuevo.`)
      setValue('observations', `❌ Error al registrar '${exerciseName}'. Por favor, intenta de nuevo.`)
    }
  })

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', position: 'relative', zIndex: 1 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, textAlign: 'center', color: 'primary.main', fontWeight: 'bold' }}>
        Registrar
      </Typography>
      
      {/* Box de rutina activa o mensaje de no rutina */}
      {activeRoutine ? (
        <Box sx={{ 
          mb: 3, 
          p: 2, 
          backgroundColor: isRoutineComplete ? 'success.main' : (isRoutinePaused ? 'primary.main' : 'warning.main'), 
          borderRadius: 2,
          color: 'white',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          position: 'relative'
        }}>

          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600, 
                textAlign: 'left',
                cursor: 'pointer',
                '&:hover': {
                  opacity: 0.8
                }
              }}
              onClick={onNavigateToRoutines}
            >
              🏋️ {isRoutinePaused ? 'A la espera' : activeRoutine.name}
            </Typography>
            
            <IconButton
              size="small"
              onClick={onStopRoutine}
              sx={{ 
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              {isRoutineComplete ? <CloseIcon /> : <StopIcon />}
            </IconButton>
          </Box>
          
          <Box sx={{ 
            width: '100%', 
            backgroundColor: 'rgba(255,255,255,0.2)', 
            borderRadius: 1,
            height: 8,
            mb: 1
          }}>
            <Box sx={{ 
              width: `${realRoutineProgress}%`, 
              backgroundColor: 'white', 
              borderRadius: 1,
              height: '100%',
              transition: 'width 0.3s ease'
            }} />
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center'
          }}>
            <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
              {realRoutineProgress}% completa
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {!showRoutineExercises && (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    '&:hover': {
                      opacity: 0.8
                    }
                  }}
                  onClick={() => {
                    // Expandir/contraer la lista de ejercicios
                    setShowRoutineExercises(!showRoutineExercises)
                  }}
                >
                  {isRoutineComplete ? '¡Felicitaciones!' : (isRoutinePaused ? 'Elegir rutina' : 'Ver rutina')}
                </Typography>
              )}
              
              <IconButton
                size="small"
                onClick={() => setShowRoutineExercises(!showRoutineExercises)}
                sx={{ 
                  color: 'white',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.2)'
                  }
                }}
              >
                {showRoutineExercises ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
              </IconButton>
            </Box>
          </Box>
          
          {/* Lista expandible de ejercicios de la rutina */}
          {showRoutineExercises && activeRoutine?.exercises && (
            <Box sx={{ 
              mt: 2, 
              p: 2, 
              backgroundColor: 'rgba(255,255,255,0.1)', 
              borderRadius: 2,
              maxHeight: '300px',
              overflow: 'auto'
            }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 2, color: 'white' }}>
                Ejercicios restantes:
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {activeRoutine.exercises.map((exercise: any, index: number) => {
                  const completedSets = completedExercises[exercise.exercise_id] || []
                  
                  return (
                    <Box
                      key={`${exercise.exercise_id}-${index}`}
                      sx={{
                        p: 1.5,
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        borderRadius: 1,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'white', flex: 1, textAlign: 'left', pl: 2 }}>
                          {exercise.exercise_name}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {Array.from({ length: exercise.sets }, (_, setIndex) => {
                            const setNumber = setIndex + 1
                            const isCompleted = completedSets.includes(setNumber)
                            
                            return (
                              <Box
                                key={setNumber}
                                sx={{
                                  width: 24,
                                  height: 24,
                                  borderRadius: '50%',
                                  border: '2px solid',
                                  borderColor: isCompleted ? 'warning.main' : 'rgba(255,255,255,0.5)',
                                  backgroundColor: isCompleted ? 'warning.main' : 'transparent',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.2s ease',
                                  '&:hover': {
                                    borderColor: isCompleted ? 'warning.dark' : 'warning.main',
                                    backgroundColor: isCompleted ? 'warning.dark' : 'rgba(255,152,0,0.2)'
                                  }
                                }}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleExerciseCompleted(today, activeRoutine.id, exercise.exercise_id, setNumber)
                                }}
                              >
                                {isCompleted && (
                                  <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.7rem' }}>
                                    ✓
                                  </Typography>
                                )}
                              </Box>
                            )
                          })}
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'flex', gap: 1, mb: 1, justifyContent: 'center' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600, lineHeight: 1 }}>
                            {exercise.sets}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.65rem', lineHeight: 1 }}>
                            {exercise.sets === 1 ? 'serie' : 'series'}
                          </Typography>
                        </Box>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                          •
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600, lineHeight: 1 }}>
                            {exercise.reps}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.65rem', lineHeight: 1 }}>
                            {exercise.reps === 1 ? 'rep' : 'reps'}
                          </Typography>
                        </Box>
                        {exercise.weight && (
                          <>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                              •
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600, lineHeight: 1 }}>
                                {exercise.weight}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.65rem', lineHeight: 1 }}>
                                kg
                              </Typography>
                            </Box>
                          </>
                        )}
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                          •
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600, lineHeight: 1 }}>
                            {Math.floor(exercise.rest_time_seconds / 60)}:{(exercise.rest_time_seconds % 60).toString().padStart(2, '0')}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.65rem', lineHeight: 1 }}>
                            descanso
                          </Typography>
                        </Box>
                      </Box>
                      
                                              <Button
                          variant="outlined"
                          size="small"
                          sx={{
                            color: 'white',
                            borderColor: 'rgba(255,255,255,0.5)',
                            '&:hover': {
                              borderColor: 'warning.main',
                              backgroundColor: 'rgba(255,152,0,0.1)'
                            }
                          }}
                          onClick={() => {
                            // Pre-cargar el ejercicio en el formulario
                            setValue('exercise_id', exercise.exercise_id)
                            setValue('weight', exercise.weight?.toString() || '')
                            setValue('reps', exercise.reps || '')
                            setValue('set', 1)
                            setValue('seconds', exercise.rest_time_seconds?.toString() || '')
                            setValue('observations', exercise.notes || '')
                            
                            // Cerrar la lista expandible
                            setShowRoutineExercises(false)
                          }}
                        >
                          Cargar en el registro
                        </Button>
                    </Box>
                  )
                })}
              </Box>
            </Box>
          )}
        </Box>
      ) : (
        // Box cuando no hay rutina activa
        <Box sx={{ 
          mb: 3, 
          p: 2, 
          backgroundColor: 'grey.100', 
          borderRadius: 2,
          color: 'text.secondary',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          position: 'relative',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: 'grey.200',
            transform: 'translateY(-1px)'
          }
        }}
        onClick={onNavigateToRoutines}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, textAlign: 'left' }}>
              🏋️ Ninguna rutina activa
            </Typography>
          </Box>
          
          <Box sx={{ 
            width: '100%', 
            backgroundColor: 'rgba(0,0,0,0.1)', 
            borderRadius: 1,
            height: 8,
            mb: 1
          }}>
            <Box sx={{ 
              width: '0%', 
              backgroundColor: 'grey.500', 
              borderRadius: 1,
              height: '100%',
              transition: 'width 0.3s ease'
            }} />
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center'
          }}>
            <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
              0% completa
            </Typography>
            
            <Typography variant="body2" sx={{ 
              fontWeight: 'bold',
              cursor: 'pointer',
              '&:hover': {
                opacity: 0.8
              }
            }}>
              Ir a Mis Rutinas
            </Typography>
          </Box>
        </Box>
      )}
      
      <form role="form" onSubmit={submit}>
        <Stack spacing={3}>
        <Autocomplete
          options={filteredExercises}
          getOptionLabel={(option) => {
            let label = option.name

            // Agregar emojis a la derecha
            if (option.name.toLowerCase().includes('running')) label += ' 🏃‍♂️'
            if (option.name.toLowerCase().includes('bici')) label += ' 🚴'
            if (option.name.toLowerCase().includes('fútbol')) label += ' ⚽'
            if (option.name.toLowerCase().includes('básquet')) label += ' 🏀'
            if (option.name.toLowerCase().includes('pádel')) label += ' 🎾'
            if (option.name.toLowerCase().includes('voley')) label += ' 🏐'
            if (option.name.toLowerCase().includes('handball')) label += ' ⚾'
            if (option.name.toLowerCase().includes('hockey')) label += ' 🏑'
            if (option.name.toLowerCase().includes('natación')) label += ' 🏊‍♂️'
            return label
          }}
          value={filteredExercises.find(ex => ex.id === watch('exercise_id')) || null}
          onChange={(_, newValue) => {
            setValue('exercise_id', newValue ? newValue.id : undefined)
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Buscar y seleccionar ejercicio"
              error={Boolean(errors.exercise_id)}
              disabled={isLoading || filteredExercises.length === 0}
              placeholder={filteredExercises.length === 0 ? 'Cargando ejercicios...' : 'Escribe para buscar ejercicios...'}
            />
          )}
          filterOptions={(options, { inputValue }) => {
            const searchTerm = inputValue.toLowerCase()
            return options.filter(option => 
              option.name.toLowerCase().includes(searchTerm)
            )
          }}
          noOptionsText="No se encontraron ejercicios"
          loading={isLoading}
          loadingText="Cargando ejercicios..."
          clearOnBlur={false}
          blurOnSelect={true}
        />

        {/* Interfaz para deportes */}
        {isSportExercise ? (
          <TextField
            label="Tiempo en cancha (minutos)"
            type="number"
            disabled={isLoading}
            error={Boolean(errors.seconds)}
            value={watch('seconds') ? Math.floor((watch('seconds') as number) / 60) : ''}
            onChange={(e) => {
              const minutes = parseInt(e.target.value) || 0
              setValue('seconds', minutes * 60) // Convertir minutos a segundos
            }}
            inputProps={{ 
              inputMode: 'numeric',
              min: 1,
              max: 480 // 8 horas máximo (480 minutos)
            }}
            required
            sx={{
              '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                display: 'none'
              },
              '& input[type=number]': {
                MozAppearance: 'textfield'
              }
            }}
          />
        ) : (
          /* Interfaz normal para ejercicios no deportivos */
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            flexDirection: { xs: 'row' }
          }}>
            <TextField
              label={isRunningOrBiciExercise ? "Distancia (km)" : (isBodyweightExercise ? "Peso (opcional)" : "Peso (kg)")}
              type="number"
              disabled={isLoading}
              error={Boolean(errors.weight)}
              value={watch('weight') === undefined || watch('weight') === null ? '' : watch('weight')}
              onChange={(e) => handleNumberInput('weight', e.target.value)}
              inputProps={{ 
                step: 'any',
                inputMode: 'decimal',
                min: isRunningOrBiciExercise ? 0.1 : 0.1,
                max: isRunningOrBiciExercise ? 100 : 1000
              }}
              sx={{
                flex: isRunningOrBiciExercise ? 2 : 1, // 2/3 del espacio para Running y Bici
                '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                  display: 'none'
                },
                '& input[type=number]': {
                  MozAppearance: 'textfield'
                }
              }}
            />

            {/* Ocultar campo Reps para Running y Bici */}
            {!isRunningOrBiciExercise && (
              <TextField
                label="Reps"
                type="number"
                disabled={isLoading}
                error={Boolean(errors.reps)}
                value={watch('reps') || ''}
                onChange={(e) => handleNumberInput('reps', e.target.value)}
                inputProps={{ 
                  inputMode: 'numeric',
                  min: 1,
                  max: 100
                }}
                sx={{
                  flex: 1,
                  '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                    display: 'none'
                  },
                  '& input[type=number]': {
                    MozAppearance: 'textfield'
                  }
                }}
              />
            )}

            <FormControl 
              fullWidth 
              error={Boolean(errors.set)}
              disabled={isLoading || isSportExercise} // Bloquear solo para deportes
              sx={{ flex: 1 }}
            >
              <InputLabel id="serie-select-label">
                {isRunningOrBiciExercise ? 'Vuelta' : 'Serie'}
              </InputLabel>
              <Select
                labelId="serie-select-label"
                label={isRunningOrBiciExercise ? 'Vuelta' : 'Serie'}
                value={watch('set')}
                {...register('set', { valueAsNumber: true })}
              >
                {(isRunningOrBiciExercise ? [1, 2, 3, 4, 5, 6, 7, 8] : [1, 2, 3, 4, 5]).map((serie) => (
                  <MenuItem key={serie} value={serie}>
                    {serie}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}

        {/* Campo de descanso en segundos - Oculto para deportes */}
        {!isSportExercise && (
          <TextField
            label="Pausa luego de la serie (segs)"
            type="number"
            disabled={isLoading}
            error={Boolean(errors.restSeconds)}
            {...register('restSeconds')}
            inputProps={{ 
              inputMode: 'numeric',
              min: 0,
              max: 3600 // 1 hora máximo
            }}
            sx={{ 
              '& .MuiInputLabel-root': { 
                color: 'text.primary' 
              } 
            }}
          />
        )}

        {/* Mensaje de éxito/error o campo de observaciones */}
        {messageInObservations ? (
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              backgroundColor: messageInObservations.includes('✅') ? '#e8f5e8' : '#ffebee',
              color: messageInObservations.includes('✅') ? '#2e7d32' : '#c62828',
              border: '1px solid',
              borderColor: messageInObservations.includes('✅') ? '#4caf50' : '#f44336',
              fontSize: '0.95rem',
              fontWeight: 500,
              textAlign: 'center'
            }}
          >
            {messageInObservations}
          </Box>
        ) : (
          <TextField
            label="Observaciones (opcional)"
            multiline
            rows={3}
            disabled={isLoading}
            error={Boolean(errors.observations)}
            {...register('observations')}
            sx={{
              '& .MuiInputLabel-root': {
                color: 'text.primary'
              }
            }}
          />
        )}

        {/* Botón de envío */}
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={isLoading || isLoadingExercises}
          startIcon={<FitnessCenterIcon />}
          sx={{
            py: 1.5,
            fontWeight: 600,
            fontSize: '1.1rem',
            textTransform: 'none',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
            '&:hover': {
              boxShadow: '0 6px 16px rgba(25, 118, 210, 0.4)'
            }
          }}
        >
          {isLoading ? 'Guardando...' : 'Guardar Entrenamiento'}
        </Button>
      </Stack>
      </form>

      {/* Modal de descanso */}
      <Dialog 
        open={showRestModal} 
        onClose={() => setShowRestModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            backgroundColor: 'primary.main',
            color: 'white'
          }
        }}
      >
        <DialogContent sx={{ textAlign: 'center', py: 3 }}>
          <Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}>
            Descansando luego de hacer
          </Typography>
          
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
            {lastRegisteredExercise}
          </Typography>
          
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: 3
          }}>
            <Typography variant="h2" sx={{ fontWeight: 800, fontFamily: 'monospace' }}>
              {Math.floor(restTime / 60)}:{(restTime % 60).toString().padStart(2, '0')}
            </Typography>
            
            <IconButton
              onClick={() => setShowRestModal(false)}
              sx={{ 
                color: 'white',
                backgroundColor: 'rgba(255,255,255,0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.2)'
                }
              }}
            >
              <PlayArrowIcon />
            </IconButton>
          </Box>
        </DialogContent>
      </Dialog>

    </Box>
  )
}


