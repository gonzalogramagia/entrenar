import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthContext'

// Componente de prueba para usar el contexto
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
    
    // Test logout functionality
    const logoutButton = screen.getByTestId('logout')
    fireEvent.click(logoutButton)
    
    expect(screen.getByTestId('auth-status')).toHaveTextContent('No autenticado')
  })
})
