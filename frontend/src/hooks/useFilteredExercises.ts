import { useState, useEffect, useMemo } from 'react'

import type { Exercise } from '../types/workout'

import type { UserSettings } from '../contexts/UserSettingsContext'

export function useFilteredExercises(
  exercises: Exercise[],
  settings: UserSettings,
  userRole?: string,
  isAdmin?: boolean
) {
  const [isLoadingExercises, setIsLoadingExercises] = useState(true)
  // Estado para forzar re-render cuando cambien las configuraciones
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    setIsLoadingExercises(false)
  }, [exercises, settings])

  // Escuchar cambios en localStorage para actualizar ejercicios instantáneamente
  useEffect(() => {
    const handleStorageChange = () => {
      setRefreshTrigger(prev => prev + 1)
    }

    // Escuchar cambios desde otras pestañas
    window.addEventListener('storage', handleStorageChange)

    // Escuchar cambios locales usando CustomEvent
    window.addEventListener('admin-exercise-settings-updated', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('admin-exercise-settings-updated', handleStorageChange)
    }
  }, [])

  // Filtrar ejercicios favoritos según configuraciones
  const filteredExercises = useMemo(() => {
    let filtered = exercises
    // Usar configuraciones de localStorage (admin-exercise-settings es el nuevo estándar para todos)
    try {
      const adminSettings = localStorage.getItem('admin-exercise-settings')
      if (adminSettings) {
        const parsed = JSON.parse(adminSettings)
        // Si el usuario ha configurado sus favoritos (aunque la lista esté vacía), respetamos su elección
        if (parsed.hasConfigured) {
          filtered = filtered.filter(exercise => (parsed.favoriteExercises || []).includes(exercise.id))
        } else if (parsed.favoriteExercises && parsed.favoriteExercises.length > 0) {
          // Fallback para versiones anteriores sin hasConfigured
          filtered = filtered.filter(exercise => parsed.favoriteExercises.includes(exercise.id))
        } else {
          // Si no ha configurado nada explícitamente, excluir deportes por defecto
          filtered = exercises.filter(exercise => !exercise.is_sport)
        }
      } else {
        // Fallback: si no hay settings guardados, intentar usar los del contexto (legacy) o excluir deportes
        if (settings.hasConfiguredFavorites) {
          filtered = filtered.filter(exercise => settings.favoriteExercises.includes(exercise.id))
        } else {
          filtered = exercises.filter(exercise => !exercise.is_sport)
        }
      }
    } catch (error) {
      console.error('Error loading exercise settings:', error)
      filtered = exercises.filter(exercise => !exercise.is_sport)
    }

    return filtered
  }, [exercises, settings.hasConfiguredFavorites, settings.favoriteExercises, userRole, isAdmin, refreshTrigger])

  return { filteredExercises, isLoadingExercises }
}
