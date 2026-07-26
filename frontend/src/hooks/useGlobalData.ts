import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useUserSettings } from '../contexts/UserSettingsContext'
import { useLanguage } from '../contexts/LanguageContext'
import { apiClient } from '../lib/api'
import type { Workout, WorkoutDay } from '../types/workout'

type Exercise = {
  id: number
  name: string
  bodyweight?: boolean
}

export function useGlobalData() {
  const { isGuest } = useAuth()
  const { initializeAllExercisesAsFavorites } = useUserSettings()
  const { language } = useLanguage()
  
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [isLoading, setIsLoading] = useState(false)

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
      let savedWorkouts = localStorage.getItem('entrenate-workouts')
      if (!savedWorkouts) {
        savedWorkouts = localStorage.getItem('entrenar-workouts')
        if (savedWorkouts) localStorage.setItem('entrenate-workouts', savedWorkouts)
      }

      let savedWorkoutDays = localStorage.getItem('entrenate-workout-days')
      if (!savedWorkoutDays) {
        savedWorkoutDays = localStorage.getItem('entrenar-workout-days')
        if (savedWorkoutDays) localStorage.setItem('entrenate-workout-days', savedWorkoutDays)
      }

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
  }, [initializeAllExercisesAsFavorites, isGuest, language])

  // Cargar datos desde el backend al montar el componente
  useEffect(() => {
    // Solo cargar datos si no están ya cargados
    if (workouts.length === 0 && workoutDays.length === 0 && exercises.length === 0) {
      loadData()
    }
  }, [loadData, workouts.length, workoutDays.length, exercises.length])

  // Guardar workouts cuando cambien
  useEffect(() => {
    if (workouts.length > 0) {
      localStorage.setItem('entrenate-workouts', JSON.stringify(workouts))
    }
  }, [workouts])

  // Guardar workout days cuando cambien
  useEffect(() => {
    if (workoutDays.length > 0) {
      localStorage.setItem('entrenate-workout-days', JSON.stringify(workoutDays))
    }
  }, [workoutDays])

  return {
    workouts,
    workoutDays,
    exercises,
    isLoading,
    loadData
  }
}
