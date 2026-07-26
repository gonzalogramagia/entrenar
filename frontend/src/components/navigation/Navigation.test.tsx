import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '../../test/test-utils'
import { screen } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import Navigation from './Navigation'
import { TABS } from '../../constants/tabs'

// Mock UserAvatar since it has its own complex dependencies
vi.mock('../user/UserAvatar', () => ({
  default: () => <div data-testid="user-avatar">Avatar</div>
}))

describe('Navigation', () => {
  const mockOnTabChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza el menú hamburguesa y el título', async () => {
    render(<Navigation activeTab={TABS.WORKOUT} onTabChange={mockOnTabChange} />)

    const menuButton = await screen.findByLabelText('abrir menú')
    expect(menuButton).toBeInTheDocument()

    const title = await screen.findByText('Entrenate.net')
    expect(title).toBeInTheDocument()
  })

  it('abre el drawer al hacer clic en el menú', async () => {
    const user = userEvent.setup()
    render(<Navigation activeTab={TABS.WORKOUT} onTabChange={mockOnTabChange} />)

    const menuButton = await screen.findByLabelText('abrir menú')
    await user.click(menuButton)

    expect(await screen.findByText('Registrar')).toBeInTheDocument()
    expect(await screen.findByText('Entrenamientos')).toBeInTheDocument()
    expect(await screen.findByText('Mis Rutinas')).toBeInTheDocument()
  })

  it('cambia de tab al hacer clic en un elemento del menú', async () => {
    const user = userEvent.setup()
    render(<Navigation activeTab={TABS.WORKOUT} onTabChange={mockOnTabChange} />)

    const menuButton = await screen.findByLabelText('abrir menú')
    await user.click(menuButton)

    const entrenamientosButton = await screen.findByText('Entrenamientos')
    await user.click(entrenamientosButton)

    expect(mockOnTabChange).toHaveBeenCalledWith(TABS.HISTORY)
  })

  it('muestra la opción activa en el menú', async () => {
    const user = userEvent.setup()
    render(<Navigation activeTab={TABS.HISTORY} onTabChange={mockOnTabChange} />)

    const menuButton = await screen.findByLabelText('abrir menú')
    await user.click(menuButton)

    const entrenamientosButton = await screen.findByText('Entrenamientos')
    expect(entrenamientosButton).toBeInTheDocument()
  })
})
