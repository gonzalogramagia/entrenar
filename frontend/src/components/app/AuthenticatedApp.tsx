import { Box, Snackbar, Alert, Backdrop, CircularProgress, Typography } from '@mui/material'
import { useState, useEffect, useCallback } from 'react'
import WorkoutForm from '../workout/WorkoutForm'
import WorkoutHistory from '../workout/WorkoutHistory'
import ExerciseList from '../exercises/ExerciseList'

import RoutineList from '../routines/RoutineList'
import AdminPanel from '../admin/AdminPanel'
import Navigation from '../navigation/Navigation'
import SettingsModal from '../settings/SettingsModal'
import NotificationsModal from '../notifications/NotificationsModal'
import { useLanguage } from '../../contexts/LanguageContext'
import { translations } from '../../i18n/translations'
import { TABS, type TabType } from '../../constants/tabs'
import { UserSettingsProvider, useUserSettings } from '../../contexts/UserSettingsContext'
import { AuthProvider, useAuth } from '../../contexts/AuthContext'
import type { Workout, WorkoutDay } from '../../types/workout'
import { useTab } from '../../contexts/TabContext'
import { apiClient } from '../../lib/api'
import FloatingNavButton from '../navigation/FloatingNavButton'
import FloatingNavButtons from '../navigation/FloatingNavButtons'
import ConfettiAnimation from '../animations/ConfettiAnimation'

type Exercise = {
  id: number
  name: string
  bodyweight?: boolean
}

