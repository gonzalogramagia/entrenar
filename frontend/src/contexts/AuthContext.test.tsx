import { describe, it, expect, vi } from 'vitest'
import { render } from '../test/test-utils'
import { screen, fireEvent } from '@testing-library/dom'
import { AuthProvider, useAuth } from './AuthContext'

// Mock supabase
vi.mock('../lib/supabase', () => ({
  auth: {
    getSession: vi.fn().mockResolvedValue({ session: null, error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    signOut: vi.fn().mockResolvedValue({}),
    signInWithGoogle: vi.fn().mockResolvedValue({ error: null }),
  }
}))

// Mock api client
vi.mock('../lib/api', () => ({
  apiClient: {
    getCurrentUser: vi.fn().mockResolvedValue({ is_admin: false, role: 'user' }),
    updateLastSignIn: vi.fn().mockResolvedValue({}),
    setupUser: vi.fn().mockResolvedValue({}),
  }
}))

function TestComponent() {
  const { isAuthenticated, logout } = useAuth()

  return (
    <div>
      <div data-testid="auth-status">
        {isAuthenticated ? 'Autenticado' : 'No autenticado'}
      </div>
      <button onClick={logout} data-testid="logout">
        Logout
      </button>
    </div>
  )
}

describe('AuthContext', () => {
  it('proporciona estado de autenticación inicial', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('auth-status')).toHaveTextContent('No autenticado')
  })

  it('permite logout', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    const logoutButton = screen.getByTestId('logout')
    fireEvent.click(logoutButton)

    expect(screen.getByTestId('auth-status')).toHaveTextContent('No autenticado')
  })
})
