import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EquipmentDetail from './EquipmentDetail'

const mockEquipment = {
  id: 1,
  name: 'Barra Olímpica',
  category: 'BARRA' as const,
  observations: 'Barra estándar de 20kg',
  image_url: 'https://example.com/barra.jpg',
  created_at: '2024-01-01T00:00:00Z'
}

describe('EquipmentDetail', () => {
  it('muestra información del equipo', () => {
    render(<EquipmentDetail equipment={mockEquipment} onClose={vi.fn()} />)
    
    expect(screen.getByText('Barra Olímpica')).toBeInTheDocument()
    expect(screen.getByText('Barra estándar de 20kg')).toBeInTheDocument()
    expect(screen.getByText('BARRA')).toBeInTheDocument()
  })

  it('muestra imagen del equipo si está disponible', () => {
    render(<EquipmentDetail equipment={mockEquipment} onClose={vi.fn()} />)
    
    const image = screen.getByAltText('Barra Olímpica')
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', 'https://example.com/barra.jpg')
  })

  it('no muestra imagen si no está disponible', () => {
    const equipmentWithoutImage = { ...mockEquipment, image_url: null }
    render(<EquipmentDetail equipment={equipmentWithoutImage} onClose={vi.fn()} />)
    
    expect(screen.queryByAltText('Barra Olímpica')).not.toBeInTheDocument()
  })

  it('llama a onClose cuando se hace click en el botón cerrar', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<EquipmentDetail equipment={mockEquipment} onClose={onClose} />)
    
    // Usar getAllByRole para obtener todos los botones y seleccionar el primero
    const closeButtons = screen.getAllByRole('button', { name: /cerrar/i })
    await user.click(closeButtons[0])
    
    expect(onClose).toHaveBeenCalled()
  })

  it('muestra fecha de creación formateada', () => {
    render(<EquipmentDetail equipment={mockEquipment} onClose={vi.fn()} />)
    
    // Debería mostrar la fecha en formato legible (31/12/2023 según el mock)
    expect(screen.getByText(/31\/12\/2023/)).toBeInTheDocument()
  })

  it('muestra mensaje cuando no hay observaciones', () => {
    const equipmentWithoutObservations = { ...mockEquipment, observations: null }
    render(<EquipmentDetail equipment={equipmentWithoutObservations} onClose={vi.fn()} />)
    
    expect(screen.getByText('Sin observaciones')).toBeInTheDocument()
  })
})
