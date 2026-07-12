import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import { apiClient } from '../lib/api'
import type { Routine } from '../types/workout'


export interface UserSettings {
  favoriteExercises: number[]
  showOwnWorkoutsInSocial: boolean
  hasConfiguredFavorites: boolean
}

interface CompletedExercises {
  [date: string]: {
    [routineId: number]: {
      [exerciseId: number]: number[] // Array de series completadas
    }
  }
}

interface UserSettingsContextType {
  settings: UserSettings
  setFavoriteExercises: (exercises: number[]) => void
  setHasConfiguredFavorites: (hasConfigured: boolean) => void
  toggleShowOwnWorkoutsInSocial: () => void
  initializeAllExercisesAsFavorites: (exerciseIds: number[]) => void
  onSocialSettingsChange?: () => void
  setOnSocialSettingsChange: (callback: () => void) => void
  // Funciones para ejercicios completados
  completedExercises: CompletedExercises
  toggleExerciseCompleted: (date: string, routineId: number, exerciseId: number, setNumber: number, routine?: Routine) => void
  getCompletedExercisesForRoutine: (date: string, routineId: number) => { [exerciseId: number]: number[] }
  getRoutineProgress: (date: string, routineId: number, routine: Routine) => number
  resetCompletedExercisesForDate: (date: string) => void
}

const UserSettingsContext = createContext<UserSettingsContextType | undefined>(undefined)

const defaultSettings: UserSettings = {
  favoriteExercises: [], // Se llenará automáticamente con todos los ejercicios
  showOwnWorkoutsInSocial: true, // Por defecto mostrar ejercicios propios en social
  hasConfiguredFavorites: false // Por defecto no ha configurado favoritos manualmente
}

