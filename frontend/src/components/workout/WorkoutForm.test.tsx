import { describe, it, expect, vi } from 'vitest'
import { render } from '../../test/test-utils'
import { screen } from '@testing-library/dom'
import WorkoutForm from './WorkoutForm'

// Mock del contexto de autenticación
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
    isAuthenticated: true,
    isGuest: false,
    signInWithGoogle: vi.fn()
  })
}))

// Mock del contexto de configuración de usuario
vi.mock('../../contexts/UserSettingsContext', () => ({
  useUserSettings: () => ({
    settings: {
      favoriteExercises: [],
      hasConfiguredFavorites: false,
      socialEnabled: true
    },
    toggleExerciseCompleted: vi.fn(),
    getCompletedExercisesForRoutine: vi.fn().mockReturnValue({}),
    getRoutineProgress: vi.fn().mockReturnValue(0)
  })
}))

const exercises = [
  { id: 1, name: 'Press de Banca', muscle_group: 'Pecho', is_sport: false, bodyweight: false },
  { id: 2, name: 'Sentadilla', muscle_group: 'Piernas', is_sport: false, bodyweight: false },
]

describe('WorkoutForm', () => {
  it('renderiza el formulario con el selector de ejercicios', () => {
    render(<WorkoutForm exercises={exercises} onSubmit={vi.fn()} />)

    // The Autocomplete for exercise search should be present
    expect(screen.getByLabelText(/buscar y seleccionar ejercicio/i)).toBeInTheDocument()
  })

  it('renderiza el botón de envío', () => {
    render(<WorkoutForm exercises={exercises} onSubmit={vi.fn()} />)

    expect(screen.getByRole('button', { name: /registrar entrenamiento/i })).toBeInTheDocument()
  })

  it('muestra mensaje de no rutina activa cuando no hay rutina', () => {
    render(<WorkoutForm exercises={exercises} onSubmit={vi.fn()} />)

    expect(screen.getByText(/ninguna rutina activa/i)).toBeInTheDocument()
  })

  it('deshabilita el botón cuando isLoading es true', () => {
    render(<WorkoutForm exercises={exercises} onSubmit={vi.fn()} isLoading />)

    const submitButton = screen.getByRole('button', { name: /registrando/i })
    expect(submitButton).toBeDisabled()
  })
})
