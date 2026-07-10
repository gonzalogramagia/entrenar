import { render } from '../../test/test-utils'
import { waitFor } from '@testing-library/dom'
import { screen } from '@testing-library/dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import WorkoutHistory from './WorkoutHistory'

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
    isAuthenticated: true,
    isGuest: true
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
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza el componente en modo guest con datos mock', async () => {
    render(<WorkoutHistory />)

    // En modo guest, se muestran datos de abril 2026 — verificamos que pasa del loading state
    await waitFor(() => {
      // The workout days should be rendered after loading
      expect(screen.getByText(/Brazos/i)).toBeInTheDocument()
    })
  })

  it('muestra datos de entrenamientos mock en modo guest', async () => {
    render(<WorkoutHistory />)

    await waitFor(() => {
      // Los datos mock incluyen entrenamientos de abril 2026
      expect(screen.getByText(/Brazos/i)).toBeInTheDocument()
    })
  })

  it('muestra el calendario de entrenamientos', async () => {
    render(<WorkoutHistory />)

    await waitFor(() => {
      // El componente tiene un DateCalendar de MUI
      const calendarContainer = document.querySelector('.MuiDateCalendar-root')
      expect(calendarContainer).toBeInTheDocument()
    })
  })
})
