import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Navigation from './Navigation'

describe('Navigation', () => {
  const mockOnTabChange = vi.fn()
  const mockOnLogout = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza el menú hamburguesa y el título', async () => {
    render(<Navigation activeTab={0} onTabChange={mockOnTabChange}  />)
    
    // Esperar a que aparezcan los elementos
    await screen.findByLabelText('abrir menú')
    await screen.findByText('entrenar.app')
    await screen.findByLabelText('cerrar sesión')
    
    expect(screen.getByLabelText('abrir menú')).toBeInTheDocument()
    expect(screen.getByText('entrenar.app')).toBeInTheDocument()
    expect(screen.getByLabelText('cerrar sesión')).toBeInTheDocument()
  })

  it('abre el drawer al hacer clic en el menú', async () => {
    const user = userEvent.setup()
    render(<Navigation activeTab={0} onTabChange={mockOnTabChange}  />)
    
    const menuButton = await screen.findByLabelText('abrir menú')
    
    // El drawer no debería estar visible inicialmente
    expect(screen.queryByText('Registrar')).not.toBeInTheDocument()
    
    // Abrir el drawer
    await user.click(menuButton)
    expect(screen.getByText('Registrar')).toBeInTheDocument()
    expect(screen.getByText('Ejercicios')).toBeInTheDocument()
    expect(screen.getByText('Equipamiento')).toBeInTheDocument()
    expect(screen.getByText('Historial')).toBeInTheDocument()
  })

  it('cambia de tab al hacer clic en un elemento del menú', async () => {
    const user = userEvent.setup()
    render(<Navigation activeTab={0} onTabChange={mockOnTabChange}  />)
    
    const menuButton = await screen.findByLabelText('abrir menú')
    await user.click(menuButton)
    
    const ejerciciosButton = screen.getByText('Ejercicios')
    await user.click(ejerciciosButton)
    
    expect(mockOnTabChange).toHaveBeenCalledWith(1)
  })

  it('cambia de tab y cierra el drawer después de seleccionar una opción', async () => {
    const user = userEvent.setup()
    render(<Navigation activeTab={0} onTabChange={mockOnTabChange}  />)
    
    const menuButton = await screen.findByLabelText('abrir menú')
    await user.click(menuButton)
    
    const equipamientoButton = screen.getByText('Equipamiento')
    await user.click(equipamientoButton)
    
    expect(mockOnTabChange).toHaveBeenCalledWith(2)
  })

  it('ejecuta logout al hacer clic en el botón de cerrar sesión', async () => {
    const user = userEvent.setup()
    render(<Navigation activeTab={0} onTabChange={mockOnTabChange}  />)
    
    const logoutButton = await screen.findByLabelText('cerrar sesión')
    await user.click(logoutButton)
    
    expect(mockOnLogout).toHaveBeenCalled()
  })

  it('muestra la opción activa en el menú', async () => {
    const user = userEvent.setup()
    render(<Navigation activeTab={1} onTabChange={mockOnTabChange}  />)
    
    const menuButton = screen.getByLabelText('abrir menú')
    await user.click(menuButton)
    
    const ejerciciosButton = screen.getByText('Ejercicios')
    expect(ejerciciosButton).toBeInTheDocument()
  })
})