export function UserSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings)
  const [onSocialSettingsChange, setOnSocialSettingsChange] = useState<(() => void) | undefined>(undefined)
  const [completedExercises, setCompletedExercises] = useState<CompletedExercises>({})

  // Función para cargar configuraciones desde localStorage
  const loadSettings = useCallback(async () => {
    // Cargar configuraciones solo desde localStorage
    const savedSettings = localStorage.getItem('user-settings')
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings)
        setSettings({ ...defaultSettings, ...parsedSettings })
      } catch (error) {
        console.error('Error parsing user settings:', error)
        setSettings(defaultSettings)
      }
    } else {
      setSettings(defaultSettings)
    }
  }, [])

  // Cargar configuraciones desde la API al montar
  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  // Guardar configuraciones en localStorage (ejercicios favoritos y configuración)
  useEffect(() => {
    const settingsToSave = {
      favoriteExercises: settings.favoriteExercises,
      hasConfiguredFavorites: settings.hasConfiguredFavorites
    }
    localStorage.setItem('user-settings', JSON.stringify(settingsToSave))
  }, [settings.favoriteExercises, settings.hasConfiguredFavorites])

  const setFavoriteExercises = useCallback(async (exerciseIds: number[]) => {
    setSettings(prev => {
      const newSettings = { 
        ...prev, 
        favoriteExercises: exerciseIds
      }
      return newSettings
    })
    
    // Ya no se hacen llamadas a la API, todo se maneja con localStorage
  }, [])

  const setHasConfiguredFavorites = useCallback(async (hasConfigured: boolean) => {
    console.log('🔍 setHasConfiguredFavorites called with:', hasConfigured)
    setSettings(prev => {
      const newSettings = { 
        ...prev, 
        hasConfiguredFavorites: hasConfigured
      }
      return newSettings
    })
    
    // Ya no se hacen llamadas a la API, todo se maneja con localStorage
  }, [])


  const toggleShowOwnWorkoutsInSocial = useCallback(async () => {
    const newValue = !settings.showOwnWorkoutsInSocial
    setSettings(prev => ({ 
      ...prev, 
      showOwnWorkoutsInSocial: newValue
    }))
    
    try {
      await apiClient.updateUserSettings({ show_own_workouts_in_social: newValue })
      // Ejecutar callback para recargar social si existe
      if (onSocialSettingsChange) {
        onSocialSettingsChange()
      }
    } catch (error) {
      console.error('Error updating show own workouts setting:', error)
    }
  }, [settings.showOwnWorkoutsInSocial, onSocialSettingsChange])



  const initializeAllExercisesAsFavorites = useCallback((exerciseIds: number[]) => {
    // Solo inicializar si no hay ejercicios favoritos configurados Y no ha configurado manualmente
    if (settings.favoriteExercises.length === 0 && !settings.hasConfiguredFavorites && exerciseIds.length > 0) {
      setSettings(prev => ({ 
        ...prev, 
        favoriteExercises: exerciseIds
      }))
    } else {
    }
  }, [settings.favoriteExercises.length, settings.hasConfiguredFavorites])

  // Función para alternar el estado de completado de un ejercicio
  const toggleExerciseCompleted = useCallback((date: string, routineId: number, exerciseId: number, setNumber: number, routine?: Routine) => {
    setCompletedExercises(prev => {
      const newState = { ...prev }
      
      // Inicializar estructuras si no existen
      if (!newState[date]) {
        newState[date] = {}
      }
      if (!newState[date][routineId]) {
        newState[date][routineId] = {}
      }
      if (!newState[date][routineId][exerciseId]) {
        newState[date][routineId][exerciseId] = []
      }
      
      const exerciseSets = newState[date][routineId][exerciseId]
      
      // Alternar el estado de la serie
      if (exerciseSets.includes(setNumber)) {
        // Remover la serie si ya está completada
        newState[date][routineId][exerciseId] = exerciseSets.filter(set => set !== setNumber)
      } else {
        // Agregar la serie si no está completada
        newState[date][routineId][exerciseId] = [...exerciseSets, setNumber].sort((a, b) => a - b)
      }
      
      // Guardar en localStorage
      localStorage.setItem('completed-exercises', JSON.stringify(newState))
      
      // Verificar si la rutina está completa después del cambio
      if (routine) {
        const completedForRoutine = newState[date][routineId] || {}
        let completedSets = 0
        let totalSets = 0
        
        routine.exercises.forEach((exercise: any) => {
          const exerciseId = exercise.exercise_id
          const completedSetsForExercise = completedForRoutine[exerciseId]?.length || 0
          const targetSets = exercise.sets
          
          completedSets += Math.min(completedSetsForExercise, targetSets)
          totalSets += targetSets
        })
        
        const progress = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0
        
        // Si la rutina está completa (100%), disparar evento de confeti
        if (progress === 100) {
          console.log('¡Rutina completada manualmente!')
          const confettiEvent = new CustomEvent('routineCompletedManually', { 
            detail: { routineId, routine, progress } 
          })
          window.dispatchEvent(confettiEvent)
        }
      }
      
      return newState
    })
  }, [])

  // Función para obtener ejercicios completados de una rutina en una fecha
  const getCompletedExercisesForRoutine = useCallback((date: string, routineId: number) => {
    return completedExercises[date]?.[routineId] || {}
  }, [completedExercises])

  // Función para calcular el progreso de una rutina
  const getRoutineProgress = useCallback((date: string, routineId: number, routine: Routine) => {
    if (!routine || !routine.exercises) return 0
    
    const completedForRoutine = getCompletedExercisesForRoutine(date, routineId)
    let completedSets = 0
    let totalSets = 0
    
    routine.exercises.forEach((exercise: any) => {
      const exerciseId = exercise.exercise_id
      const completedSetsForExercise = completedForRoutine[exerciseId]?.length || 0
      const targetSets = exercise.sets
      
      completedSets += Math.min(completedSetsForExercise, targetSets)
      totalSets += targetSets
    })
    
    return totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0
  }, [getCompletedExercisesForRoutine])

  // Función para resetear ejercicios completados de una fecha
  const resetCompletedExercisesForDate = useCallback((date: string) => {
    setCompletedExercises(prev => {
      const newState = { ...prev }
      delete newState[date]
      localStorage.setItem('completed-exercises', JSON.stringify(newState))
      return newState
    })
  }, [])

  // Cargar ejercicios completados desde localStorage al montar
  useEffect(() => {
    const savedCompletedExercises = localStorage.getItem('completed-exercises')
    if (savedCompletedExercises) {
      try {
        const parsed = JSON.parse(savedCompletedExercises)
        setCompletedExercises(parsed)
      } catch (error) {
        console.error('Error parsing completed exercises:', error)
      }
    }
  }, [])

  const value: UserSettingsContextType = {
    settings, 
    setFavoriteExercises,
    setHasConfiguredFavorites,
    toggleShowOwnWorkoutsInSocial,
    initializeAllExercisesAsFavorites,
    onSocialSettingsChange,
    setOnSocialSettingsChange,
    completedExercises,
    toggleExerciseCompleted,
    getCompletedExercisesForRoutine,
    getRoutineProgress,
    resetCompletedExercisesForDate
  }

  return (
    <UserSettingsContext.Provider value={value}>
      {children}
    </UserSettingsContext.Provider>
  )
}

export function useUserSettings() {
  const context = useContext(UserSettingsContext)
  if (context === undefined) {
    throw new Error('useUserSettings must be used within a UserSettingsProvider')
  }
  return context
}
