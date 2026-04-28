import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useUserSettings } from '../../contexts/UserSettingsContext'
import { useAuth } from '../../contexts/AuthContext'

type Exercise = {
  id: number
  name: string
  bodyweight?: boolean
  is_sport?: boolean
}
import { useLanguage } from '../../contexts/LanguageContext'
import { translations } from '../../i18n/translations'
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
  restSeconds: z.coerce.number().min(0).max(3600).optional(), // Mantener en esquema por compatibilidad si es necesario, pero oculto
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
  userRole?: string
  isAdmin?: boolean
}

export default function WorkoutForm({
  exercises,
  onSubmit,
  isLoading = false,
  activeRoutine,
  isRoutinePaused = false,
  onStopRoutine,
  preloadedExercise,
  onNavigateToRoutines,
  userRole,
  isAdmin
}: WorkoutFormProps) {
  const { language } = useLanguage()
  const t = translations[language].workout
  const {
    settings,
    toggleExerciseCompleted,
    getCompletedExercisesForRoutine,
    getRoutineProgress
  } = useUserSettings()

  // Estado para forzar re-render cuando cambien las configuraciones
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Escuchar cambios en localStorage para actualizar ejercicios instantáneamente
  useEffect(() => {
    const handleStorageChange = () => {
      setRefreshTrigger(prev => prev + 1)
    }

    // Escuchar cambios desde otras pestañas
    window.addEventListener('storage', handleStorageChange)

    // Escuchar cambios desde la misma pestaña
    const originalSetItem = localStorage.setItem
    localStorage.setItem = function (key, value) {
      originalSetItem.apply(this, [key, value])
      if (key === 'admin-exercise-settings') {
        // Pequeño delay para asegurar que el localStorage se actualizó
        setTimeout(handleStorageChange, 10)
      }
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      localStorage.setItem = originalSetItem
    }
  }, [])

  // Filtrar ejercicios favoritos según configuraciones
  const filteredExercises = useMemo(() => {
    let filtered = exercises // Incluir todos los ejercicios inicialmente

    // Para usuarios Admin, Staff o Profe, usar configuraciones de localStorage
    if (userRole === 'admin' || userRole === 'staff' || userRole === 'profe' || isAdmin) {
      try {
        const adminSettings = localStorage.getItem('admin-exercise-settings')
        if (adminSettings) {
          const parsed = JSON.parse(adminSettings)
          if (parsed.favoriteExercises && parsed.favoriteExercises.length > 0) {
            // Filtrar solo los ejercicios seleccionados (pueden incluir deportes)
            filtered = filtered.filter(exercise => parsed.favoriteExercises.includes(exercise.id))
          }
        }
      } catch (error) {
        console.error('Error loading admin exercise settings:', error)
        // Fallback: excluir deportes si hay error
        filtered = exercises.filter(exercise => !exercise.is_sport)
      }
    } else {
      // Para usuarios normales, usar configuraciones del contexto
      if (settings.hasConfiguredFavorites && settings.favoriteExercises.length > 0) {
        filtered = filtered.filter(exercise => settings.favoriteExercises.includes(exercise.id))
      } else {
        // Fallback: excluir deportes para usuarios normales
        filtered = exercises.filter(exercise => !exercise.is_sport)
      }
    }

    return filtered
  }, [exercises, settings.hasConfiguredFavorites, settings.favoriteExercises, userRole, isAdmin, refreshTrigger])


  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm({
    resolver: zodResolver(workoutFormSchema),
    defaultValues: {
      exercise_id: undefined,
      weight: '',
      reps: '',
      set: 1,
      seconds: '',
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

  // Estado para la fecha seleccionada
  const now = new Date()
  const [selectedDay, setSelectedDay] = useState<number | string>(now.getDate())
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  // Calcular días del mes actual
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()

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

  // Detectar si es calentamiento o estiramiento
  const isWarmupOrStretching = useMemo(() => {
    if (!selectedExercise) return false;
    const name = selectedExercise.name.toLowerCase();
    return name.includes('calentamiento') ||
           name.includes('warm up') ||
           name.includes('estiramiento') ||
           name.includes('stretching');
  }, [selectedExercise]);

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
        setValue('seconds', preloadedExercise.rest_time_seconds?.toString() || '') // Esto se usa para el tiempo total en deportes
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
    let interval: ReturnType<typeof setInterval> | null = null

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
    
    // Si el valor es exactamente '0', permitirlo si es calentamiento o estiramiento
    if (normalizedValue === '0' && isWarmupOrStretching) {
      setValue(field, '0')
      return
    }

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
          minLimit = isWarmupOrStretching ? 0 : 0.1
        }
        break
      case 'reps':
        maxLimit = 100
        minLimit = isWarmupOrStretching ? 0 : 1
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

  const { isGuest, signInWithGoogle } = useAuth()

  const submit = handleSubmit(async (data: WorkoutFormData) => {
    if (isGuest) {
      signInWithGoogle()
      return
    }
    const originalObservations = data.observations
    try {
      // Para deportes, validar que el tiempo sea requerido
      if (isSportExercise) {
        if (!data.seconds || data.seconds <= 0) {
          setMessageInObservations('❌ El tiempo de entrenamiento es obligatorio para deportes')
          // setValue('observations', '❌ El tiempo de entrenamiento es obligatorio para deportes')
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
        observations: data.observations,
        date: `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${selectedDay.toString().padStart(2, '0')}`
      }

      const exerciseName = selectedExercise ? selectedExercise.name : 'ejercicio'

      // Solo incluir reps si tiene un valor válido (mayor a 0, o 0 para calentamientos)
      if (data.reps !== undefined && data.reps !== null && (data.reps > 0 || isWarmupOrStretching)) {
        workoutData.reps = (data.reps === 0 || !data.reps) && isWarmupOrStretching ? 0 : data.reps
      } else if (isRunningOrBiciExercise) {
        // Para Running y Bici, enviar 1 como valor mínimo
        workoutData.reps = 1
      }

      // Solo incluir weight si tiene un valor válido (mayor a 0, o 0 para calentamientos)
      if (data.weight !== undefined && data.weight !== null && (data.weight > 0 || isWarmupOrStretching)) {
        workoutData.weight = (data.weight === 0 || !data.weight) && isWarmupOrStretching ? 0 : data.weight
      }

      await onSubmit(workoutData)

      // Mostrar mensaje de éxito
      setMessageInObservations(`✅ '${exerciseName}' registrado exitosamente`)
      // setValue('observations', `✅ '${exerciseName}' registrado exitosamente`)

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

      // Persistir ejercicio, peso, reps y tiempo de descanso para facilitar la siguiente serie
      const currentExerciseId = data.exercise_id
      const currentWeight = watch('weight') // Usamos watch para obtener el string original
      const currentReps = watch('reps')
      const currentSet = data.set

      reset({
        exercise_id: currentExerciseId,
        weight: currentWeight || '',
        reps: currentReps || '',
        set: isSportExercise ? 1 : (currentSet < (isRunningOrBiciExercise ? 8 : 5) ? currentSet + 1 : currentSet),
        seconds: '',
        observations: originalObservations || ''
      })

      // Resetear el cronómetro
      // Removed timer-related reset

      // Limpiar el mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setMessageInObservations('')
      }, 3000)
    } catch (error) {
      console.error('Error al guardar el workout:', error)
      const selectedExercise = exercises.find(ex => ex.id === watch('exercise_id'))
      const exerciseName = selectedExercise ? selectedExercise.name : 'ejercicio'
      setMessageInObservations(`❌ Error al registrar '${exerciseName}'. Por favor, intenta de nuevo.`)
      // setValue('observations', `❌ Error al registrar '${exerciseName}'. Por favor, intenta de nuevo.`)
    }
  })

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', position: 'relative', zIndex: 1 }}>

      {/* Box de rutina activa o mensaje de no rutina */}
      {activeRoutine ? (
        <Box sx={{
          mb: 3,
          p: 2,
          backgroundColor: isRoutineComplete ? 'success.main' : (isRoutinePaused ? 'primary.main' : '#FFB732'),
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
              🏋️ {isRoutinePaused ? t.restTime : activeRoutine.name}
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
              {realRoutineProgress}% {t.routineCompleteLabel}
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
                  {isRoutineComplete ? (language === 'es' ? '¡Felicitaciones!' : 'Congratulations!') : (isRoutinePaused ? t.chooseRoutine : t.viewRoutine)}
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
              overflow: 'visible'
            }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 2, color: 'white' }}>
                {t.remainingExercises}
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
                                  toggleExerciseCompleted(today, activeRoutine.id, exercise.exercise_id, setNumber, activeRoutine)
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
                            {exercise.sets === 1 ? (language === 'es' ? 'serie' : 'set') : (language === 'es' ? 'series' : 'sets')}
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
                            {exercise.reps === 1 ? (language === 'es' ? 'rep' : 'rep') : (language === 'es' ? 'reps' : 'reps')}
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
                            {language === 'es' ? 'descanso' : 'rest'}
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
                            borderColor: '#FFB732',
                            backgroundColor: 'rgba(255,183,50,0.1)'
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
                        {t.loadInForm}
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
              🏋️ {t.noActiveRoutine}
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
              {t.goToRoutines}
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
            onOpen={() => {
              // Limpiar el selector al abrir (click o foco) para facilitar una nueva búsqueda
              if (watch('exercise_id')) {
                setValue('exercise_id', undefined)
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t.searchExercise}
                error={Boolean(errors.exercise_id)}
                disabled={isLoading || filteredExercises.length === 0}
                placeholder={filteredExercises.length === 0 ? (translations[language].common.loading) : (language === 'es' ? 'Escribe para buscar ejercicios...' : 'Type to search exercises...')}
                onClick={() => {
                  if (watch('exercise_id')) {
                    setValue('exercise_id', undefined)
                  }
                }}
              />
            )}
            filterOptions={(options, { inputValue }) => {
              const searchTerm = inputValue.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
              return options.filter(option => {
                const optionName = option.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                return optionName.includes(searchTerm)
              })
            }}
            noOptionsText={t.noExercisesFound}
            loading={isLoading}
            loadingText={t.loadingExercises}
            clearOnBlur={false}
            blurOnSelect={true}
          />

          {/* Interfaz para deportes */}
          {isSportExercise ? (
            <TextField
              label={t.sportTime}
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
              onFocus={(e) => e.target.select()}
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
                label={isRunningOrBiciExercise ? t.distance : (isBodyweightExercise ? t.weightOptional : t.weightKg)}
                type="number"
                disabled={isLoading}
                error={Boolean(errors.weight)}
                value={watch('weight') === undefined || watch('weight') === null ? '' : watch('weight')}
                onChange={(e) => handleNumberInput('weight', e.target.value)}
                inputProps={{
                  step: 'any',
                  inputMode: 'decimal',
                  min: isWarmupOrStretching ? 0 : 0.1,
                  max: isRunningOrBiciExercise ? 100 : 1000
                }}
                onFocus={() => setValue('weight', '')}
                onClick={() => setValue('weight', '')}
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
                  label={t.reps}
                  type="number"
                  disabled={isLoading}
                  error={Boolean(errors.reps)}
                  value={watch('reps') || ''}
                  onChange={(e) => handleNumberInput('reps', e.target.value)}
                  inputProps={{
                    inputMode: 'numeric',
                    min: isWarmupOrStretching ? 0 : 1,
                    max: 100
                  }}
                  onFocus={(e) => e.target.select()}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
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
                  {isRunningOrBiciExercise ? t.lap : t.set}
                </InputLabel>
                <Select
                  labelId="serie-select-label"
                  label={isRunningOrBiciExercise ? t.lap : t.set}
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
              label={t.observationsOptional}
              multiline
              rows={activeRoutine ? 1 : 2}
              disabled={isLoading}
              error={Boolean(errors.observations)}
              {...register('observations')}
              onFocus={() => setValue('observations', '')}
              onClick={() => setValue('observations', '')}
              sx={{
                '& .MuiInputLabel-root': {
                  color: 'text.primary'
                }
              }}
            />
          )}
          {/* Selección de Fecha */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label={t.day}
              type="number"
              size="small"
              fullWidth
              value={selectedDay}
              onChange={(e) => {
                const val = parseInt(e.target.value)
                if (e.target.value === '') {
                  setSelectedDay('')
                  return
                }
                if (!isNaN(val) && val >= 1 && val <= daysInMonth) {
                  setSelectedDay(val)
                }
              }}
              inputProps={{ 
                min: 1, 
                max: daysInMonth,
                inputMode: 'numeric'
              }}
              disabled={isLoading}
            />
            <FormControl fullWidth size="small" disabled>
              <InputLabel id="month-select-label">{t.month}</InputLabel>
              <Select
                labelId="month-select-label"
                label={t.month}
                value={currentMonth}
              >
                <MenuItem value={currentMonth}>
                  {(() => {
                    const monthName = new Date(currentYear, currentMonth - 1).toLocaleString(language === 'es' ? 'es-ES' : 'en-US', { month: 'long' });
                    return monthName.charAt(0).toUpperCase() + monthName.slice(1);
                  })()}
                </MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth size="small" disabled>
              <InputLabel id="year-select-label">{t.year}</InputLabel>
              <Select
                labelId="year-select-label"
                label={t.year}
                value={currentYear}
              >
                <MenuItem value={currentYear}>{currentYear}</MenuItem>
              </Select>
            </FormControl>
          </Box>

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
            {isLoading ? t.registering : t.submitWorkout}
          </Button>
        </Stack>
      </form>

      {/* Modal de descanso */}
      <Dialog
        open={showRestModal}
        onClose={(_, reason) => {
          if (reason !== 'backdropClick') setShowRestModal(false)
        }}
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
            {t.restingAfter}
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


