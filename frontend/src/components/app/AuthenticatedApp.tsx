import { Box, Snackbar, Alert, Backdrop, CircularProgress, Typography } from '@mui/material'
import { useState, useEffect, useCallback } from 'react'
import WorkoutForm from '../workout/WorkoutForm'
import WorkoutHistory from '../workout/WorkoutHistory'
import ExerciseList from '../exercises/ExerciseList'
import EquipmentList from '../equipment/EquipmentList'
import SocialList from '../social/SocialList'
import RoutineList from '../routines/RoutineList'
import AdminPanel from '../admin/AdminPanel'
import Navigation from '../navigation/Navigation'
import SettingsModal from '../settings/SettingsModal'
import NotificationsModal from '../notifications/NotificationsModal'
import { TABS, type TabType } from '../../constants/tabs'
import { UserSettingsProvider, useUserSettings } from '../../contexts/UserSettingsContext'
import { AuthProvider, useAuth } from '../../contexts/AuthContext'
import type { Workout, WorkoutDay } from '../../types/workout'
import { useTab } from '../../contexts/TabContext'
import { apiClient } from '../../lib/api'
import FloatingNavButton from '../navigation/FloatingNavButton'

type Exercise = {
  id: number
  name: string
  bodyweight?: boolean
}

function AuthenticatedAppContent() {
  const { activeTab, setActiveTab } = useTab()
  const { isLoggingOut, isSigningIn } = useAuth()
  const { initializeAllExercisesAsFavorites } = useUserSettings()
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [isSubmittingWorkout, setIsSubmittingWorkout] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [deleteMessage, setDeleteMessage] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false)
  const [adminPanelOpen, setAdminPanelOpen] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  // Función para cargar el contador de notificaciones no leídas
  const loadUnreadNotificationsCount = useCallback(async () => {
    try {
      const response = await apiClient.getUnreadNotificationsCount() as { unread_count: number }
      setUnreadNotifications(response.unread_count || 0)
    } catch (error) {
      console.error('Error cargando contador de notificaciones:', error)
      setUnreadNotifications(0)
    }
  }, [])

  // Función para cargar notificaciones automáticamente al ingresar
  const loadNotificationsOnLogin = useCallback(async () => {
    try {
      // Cargar contador de notificaciones no leídas
      await loadUnreadNotificationsCount()
    } catch (error) {
      console.error('Error cargando notificaciones al ingresar:', error)
    }
  }, [loadUnreadNotificationsCount])

  // Función para cargar datos desde el backend
  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      console.log('Cargando datos del backend...')
      // Cargar workouts, workout days y ejercicios en paralelo
      const [workoutsData, workoutDaysData, exercisesData] = await Promise.all([
        apiClient.getWorkouts(),
        apiClient.getWorkoutDays(),
        apiClient.getExercises()
      ])
      
      console.log('Datos cargados:', {
        workouts: Array.isArray(workoutsData) ? workoutsData.length : 0,
        workoutDays: Array.isArray(workoutDaysData) ? workoutDaysData.length : 0,
        exercises: Array.isArray(exercisesData) ? exercisesData.length : 0
      })
      
      setWorkouts(Array.isArray(workoutsData) ? workoutsData : [])
      setWorkoutDays(Array.isArray(workoutDaysData) ? workoutDaysData : [])
      setExercises(Array.isArray(exercisesData) ? exercisesData : [])
      
      // Inicializar todos los ejercicios como favoritos si no hay configuración previa
      // Usar setTimeout para asegurar que las configuraciones se hayan cargado primero
      if (Array.isArray(exercisesData) && exercisesData.length > 0) {
        const exerciseIds = exercisesData.map(ex => ex.id)
        setTimeout(() => {
          console.log('🔍 AuthenticatedApp: About to initialize exercises as favorites')
          initializeAllExercisesAsFavorites(exerciseIds)
        }, 100) // Pequeño delay para que las configuraciones se carguen primero
      }
    } catch (error) {
      console.error('Error cargando datos del backend:', error)
      
      // Fallback a localStorage si el backend falla
          const savedWorkouts = localStorage.getItem('entrenar-workouts')
    const savedWorkoutDays = localStorage.getItem('entrenar-workout-days')
      
      if (savedWorkouts) {
        setWorkouts(JSON.parse(savedWorkouts))
      }
      
      if (savedWorkoutDays) {
        setWorkoutDays(JSON.parse(savedWorkoutDays))
      }
      
      // Solo usar ejercicios por defecto si no hay ninguno cargado
      setExercises([])
    } finally {
      setIsLoading(false)
    }
  }, [initializeAllExercisesAsFavorites])

  // Cargar datos desde el backend al montar el componente
  useEffect(() => {
    // Solo cargar datos si no están ya cargados
    if (workouts.length === 0 && workoutDays.length === 0 && exercises.length === 0) {
      loadData()
    }
  }, [loadData])

  // Cargar contador de notificaciones no leídas al montar el componente
  useEffect(() => {
    loadUnreadNotificationsCount()
  }, [loadUnreadNotificationsCount])

  // Cargar notificaciones automáticamente al ingresar
  useEffect(() => {
    loadNotificationsOnLogin()
  }, [loadNotificationsOnLogin])

  // Guardar workouts cuando cambien
  useEffect(() => {
    if (workouts.length > 0) {
              localStorage.setItem('entrenar-workouts', JSON.stringify(workouts))
    }
  }, [workouts])

  // Guardar workout days cuando cambien
  useEffect(() => {
    if (workoutDays.length > 0) {
              localStorage.setItem('entrenar-workout-days', JSON.stringify(workoutDays))
    }
  }, [workoutDays])

  const handleTabChange = (newValue: TabType) => {
    setActiveTab(newValue)
  }

  const handleOpenSettings = () => {
    console.log('Abriendo configuración, ejercicios disponibles:', exercises.length)
    setSettingsModalOpen(true)
  }

  const handleCloseSettings = () => {
    setSettingsModalOpen(false)
  }

  const handleOpenNotifications = async () => {
    // Recargar contador antes de abrir el modal
    await loadUnreadNotificationsCount()
    setNotificationsModalOpen(true)
  }

  const handleCloseNotifications = () => {
    setNotificationsModalOpen(false)
  }

  // Estado para la rutina activa
  const [activeRoutine, setActiveRoutine] = useState<any>(null)
  const [routineProgress, setRoutineProgress] = useState(0)
  const [isRoutinePaused, setIsRoutinePaused] = useState(false)
  const [preloadedExercise, setPreloadedExercise] = useState<any>(null)

  // Función para manejar el inicio de una rutina (navega al registro)
  const handleStartRoutine = (routine: any) => {
    // Cambiar a la tab de registrar
    setActiveTab(TABS.WORKOUT)
    // Establecer la rutina activa
    setActiveRoutine(routine)
    setRoutineProgress(0)
    setIsRoutinePaused(false)
    
    // Guardar en localStorage para persistencia
    localStorage.setItem('activeRoutine', JSON.stringify({
      routine: routine,
      progress: 0,
      isPaused: false,
      timestamp: Date.now()
    }))
    
    // Auto-completar con el primer ejercicio de la rutina
    if (routine.exercises && routine.exercises.length > 0) {
      const firstExercise = {
        ...routine.exercises[0],
        currentSet: 1
      }
      setPreloadedExercise(firstExercise)
      console.log('Iniciando rutina con primer ejercicio:', routine.name, firstExercise.exercise_name)
    } else {
      setPreloadedExercise(null)
      console.log('Iniciando rutina sin ejercicios:', routine.name)
    }
  }

  // Función para iniciar rutina sin cambiar de tab (solo para modal)
  const handleStartRoutineFromModal = (routine: any) => {
    // Establecer la rutina activa sin cambiar de tab
    setActiveRoutine(routine)
    setRoutineProgress(0)
    setIsRoutinePaused(false)
    
    // Guardar en localStorage para persistencia
    localStorage.setItem('activeRoutine', JSON.stringify({
      routine: routine,
      progress: 0,
      isPaused: false,
      timestamp: Date.now()
    }))
    
    console.log('Rutina iniciada desde modal:', routine.name)
  }

  // Función para manejar el inicio de una rutina con ejercicio pre-cargado
  const handleStartRoutineWithExercise = (routine: any, exercise: any) => {
    // Cambiar a la tab de registrar
    setActiveTab(TABS.WORKOUT)
    // Establecer la rutina activa
    setActiveRoutine(routine)
    setRoutineProgress(0)
    setIsRoutinePaused(false)
    setPreloadedExercise(exercise)
    
    // Guardar en localStorage para persistencia
    localStorage.setItem('activeRoutine', JSON.stringify({
      routine: routine,
      progress: 0,
      isPaused: false,
      timestamp: Date.now()
    }))
    
    console.log('Iniciando rutina con ejercicio pre-cargado:', routine.name, exercise.exercise_name)
  }



  // Función para detener completamente la rutina
  const handleStopRoutine = () => {
    setActiveRoutine(null)
    setIsRoutinePaused(false)
    setRoutineProgress(0)
    setPreloadedExercise(null)
    
    // Limpiar localStorage
    localStorage.removeItem('activeRoutine')
  }

  // Función para calcular el progreso de la rutina basado en workouts del día
  const calculateRoutineProgress = async () => {
    console.log('🚀 calculateRoutineProgress iniciada')
    
    if (!activeRoutine || !activeRoutine.exercises) {
      console.log('❌ No hay rutina activa o ejercicios')
      return 0
    }

    try {
      const today = new Date().toISOString().split('T')[0]
      console.log('📅 Calculando progreso para fecha:', today)
      console.log('🏋️ Rutina activa:', activeRoutine.name)
      console.log('📋 Ejercicios de la rutina:', activeRoutine.exercises.map((ex: any) => ({ id: ex.exercise_id, name: ex.exercise_name, sets: ex.sets })))
      
      // Obtener workouts del día actual
      console.log('🔍 Obteniendo workouts del día...')
      const todayWorkouts = await apiClient.getWorkouts(today) as any[]
      console.log('✅ Workouts del día:', todayWorkouts.length)
      console.log('📊 Workouts:', todayWorkouts.map((w: any) => ({ exercise_id: w.exercise_id, set: w.set })))
      
      // Crear un mapa de ejercicios completados
      const completedExercises = new Map()
      
      todayWorkouts.forEach((workout: any) => {
        const exerciseId = workout.exercise_id
        if (!completedExercises.has(exerciseId)) {
          completedExercises.set(exerciseId, 0)
        }
        completedExercises.set(exerciseId, completedExercises.get(exerciseId) + 1)
      })
      
      console.log('🎯 Ejercicios completados:', Object.fromEntries(completedExercises))
      
      // Calcular progreso basado en series completadas vs total de series
      let completedSets = 0
      let totalSets = 0
      
      activeRoutine.exercises.forEach((exercise: any) => {
        const exerciseId = exercise.exercise_id
        const completedForExercise = completedExercises.get(exerciseId) || 0
        const targetSets = exercise.sets
        
        console.log(`💪 Ejercicio ${exercise.exercise_name} (ID: ${exerciseId}): ${completedForExercise}/${targetSets} series completadas`)
        
        completedSets += Math.min(completedForExercise, targetSets)
        totalSets += targetSets
      })
      
      console.log(`📈 Total: ${completedSets}/${totalSets} series completadas`)
      
      // Calcular porcentaje
      const progress = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0
      console.log('🎉 Progreso calculado:', progress + '%')
      
      return Math.min(100, Math.max(0, progress))
      
    } catch (error) {
      console.error('❌ Error calculando progreso de rutina:', error)
      return 0
    }
  }

  // Función para obtener el siguiente ejercicio o serie de la rutina
  const getNextExerciseOrSet = (currentExercise: any, currentSet: number) => {
    if (!activeRoutine || !activeRoutine.exercises) return null

    const currentExerciseIndex = activeRoutine.exercises.findIndex(
      (ex: any) => ex.exercise_id === currentExercise.exercise_id
    )

    if (currentExerciseIndex === -1) return null

    const currentExerciseData = activeRoutine.exercises[currentExerciseIndex]
    
    // Si hay más series del mismo ejercicio
    if (currentSet < currentExerciseData.sets) {
      return {
        ...currentExerciseData,
        currentSet: currentSet + 1
      }
    }
    
    // Si no hay más series, buscar el siguiente ejercicio
    if (currentExerciseIndex < activeRoutine.exercises.length - 1) {
      const nextExercise = activeRoutine.exercises[currentExerciseIndex + 1]
      return {
        ...nextExercise,
        currentSet: 1
      }
    }
    
    // Si no hay más ejercicios, la rutina está completa
    return null
  }

  // Cargar rutina activa desde localStorage al iniciar
  useEffect(() => {
    const loadActiveRoutine = async () => {
      const savedRoutine = localStorage.getItem('activeRoutine')
      if (savedRoutine) {
        try {
          const parsed = JSON.parse(savedRoutine)
          const now = Date.now()
          const timeDiff = now - parsed.timestamp
          
          // Solo restaurar si no han pasado más de 24 horas
          if (timeDiff < 24 * 60 * 60 * 1000) {
            setActiveRoutine(parsed.routine)
            setIsRoutinePaused(parsed.isPaused || false)
            
            // Calcular progreso real basado en workouts del día
            const realProgress = await calculateRoutineProgress()
            setRoutineProgress(realProgress)
            
            console.log('Rutina activa restaurada desde localStorage:', parsed.routine.name, 'Progreso real:', realProgress + '%')
          } else {
            // Limpiar si es muy antigua
            localStorage.removeItem('activeRoutine')
            console.log('Rutina activa expirada, limpiando localStorage')
          }
        } catch (error) {
          console.error('Error al restaurar rutina activa:', error)
          localStorage.removeItem('activeRoutine')
        }
      }
    }
    
    loadActiveRoutine()
  }, [])

  // Event listener para el inicio de rutinas
  useEffect(() => {
    const handleRoutineStart = (event: CustomEvent) => {
      handleStartRoutine(event.detail.routine)
    }

    const handleStartRoutineFromModalEvent = (event: CustomEvent) => {
      handleStartRoutineFromModal(event.detail.routine)
    }

    const handleStartRoutineWithExerciseEvent = (event: CustomEvent) => {
      handleStartRoutineWithExercise(event.detail.routine, event.detail.exercise)
    }

    const handleViewRoutine = (_event: CustomEvent) => {
      setActiveTab(TABS.ROUTINES)
      // Aquí podrías abrir el modal de detalles de la rutina
      // Por ahora solo cambia a la tab de rutinas
    }

    const handleStopRoutine = (_event: CustomEvent) => {
      console.log('🛑 Parando rutina desde modal - NO navegando al registro')
      console.log('📍 Tab actual antes de parar:', activeTab)
      setActiveRoutine(null)
      setIsRoutinePaused(false)
      setRoutineProgress(0)
      localStorage.removeItem('activeRoutine')
      
      // Disparar evento para resetear el cronómetro
      const resetTimerEvent = new CustomEvent('resetTimer', {})
      window.dispatchEvent(resetTimerEvent)
      
      console.log('✅ Rutina parada exitosamente')
      console.log('📍 Tab actual después de parar:', activeTab)
    }

    const handleNavigateToWorkout = (_event: CustomEvent) => {
      console.log('🚀 Navegando al registro desde handleNavigateToWorkout')
      setActiveTab(TABS.WORKOUT)
    }

    window.addEventListener('startRoutine', handleRoutineStart as EventListener)
    window.addEventListener('startRoutineFromModal', handleStartRoutineFromModalEvent as EventListener)
    window.addEventListener('startRoutineWithExercise', handleStartRoutineWithExerciseEvent as EventListener)
    window.addEventListener('viewRoutine', handleViewRoutine as EventListener)
    window.addEventListener('stopRoutine', handleStopRoutine as EventListener)
    window.addEventListener('navigateToWorkout', handleNavigateToWorkout as EventListener)
    
    return () => {
      window.removeEventListener('startRoutine', handleRoutineStart as EventListener)
      window.removeEventListener('startRoutineFromModal', handleStartRoutineFromModalEvent as EventListener)
      window.removeEventListener('startRoutineWithExercise', handleStartRoutineWithExerciseEvent as EventListener)
      window.removeEventListener('viewRoutine', handleViewRoutine as EventListener)
      window.removeEventListener('stopRoutine', handleStopRoutine as EventListener)
      window.removeEventListener('navigateToWorkout', handleNavigateToWorkout as EventListener)
    }
  }, [])

  // Función para navegar a la tab de rutinas
  const handleNavigateToRoutines = () => {
    setActiveTab(TABS.ROUTINES)
  }

  // Función para manejar el envío del formulario de workout
  const handleWorkoutSubmit = async (data: any): Promise<void> => {
    setIsSubmittingWorkout(true)
    try {
      const today = new Date().toISOString().split('T')[0]

      // Buscar si ya existe un workout day para hoy
      let currentWorkoutDay = workoutDays.find(day => 
        day.date === today
      )

      // Si no existe, crear uno nuevo en el backend
      if (!currentWorkoutDay) {
        // Por ahora, crear el workout day directamente al crear el workout
        // El backend se encargará de crear el workout day si no existe
      }

      // Crear el nuevo workout en el backend
      const workoutData: any = {
        exercise_id: data.exercise_id,
        reps: data.reps || 0,
        set: data.set || 1,
        seconds: data.seconds || undefined,
        observations: data.observations || ''
      }

      // Solo incluir weight si tiene un valor válido mayor a 0
      if (data.weight !== undefined && data.weight !== null && data.weight > 0) {
        workoutData.weight = data.weight
      }

      await apiClient.createWorkout(workoutData) as Workout
      
      // Si hay una rutina activa, auto-completar con el siguiente ejercicio o serie
      if (activeRoutine && preloadedExercise) {
        const nextExercise = getNextExerciseOrSet(preloadedExercise, data.set)
        
        if (nextExercise) {
          // Auto-completar con el siguiente ejercicio/serie
          setPreloadedExercise(nextExercise)
          
          // Calcular progreso real basado en workouts del día
          const newProgress = await calculateRoutineProgress()
          setRoutineProgress(newProgress)
          
          // Actualizar localStorage
          localStorage.setItem('activeRoutine', JSON.stringify({
            routine: activeRoutine,
            progress: newProgress,
            isPaused: isRoutinePaused,
            timestamp: Date.now()
          }))
          
          console.log('Auto-completando con siguiente ejercicio/serie:', nextExercise.exercise_name, 'Serie:', nextExercise.currentSet, 'Progreso:', newProgress + '%')
        } else {
          // La rutina está completa
          console.log('¡Rutina completada!')
          setActiveRoutine(null)
          setPreloadedExercise(null)
          setRoutineProgress(100)
          
          // Limpiar localStorage
          localStorage.removeItem('activeRoutine')
        }
      } else {
        // Si no hay rutina activa, solo limpiar el formulario
        console.log('Workout guardado sin rutina activa')
      }
    } catch (error) {
      console.error('❌ Error guardando workout:', error)
      throw error // Re-lanzar el error para que el formulario lo capture
    } finally {
      setIsSubmittingWorkout(false)
    }
  }





  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Navigation 
          activeTab={activeTab} 
          onTabChange={handleTabChange}
          onOpenSettings={handleOpenSettings}
          onOpenNotifications={handleOpenNotifications}
          onOpenAdminPanel={() => setAdminPanelOpen(true)}
          unreadNotifications={unreadNotifications}
        />
      
      <Box sx={{ 
        flexGrow: 1, 
        p: 2,
        overflow: 'auto',
        '&::-webkit-scrollbar': {
          display: 'none'
        },
        '&::-moz-scrollbar': {
          display: 'none'
        },
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}>
        {/* Pestaña Entrenamiento */}
        {activeTab === TABS.WORKOUT && (
          <Box sx={{ 
            position: 'relative', 
            zIndex: 1, 
            minHeight: 'calc(100vh - 200px)',
            px: 1.5
          }}>
            <WorkoutForm 
              exercises={exercises} 
              onSubmit={handleWorkoutSubmit}
              isLoading={isSubmittingWorkout}
              activeRoutine={activeRoutine}
              isRoutinePaused={isRoutinePaused}
              onStopRoutine={handleStopRoutine}
              preloadedExercise={preloadedExercise}
              onNavigateToRoutines={handleNavigateToRoutines}
            />
          </Box>
        )}

        {/* Pestaña Ejercicios */}
        {activeTab === TABS.EXERCISES && (
          <Box sx={{ minHeight: 'calc(100vh - 200px)' }}>
            <ExerciseList
              exercises={[
                { 
                  id: 1, 
                  name: 'Press de Banca', 
                  muscle_group: 'Pecho', 
                  primary_muscles: ['Pectoral Mayor', 'Tríceps'],
                  secondary_muscles: ['Deltoides Anterior', 'Serrato Anterior'],
                  equipment: 'Barra',
                  video_url: 'https://www.youtube.com/watch?v=rT7DgCr-3pg'
                },
                { 
                  id: 2, 
                  name: 'Sentadilla', 
                  muscle_group: 'Piernas', 
                  primary_muscles: ['Cuádriceps', 'Glúteos'],
                  secondary_muscles: ['Isquiotibiales', 'Gastrocnemio', 'Core'],
                  equipment: 'Barra',
                  video_url: 'https://www.youtube.com/watch?v=aclHkVaku9U'
                },
                { 
                  id: 3, 
                  name: 'Peso Muerto', 
                  muscle_group: 'Espalda', 
                  primary_muscles: ['Erector Espinal', 'Glúteos', 'Isquiotibiales'],
                  secondary_muscles: ['Trapecio', 'Romboides', 'Core'],
                  equipment: 'Barra',
                  video_url: 'https://www.youtube.com/watch?v=op9kVnSso6Q'
                },
                { 
                  id: 4, 
                  name: 'Press Militar', 
                  muscle_group: 'Hombros', 
                  primary_muscles: ['Deltoides Anterior', 'Deltoides Medio'],
                  secondary_muscles: ['Tríceps', 'Trapecio Superior'],
                  equipment: 'Barra',
                  video_url: 'https://www.youtube.com/watch?v=2yjwXTZQDDI'
                },
                { 
                  id: 5, 
                  name: 'Curl de Bíceps', 
                  muscle_group: 'Brazos', 
                  primary_muscles: ['Bíceps Braquial'],
                  secondary_muscles: ['Braquiorradial', 'Braquial'],
                  equipment: 'Mancuernas',
                  video_url: 'https://www.youtube.com/watch?v=ykJmrZ5v0Oa'
                },
              ]} 
              onSelectExercise={(exercise) => console.log('Ejercicio seleccionado:', exercise)} 
            />
          </Box>
        )}

        {/* Pestaña Equipamiento */}
        {activeTab === TABS.EQUIPMENT && (
          <Box sx={{ minHeight: 'calc(100vh - 200px)' }}>
            <EquipmentList 
              equipment={[
                {
                  id: 1,
                  name: 'Barra Olímpica',
                  category: 'BARRA',
                  observations: 'Barra estándar de 20kg con roscas para discos',
                  image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
                  created_at: '2024-01-01T00:00:00Z'
                },
                {
                  id: 2,
                  name: 'Mancuernas Ajustables',
                  category: 'MANCUERNAS',
                  observations: 'Par de mancuernas ajustables de 5-25kg',
                  image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&q=80',
                  created_at: '2024-01-02T00:00:00Z'
                },
                {
                  id: 3,
                  name: 'Rack de Sentadillas',
                  category: 'RACK',
                  observations: 'Rack de potencia con soporte para sentadillas y press de banca',
                  image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&q=80',
                  created_at: '2024-01-03T00:00:00Z'
                },
                {
                  id: 4,
                  name: 'Banco de Ejercicios',
                  category: 'BANCO',
                  observations: 'Banco ajustable para press de banca y ejercicios variados',
                  image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&q=80',
                  created_at: '2024-01-04T00:00:00Z'
                },
                {
                  id: 5,
                  name: 'Cinta de Correr',
                  category: 'CARDIO',
                  observations: 'Cinta de correr profesional con inclinación ajustable',
                  image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&q=80',
                  created_at: '2024-01-05T00:00:00Z'
                }
              ]}
            />
          </Box>
        )}

        {/* Pestaña Historial */}
        {activeTab === TABS.HISTORY && (
          <Box sx={{ minHeight: 'calc(100vh - 200px)' }}>
            <WorkoutHistory />
          </Box>
        )}

        {/* Pestaña Social */}
        {activeTab === TABS.SOCIAL && (
          <Box sx={{ minHeight: 'calc(100vh - 200px)' }}>
            <SocialList />
          </Box>
        )}

        {/* Pestaña Mis Rutinas */}
        {activeTab === TABS.ROUTINES && (
          <Box sx={{ minHeight: 'calc(100vh - 200px)' }}>
            <RoutineList activeRoutine={activeRoutine} routineProgress={routineProgress} />
          </Box>
        )}

      </Box>

      {/* Notificaciones para eliminación */}
      <Snackbar
        open={!!deleteMessage}
        autoHideDuration={3000}
        onClose={() => setDeleteMessage('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ 
          mt: 6,
          width: { xs: '95%', sm: '90%', md: '70%' },
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 99998
        }}
      >
        <Alert 
          severity="success" 
          sx={{ 
            width: '100%',
            minWidth: '300px',
            fontSize: '0.95rem',
            fontWeight: 500,
            backgroundColor: '#e8f5e8',
            color: '#2e7d32',
            border: '1px solid #4caf50',
            '& .MuiAlert-icon': {
              color: '#2e7d32'
            }
          }}
        >
          ✅ {deleteMessage}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!deleteError}
        autoHideDuration={4000}
        onClose={() => setDeleteError('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ 
          mt: 6,
          width: { xs: '95%', sm: '90%', md: '70%' },
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 99999
        }}
      >
        <Alert 
          severity="error" 
          sx={{ 
            width: '100%',
            minWidth: '300px',
            fontSize: '0.95rem',
            fontWeight: 500,
            backgroundColor: '#ffebee',
            color: '#c62828',
            border: '1px solid #f44336',
            '& .MuiAlert-icon': {
              color: '#c62828'
            }
          }}
        >
          ❌ {deleteError}
        </Alert>
      </Snackbar>

      {/* Loader completo para carga inicial y logout */}
      <Backdrop
        sx={{
          color: 'white',
          zIndex: 99999,
          backgroundColor: 'rgba(25, 118, 210, 0.95)', // Azul de marca con transparencia
          backdropFilter: 'blur(2px)',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease-in-out'
        }}
        open={isLoading || isLoggingOut || isSigningIn}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            marginTop: '-60px' // Posicionar más arriba como en el login
          }}
        >
          <CircularProgress size={48} thickness={4} sx={{ color: 'white' }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
            {isLoggingOut ? 'Cerrando sesión...' : isSigningIn ? 'Iniciando sesión...' : 'Cargando...'}
          </Typography>
        </Box>
      </Backdrop>

      {/* Botón flotante para navegación rápida */}
              <FloatingNavButton 
          currentTab={activeTab} 
          onTabChange={handleTabChange}
          activeRoutine={activeRoutine}
        />

      {/* Modal de configuración */}
      <SettingsModal 
        open={settingsModalOpen} 
        onClose={handleCloseSettings}
        exercises={exercises}
      />



      {/* Modal de notificaciones */}
      <NotificationsModal 
        open={notificationsModalOpen} 
        onClose={handleCloseNotifications}
        onMarkAsRead={async () => {
          // Recargar el contador real desde el backend
          await loadUnreadNotificationsCount()
        }}
      />

      {/* Modal del Panel de Administrador */}
      {adminPanelOpen && (
        <AdminPanel 
          open={adminPanelOpen} 
          onClose={() => setAdminPanelOpen(false)}
        />
      )}
    </Box>
  )
}

export default function AuthenticatedApp() {
  return (
    <UserSettingsProvider>
      <AuthProvider>
        <AuthenticatedAppContent />
      </AuthProvider>
    </UserSettingsProvider>
  )
}
