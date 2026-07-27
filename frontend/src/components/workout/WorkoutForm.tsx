import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useUserSettings } from '../../contexts/UserSettingsContext'
import { useAuth } from '../../contexts/AuthContext'


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
  Autocomplete
} from '@mui/material'
import {
  FitnessCenter as FitnessCenterIcon
} from '@mui/icons-material'
import { useState, useEffect, useMemo } from 'react'
import { workoutFormSchema, type WorkoutFormData } from './workoutFormSchema'
import ActiveRoutineBox from './ActiveRoutineBox'
import { useFilteredExercises } from '../../hooks/useFilteredExercises'
import RestModal from './RestModal'
import WorkoutDateSelector from './WorkoutDateSelector'
import type { Routine, RoutineExercise, Exercise } from '../../types/workout'

type WorkoutFormProps = {
  exercises: Exercise[]
  onSubmit: (data: WorkoutFormData) => Promise<void>
  isLoading?: boolean
  activeRoutine?: Routine
  isRoutinePaused?: boolean
  onStopRoutine?: () => void
  preloadedExercise?: RoutineExercise
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
    settings
  } = useUserSettings()

  // Estado para forzar re-render cuando cambien las configuraciones
  const { filteredExercises, isLoadingExercises } = useFilteredExercises(exercises, settings, userRole, isAdmin)

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
  const [initialRestTime, setInitialRestTime] = useState(0)
  const [lastRegisteredExercise, setLastRegisteredExercise] = useState('')

  // Estado para controlar la expansión de la box de rutina
  // (moved to ActiveRoutineBox)

  // Estado para la fecha seleccionada
  const now = useMemo(() => new Date(), [])
  const [selectedDate, setSelectedDate] = useState(() => {
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`
  })

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
        date: selectedDate
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
        setInitialRestTime(data.restSeconds)
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
        <ActiveRoutineBox
          activeRoutine={activeRoutine}
          isRoutinePaused={isRoutinePaused}
          onStopRoutine={onStopRoutine}
          onNavigateToRoutines={onNavigateToRoutines}
          onLoadExercise={(exercise) => {
            setValue('exercise_id', exercise.exercise_id)
            setValue('weight', exercise.weight?.toString() || '')
            setValue('reps', exercise.reps || '')
            setValue('set', 1)
            setValue('seconds', exercise.rest_time_seconds?.toString() || '')
            setValue('observations', exercise.notes || '')
          }}
        />
      ) : (
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

          <Box sx={{ width: '100%', backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 1, height: 8, mb: 1 }}>
            <Box sx={{ width: '0%', backgroundColor: 'grey.500', borderRadius: 1, height: '100%', transition: 'width 0.3s ease' }} />
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
              0% completa
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold', cursor: 'pointer', '&:hover': { opacity: 0.8 } }}>
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
          <WorkoutDateSelector 
            isLoading={isLoading} 
            onChange={(date) => setSelectedDate(date)} 
          />

          {/* Botón de envío */}
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isLoading || isLoadingExercises || !selectedDate}
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
      <RestModal 
        open={showRestModal}
        onClose={() => setShowRestModal(false)}
        initialRestTime={initialRestTime}
        lastRegisteredExercise={lastRegisteredExercise}
      />

    </Box>
  )
}