function AuthenticatedAppContent() {
  const { language } = useLanguage()
  const t = translations[language]
  const { activeTab, setActiveTab } = useTab()
  const { userRole, isAdmin, isGuest, isSigningIn, isLoggingOut } = useAuth()
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
  const [showConfetti, setShowConfetti] = useState(false)

  // Función para cargar el contador de notificaciones no leídas
  const loadUnreadNotificationsCount = useCallback(async () => {
    if (isGuest) {
      const isRead = localStorage.getItem('guest_welcome_read') === 'true'
      setUnreadNotifications(isRead ? 0 : 1)
      return
    }
    try {
      const response = await apiClient.getUnreadNotificationsCount() as { unread_count: number }
      setUnreadNotifications(response.unread_count || 0)
    } catch (error) {
      console.error('Error cargando contador de notificaciones:', error)
      setUnreadNotifications(0)
    }
  }, [isGuest])

  // Función para cargar notificaciones automáticamente al ingresar
  const loadNotificationsOnLogin = useCallback(async () => {
    if (isGuest) return
    try {
      // Cargar contador de notificaciones no leídas
      await loadUnreadNotificationsCount()
    } catch (error) {
      console.error('Error cargando notificaciones al ingresar:', error)
    }
  }, [loadUnreadNotificationsCount, isGuest])

  // Función para cargar datos desde el backend
  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      console.log('Cargando datos...')
      
      if (isGuest) {
        // Datos Mock para Modo Invitado
        let mockExercises: Exercise[] = []
        try {
          mockExercises = await apiClient.getExercises() as Exercise[]
        } catch (e) {
          console.warn('Could not fetch exercises for guest, using local mocks')
        }

        const exercisesList = (Array.isArray(mockExercises) && mockExercises.length > 0) 
          ? mockExercises 
          : [
              { id: 1, name: 'Press de Banca' },
              { id: 2, name: 'Sentadilla' },
              { id: 3, name: 'Peso Muerto' },
              { id: 4, name: 'Press Militar' },
              { id: 5, name: 'Curl de Bíceps' },
              { id: 6, name: 'Extensiones de Tríceps' },
              { id: 7, name: 'Remo con Barra' },
              { id: 8, name: 'Prensa' },
              { id: 9, name: 'Martillo' },
              { id: 10, name: 'Dominadas' },
              { id: 11, name: 'Gemelos en Máquina' },
              { id: 100, name: 'Calentamiento' },
              { id: 101, name: 'Estiramiento' }
            ]
        setExercises(exercisesList)
        
        // Sesiones del 20, 22 y 24 de abril
        const april24 = '2026-04-24'
        const april22 = '2026-04-22'
        const april20 = '2026-04-20'
        
        const mockWorkoutDays: WorkoutDay[] = [
          {
            id: 1000,
            user_id: 'guest',
            date: april24,
            name: 'Brazos (Bíceps y Tríceps)',
            created_at: april24,
            updated_at: april24,
            effort: 3,
            mood: 5
          },
          {
            id: 999,
            user_id: 'guest',
            date: april22,
            name: 'Pecho y Espalda',
            created_at: april22,
            updated_at: april22,
            effort: 4,
            mood: 4
          },
          {
            id: 998,
            user_id: 'guest',
            date: april20,
            name: 'Piernas y Glúteos',
            created_at: april20,
            updated_at: april20,
            effort: 5,
            mood: 3
          }
        ]
        
        const mockWorkouts: Workout[] = [
          // Brazos - 24 Abril
          {
            id: 10000,
            user_id: 'guest',
            workout_day_id: 1000,
            exercise_id: 100,
            exercise_name: language === 'es' ? 'Calentamiento' : 'Warm Up',
            reps: 1,
            weight: 0,
            seconds: 300,
            set: 1,
            created_at: april24,
            observations: ''
          },
          {
            id: 10001,
            user_id: 'guest',
            workout_day_id: 1000,
            exercise_id: 5,
            exercise_name: 'Curl de Bíceps',
            reps: 12,
            weight: 15,
            set: 1,
            created_at: april24,
            observations: 'Buen pump'
          },
          {
            id: 10002,
            user_id: 'guest',
            workout_day_id: 1000,
            exercise_id: 5,
            exercise_name: 'Curl de Bíceps',
            reps: 10,
            weight: 15,
            set: 2,
            created_at: april24,
            observations: ''
          },
          {
            id: 10003,
            user_id: 'guest',
            workout_day_id: 1000,
            exercise_id: 6,
            exercise_name: 'Extensiones de Tríceps',
            reps: 15,
            weight: 20,
            set: 1,
            created_at: april24,
            observations: ''
          },
          {
            id: 10010,
            user_id: 'guest',
            workout_day_id: 1000,
            exercise_id: 9,
            exercise_name: 'Martillo',
            reps: 12,
            weight: 12,
            set: 1,
            created_at: april24,
            observations: ''
          },
          {
            id: 10013,
            user_id: 'guest',
            workout_day_id: 1000,
            exercise_id: 101,
            exercise_name: language === 'es' ? 'Estiramiento' : 'Stretching',
            reps: 1,
            weight: 0,
            seconds: 300,
            set: 1,
            created_at: april24,
            observations: ''
          },
          
          // Pecho y Espalda - 22 Abril
          {
            id: 10014,
            user_id: 'guest',
            workout_day_id: 999,
            exercise_id: 100,
            exercise_name: language === 'es' ? 'Calentamiento' : 'Warm Up',
            reps: 1,
            weight: 0,
            seconds: 300,
            set: 1,
            created_at: april22,
            observations: ''
          },
          {
            id: 10004,
            user_id: 'guest',
            workout_day_id: 999,
            exercise_id: 1,
            exercise_name: 'Press de Banca',
            reps: 10,
            weight: 70,
            set: 1,
            created_at: april22,
            observations: 'Récord personal'
          },
          {
            id: 10005,
            user_id: 'guest',
            workout_day_id: 999,
            exercise_id: 7,
            exercise_name: 'Remo con Barra',
            reps: 12,
            weight: 50,
            set: 1,
            created_at: april22,
            observations: ''
          },
          {
            id: 10011,
            user_id: 'guest',
            workout_day_id: 999,
            exercise_id: 10,
            exercise_name: 'Dominadas',
            reps: 10,
            weight: 0,
            set: 1,
            created_at: april22,
            observations: ''
          },
          {
            id: 10015,
            user_id: 'guest',
            workout_day_id: 999,
            exercise_id: 101,
            exercise_name: language === 'es' ? 'Estiramiento' : 'Stretching',
            reps: 1,
            weight: 0,
            seconds: 300,
            set: 1,
            created_at: april22,
            observations: ''
          },
          
          // Piernas - 20 Abril
          {
            id: 10016,
            user_id: 'guest',
            workout_day_id: 998,
            exercise_id: 100,
            exercise_name: language === 'es' ? 'Calentamiento' : 'Warm Up',
            reps: 1,
            weight: 0,
            seconds: 300,
            set: 1,
            created_at: april20,
            observations: ''
          },
          {
            id: 10006,
            user_id: 'guest',
            workout_day_id: 998,
            exercise_id: 2,
            exercise_name: 'Sentadilla',
            reps: 12,
            weight: 90,
            set: 1,
            created_at: april20,
            observations: 'Muy pesado pero bien'
          },
          {
            id: 10007,
            user_id: 'guest',
            workout_day_id: 998,
            exercise_id: 2,
            exercise_name: 'Sentadilla',
            reps: 10,
            weight: 90,
            set: 2,
            created_at: april20,
            observations: ''
          },
          {
            id: 10008,
            user_id: 'guest',
            workout_day_id: 998,
            exercise_id: 8,
            exercise_name: 'Prensa',
            reps: 15,
            weight: 120,
            set: 1,
            created_at: april20,
            observations: ''
          },
          {
            id: 10012,
            user_id: 'guest',
            workout_day_id: 998,
            exercise_id: 11,
            exercise_name: 'Gemelos en Máquina',
            reps: 20,
            weight: 40,
            set: 1,
            created_at: april20,
            observations: ''
          },
          {
            id: 10017,
            user_id: 'guest',
            workout_day_id: 998,
            exercise_id: 101,
            exercise_name: language === 'es' ? 'Estiramiento' : 'Stretching',
            reps: 1,
            weight: 0,
            seconds: 300,
            set: 1,
            created_at: april20,
            observations: ''
          }
        ]
        
        setWorkoutDays(mockWorkoutDays)
        setWorkouts(mockWorkouts)
        setIsLoading(false)
        return
      }

      // Cargar workouts, workout days y ejercicios en paralelo
      const [workoutsData, workoutDaysData, exercisesData] = await Promise.all([
        apiClient.getWorkouts(),
        apiClient.getWorkoutDays(),
        apiClient.getExercises()
      ])


      setWorkouts(Array.isArray(workoutsData) ? workoutsData : [])
      setWorkoutDays(Array.isArray(workoutDaysData) ? workoutDaysData : [])
      setExercises(Array.isArray(exercisesData) ? exercisesData : [])

      // Inicializar todos los ejercicios como favoritos si no hay configuración previa
      // Usar setTimeout para asegurar que las configuraciones se hayan cargado primero
      if (Array.isArray(exercisesData) && exercisesData.length > 0) {
        const exerciseIds = exercisesData.map(ex => ex.id)
        setTimeout(() => {
          initializeAllExercisesAsFavorites(exerciseIds)
        }, 100) // Pequeño delay para que las configuraciones se carguen primero
      }
    } catch (error) {
      console.error('Error cargando datos:', error)

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
  }, [initializeAllExercisesAsFavorites, isGuest])

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

    const handleRoutineCompletedManually = () => {
      console.log('¡Rutina completada manualmente! Activando confeti...')
      setShowConfetti(true)
    }

    window.addEventListener('startRoutine', handleRoutineStart as EventListener)
    window.addEventListener('startRoutineFromModal', handleStartRoutineFromModalEvent as EventListener)
    window.addEventListener('startRoutineWithExercise', handleStartRoutineWithExerciseEvent as EventListener)
    window.addEventListener('viewRoutine', handleViewRoutine as EventListener)
    window.addEventListener('stopRoutine', handleStopRoutine as EventListener)
    window.addEventListener('navigateToWorkout', handleNavigateToWorkout as EventListener)
    window.addEventListener('routineCompletedManually', handleRoutineCompletedManually as EventListener)

    return () => {
      window.removeEventListener('startRoutine', handleRoutineStart as EventListener)
      window.removeEventListener('startRoutineFromModal', handleStartRoutineFromModalEvent as EventListener)
      window.removeEventListener('startRoutineWithExercise', handleStartRoutineWithExerciseEvent as EventListener)
      window.removeEventListener('viewRoutine', handleViewRoutine as EventListener)
      window.removeEventListener('stopRoutine', handleStopRoutine as EventListener)
      window.removeEventListener('navigateToWorkout', handleNavigateToWorkout as EventListener)
      window.removeEventListener('routineCompletedManually', handleRoutineCompletedManually as EventListener)
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
      const selectedDate = data.date || new Date().toISOString().split('T')[0]

      // Buscar si ya existe un workout day para hoy
      let currentWorkoutDay = workoutDays.find(day =>
        day.date === selectedDate
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
        observations: data.observations || '',
        date: selectedDate
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
          setShowConfetti(true) // Activar animación de confeti
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
        p: { xs: 1, sm: 2 },
        pb: 0,
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
            height: '100%',
            overflow: activeRoutine ? 'auto' : 'hidden',
            px: { xs: 2, sm: 1 },
            pb: 0,
            '&::-webkit-scrollbar': {
              display: 'none'
            },
            '&::-moz-scrollbar': {
              display: 'none'
            },
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
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
              userRole={userRole}
              isAdmin={isAdmin}
            />
          </Box>
        )}

        {/* Pestaña Historial */}
        {activeTab === TABS.HISTORY && (
          <Box sx={{ height: '100%' }}>
            <WorkoutHistory />
          </Box>
        )}

        {/* Pestaña Mis Rutinas */}
        {activeTab === TABS.ROUTINES && (
          <Box sx={{ height: '100%' }}>
            <RoutineList activeRoutine={activeRoutine} routineProgress={routineProgress} />
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
                  video_url: 'https://www.youtube.com/watch?v=rT7DgCr-3pg'
                },
                {
                  id: 2,
                  name: 'Sentadilla',
                  muscle_group: 'Piernas',
                  primary_muscles: ['Cuádriceps', 'Glúteos'],
                  secondary_muscles: ['Isquiotibiales', 'Gastrocnemio', 'Core'],
                  video_url: 'https://www.youtube.com/watch?v=aclHkVaku9U'
                },
                {
                  id: 3,
                  name: 'Peso Muerto',
                  muscle_group: 'Espalda',
                  primary_muscles: ['Erector Espinal', 'Glúteos', 'Isquiotibiales'],
                  secondary_muscles: ['Trapecio', 'Romboides', 'Core'],
                  video_url: 'https://www.youtube.com/watch?v=op9kVnSso6Q'
                },
                {
                  id: 4,
                  name: 'Press Militar',
                  muscle_group: 'Hombros',
                  primary_muscles: ['Deltoides Anterior', 'Deltoides Medio'],
                  secondary_muscles: ['Tríceps', 'Trapecio Superior'],
                  video_url: 'https://www.youtube.com/watch?v=2yjwXTZQDDI'
                },
                {
                  id: 5,
                  name: 'Curl de Bíceps',
                  muscle_group: 'Brazos',
                  primary_muscles: ['Bíceps Braquial'],
                  secondary_muscles: ['Braquiorradial', 'Braquial'],
                  video_url: 'https://www.youtube.com/watch?v=ykJmrZ5v0Oa'
                },
              ]}
              onSelectExercise={(exercise) => console.log('Ejercicio seleccionado:', exercise)}
            />
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
            marginTop: '-120px' // Posicionar más arriba como en el login
          }}
        >
          <CircularProgress
            size={48}
            thickness={4}
            sx={{
              color: 'white',
              backgroundColor: 'transparent',
              '& .MuiCircularProgress-circle': {
                strokeLinecap: 'round'
              }
            }}
          />
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
            {isLoggingOut ? (language === 'es' ? 'Cerrando sesión...' : 'Logging out...') : isSigningIn ? t.login.authenticating : (language === 'es' ? 'Cargando...' : 'Loading...')}
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

      {/* Botones flotantes de navegación */}
      <FloatingNavButtons />

      {/* Animación de confeti cuando se completa una rutina */}
      <ConfettiAnimation
        trigger={showConfetti}
        onComplete={() => setShowConfetti(false)}
      />
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
