import { useState, useEffect, useCallback } from 'react'
import { TABS, type TabType } from '../constants/tabs'
import { apiClient } from '../lib/api'

export function useActiveRoutine(setActiveTab: (tab: TabType) => void, setShowConfetti: (show: boolean) => void) {
  const [activeRoutine, setActiveRoutine] = useState<any>(null)
  const [routineProgress, setRoutineProgress] = useState(0)
  const [isRoutinePaused, setIsRoutinePaused] = useState(false)
  const [preloadedExercise, setPreloadedExercise] = useState<any>(null)

  // Función para obtener el siguiente ejercicio o serie de la rutina
  const getNextExerciseOrSet = useCallback((currentExercise: any, currentSet: number) => {
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
  }, [activeRoutine])

  // Función para calcular el progreso de la rutina basado en workouts del día
  const calculateRoutineProgress = useCallback(async () => {
    console.log('🚀 calculateRoutineProgress iniciada')

    if (!activeRoutine || !activeRoutine.exercises) {
      console.log('❌ No hay rutina activa o ejercicios')
      return 0
    }

    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Obtener workouts del día actual
      const todayWorkouts = await apiClient.getWorkouts(today) as any[]

      // Crear un mapa de ejercicios completados
      const completedExercises = new Map()

      todayWorkouts.forEach((workout: any) => {
        const exerciseId = workout.exercise_id
        if (!completedExercises.has(exerciseId)) {
          completedExercises.set(exerciseId, 0)
        }
        completedExercises.set(exerciseId, completedExercises.get(exerciseId) + 1)
      })

      // Calcular progreso basado en series completadas vs total de series
      let completedSets = 0
      let totalSets = 0

      activeRoutine.exercises.forEach((exercise: any) => {
        const exerciseId = exercise.exercise_id
        const completedForExercise = completedExercises.get(exerciseId) || 0
        const targetSets = exercise.sets

        completedSets += Math.min(completedForExercise, targetSets)
        totalSets += targetSets
      })

      // Calcular porcentaje
      const progress = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0
      return Math.min(100, Math.max(0, progress))
    } catch (error) {
      console.error('❌ Error calculando progreso de rutina:', error)
      return 0
    }
  }, [activeRoutine])

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

            // Calcular progreso real se maneja en el efecto dependiente
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

  // Recalcular progreso una vez que se restaura activeRoutine
  useEffect(() => {
    if (activeRoutine) {
      calculateRoutineProgress().then(progress => setRoutineProgress(progress))
    }
  }, [activeRoutine, calculateRoutineProgress])

  // Event listener para el inicio y manejo de rutinas
  useEffect(() => {
    const handleStartRoutine = (routine: any) => {
      setActiveTab(TABS.WORKOUT)
      setActiveRoutine(routine)
      setRoutineProgress(0)
      setIsRoutinePaused(false)

      localStorage.setItem('activeRoutine', JSON.stringify({
        routine,
        progress: 0,
        isPaused: false,
        timestamp: Date.now()
      }))

      if (routine.exercises && routine.exercises.length > 0) {
        const firstExercise = { ...routine.exercises[0], currentSet: 1 }
        setPreloadedExercise(firstExercise)
      } else {
        setPreloadedExercise(null)
      }
    }

    const handleStartRoutineEvent = (event: CustomEvent) => handleStartRoutine(event.detail.routine)

    const handleStartRoutineFromModalEvent = (event: CustomEvent) => {
      const routine = event.detail.routine
      setActiveRoutine(routine)
      setRoutineProgress(0)
      setIsRoutinePaused(false)

      localStorage.setItem('activeRoutine', JSON.stringify({
        routine,
        progress: 0,
        isPaused: false,
        timestamp: Date.now()
      }))
    }

    const handleStartRoutineWithExerciseEvent = (event: CustomEvent) => {
      const { routine, exercise } = event.detail
      setActiveTab(TABS.WORKOUT)
      setActiveRoutine(routine)
      setRoutineProgress(0)
      setIsRoutinePaused(false)
      setPreloadedExercise(exercise)

      localStorage.setItem('activeRoutine', JSON.stringify({
        routine,
        progress: 0,
        isPaused: false,
        timestamp: Date.now()
      }))
    }

    const handleViewRoutine = (_event: CustomEvent) => setActiveTab(TABS.ROUTINES)

    const handleStopRoutine = (_event: CustomEvent) => {
      setActiveRoutine(null)
      setIsRoutinePaused(false)
      setRoutineProgress(0)
      setPreloadedExercise(null)
      localStorage.removeItem('activeRoutine')

      const resetTimerEvent = new CustomEvent('resetTimer', {})
      window.dispatchEvent(resetTimerEvent)
    }

    const handleNavigateToWorkout = (_event: CustomEvent) => setActiveTab(TABS.WORKOUT)

    const handleRoutineCompletedManually = () => setShowConfetti(true)

    window.addEventListener('startRoutine', handleStartRoutineEvent as EventListener)
    window.addEventListener('startRoutineFromModal', handleStartRoutineFromModalEvent as EventListener)
    window.addEventListener('startRoutineWithExercise', handleStartRoutineWithExerciseEvent as EventListener)
    window.addEventListener('viewRoutine', handleViewRoutine as EventListener)
    window.addEventListener('stopRoutine', handleStopRoutine as EventListener)
    window.addEventListener('navigateToWorkout', handleNavigateToWorkout as EventListener)
    window.addEventListener('routineCompletedManually', handleRoutineCompletedManually as EventListener)

    return () => {
      window.removeEventListener('startRoutine', handleStartRoutineEvent as EventListener)
      window.removeEventListener('startRoutineFromModal', handleStartRoutineFromModalEvent as EventListener)
      window.removeEventListener('startRoutineWithExercise', handleStartRoutineWithExerciseEvent as EventListener)
      window.removeEventListener('viewRoutine', handleViewRoutine as EventListener)
      window.removeEventListener('stopRoutine', handleStopRoutine as EventListener)
      window.removeEventListener('navigateToWorkout', handleNavigateToWorkout as EventListener)
      window.removeEventListener('routineCompletedManually', handleRoutineCompletedManually as EventListener)
    }
  }, [setActiveTab, setShowConfetti])

  const handleStopRoutineExplicit = () => {
    setActiveRoutine(null)
    setIsRoutinePaused(false)
    setRoutineProgress(0)
    setPreloadedExercise(null)
    localStorage.removeItem('activeRoutine')
  }

  const completeRoutine = () => {
    setShowConfetti(true)
    setActiveRoutine(null)
    setPreloadedExercise(null)
    setRoutineProgress(100)
    localStorage.removeItem('activeRoutine')
  }

  const handleExerciseCompleted = async (nextExercise: any, newProgress: number) => {
    setPreloadedExercise(nextExercise)
    setRoutineProgress(newProgress)

    localStorage.setItem('activeRoutine', JSON.stringify({
      routine: activeRoutine,
      progress: newProgress,
      isPaused: isRoutinePaused,
      timestamp: Date.now()
    }))
  }

  return {
    activeRoutine,
    routineProgress,
    isRoutinePaused,
    preloadedExercise,
    handleStopRoutine: handleStopRoutineExplicit,
    calculateRoutineProgress,
    getNextExerciseOrSet,
    completeRoutine,
    handleExerciseCompleted
  }
}
