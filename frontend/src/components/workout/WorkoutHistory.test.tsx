import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import WorkoutHistory from './WorkoutHistory'
import { apiClient } from '../../lib/api'

// Mock del API client
vi.mock('../../lib/api', () => ({
  apiClient: {
    getWorkoutDays: vi.fn(),
    getWorkouts: vi.fn(),
    deleteWorkout: vi.fn()
  }
}))

// Mock del contexto de autenticación
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
    isAuthenticated: true
  })
}))

// Mock del contexto de configuración de usuario
vi.mock('../../contexts/UserSettingsContext', () => ({
  useUserSettings: () => ({
    settings: {
      socialEnabled: true
    }
  })
}))

describe('WorkoutHistory', () => {
  const mockWorkoutDays = [
    {
      id: 1,
      user_id: 'test-user-id',
      date: '2025-08-12',
      name: 'Entrenamiento del día',
      effort: 7,
      mood: 8,
      created_at: '2025-08-12T10:00:00Z',
      updated_at: '2025-08-12T10:00:00Z'
    }
  ]

const mockWorkouts = [
  {
    id: 1,
      user_id: 'test-user-id',
      workout_day_id: 1,
      exercise_id: 1,
      exercise_name: 'Press de banca',
    weight: 80,
    reps: 8,
    serie: 1,
      seconds: null,
      observations: '',
      created_at: '2025-08-12T10:00:00Z'
  },
  {
    id: 2,
      user_id: 'test-user-id',
      workout_day_id: 1,
      exercise_id: 2,
      exercise_name: 'Sentadillas',
    weight: 100,
      reps: 10,
      serie: 1,
    seconds: null,
      observations: '',
      created_at: '2025-08-12T10:00:00Z'
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    ;(apiClient.getWorkoutDays as any).mockResolvedValue(mockWorkoutDays)
    ;(apiClient.getWorkouts as any).mockResolvedValue(mockWorkouts)
    ;(apiClient.deleteWorkout as any).mockResolvedValue({})
  })

  it('renderiza el componente correctamente', async () => {
    render(<WorkoutHistory />)
    
    await waitFor(() => {
      expect(screen.getByText('Entrenamientos')).toBeInTheDocument()
    })
  })

  it('carga y muestra los datos de entrenamientos', async () => {
    render(<WorkoutHistory />)
    
    await waitFor(() => {
      expect(apiClient.getWorkoutDays).toHaveBeenCalled()
      expect(apiClient.getWorkouts).toHaveBeenCalled()
    })
  })

  it('muestra mensaje cuando no hay entrenamientos', async () => {
    ;(apiClient.getWorkoutDays as any).mockResolvedValue([])
    ;(apiClient.getWorkouts as any).mockResolvedValue([])
    
    render(<WorkoutHistory />)
    
    await waitFor(() => {
      expect(screen.getByText('No hay entrenamientos registrados')).toBeInTheDocument()
    })
  })

  it('maneja errores de carga correctamente', async () => {
    ;(apiClient.getWorkoutDays as any).mockRejectedValue(new Error('Error de red'))
    
    render(<WorkoutHistory />)
    
    await waitFor(() => {
      expect(screen.getByText('Error cargando entrenamientos')).toBeInTheDocument()
    })
  })

  it('permite filtrar por fecha', async () => {
    render(<WorkoutHistory />)
    
    await waitFor(() => {
      expect(screen.getByText('Entrenamientos')).toBeInTheDocument()
    })
    
    const dateInput = screen.getByDisplayValue('')
    expect(dateInput).toBeInTheDocument()
  })

  it('muestra los detalles del entrenamiento al expandir', async () => {
    render(<WorkoutHistory />)
    
    await waitFor(() => {
      expect(screen.getByText('Lunes 12 de Agosto')).toBeInTheDocument()
    })
    
    const expandButton = screen.getByRole('button', { name: /expand/i })
    fireEvent.click(expandButton)
    
    await waitFor(() => {
      expect(screen.getByText('Press de banca')).toBeInTheDocument()
      expect(screen.getByText('Sentadillas')).toBeInTheDocument()
    })
  })

  it('permite eliminar un workout', async () => {
    render(<WorkoutHistory />)
    
    await waitFor(() => {
      expect(screen.getByText('Lunes 12 de Agosto')).toBeInTheDocument()
    })
    
    const expandButton = screen.getByRole('button', { name: /expand/i })
    fireEvent.click(expandButton)
    
    await waitFor(() => {
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
      fireEvent.click(deleteButtons[0])
    })
    
    await waitFor(() => {
      expect(screen.getByText('Confirmar eliminación')).toBeInTheDocument()
    })
  })

  it('muestra el esfuerzo y estado de ánimo', async () => {
    render(<WorkoutHistory />)
    
    await waitFor(() => {
      expect(screen.getByText('Esfuerzo: 7/10')).toBeInTheDocument()
      expect(screen.getByText('Estado de ánimo: 8/10')).toBeInTheDocument()
    })
  })

  it('muestra el número correcto de ejercicios', async () => {
    render(<WorkoutHistory />)
    
    await waitFor(() => {
      expect(screen.getByText('2 ejercicios')).toBeInTheDocument()
    })
  })
})
