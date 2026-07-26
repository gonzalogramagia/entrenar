import { useState, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://entrenar.up.railway.app/api'

interface ApiResponse<T = any> {
  data: T | null
  loading: boolean
  error: string | null
  execute: () => Promise<void>
}

function useApiCall<T = any>(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET'): ApiResponse<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { session } = useAuth()

  const execute = useCallback(async () => {
    if (!session?.access_token) {
      setError('No authentication token available')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [endpoint, method, session?.access_token])

  return { data, loading, error, execute }
}

// Hooks específicos para cada endpoint
export function useHealthCheck() {
  return useApiCall('/api/health')
}

export function useWorkouts() {
  return useApiCall('/api/workouts')
}

export function useCurrentUser() {
  return useApiCall('/api/users/me')
}

export default useApiCall
