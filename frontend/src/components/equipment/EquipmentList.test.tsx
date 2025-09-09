import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EquipmentList from './EquipmentList'

const mockEquipment = [
  {
    id: 1,
    name: 'Barra Olímpica',
    category: 'BARRA',
    observations: 'Barra estándar de 20kg',
    image_url: 'https://example.com/barra.jpg',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    name: 'Mancuernas',
    category: 'MANCUERNAS',
    observations: 'Par de mancuernas de 10kg',
    image_url: null,
    created_at: '2024-01-02T00:00:00Z'
  },
  {
    id: 3,
    name: 'Rack de Sentadillas',
    category: 'RACK',
    observations: null,
    image_url: 'https://example.com/rack.jpg',
    created_at: '2024-01-03T00:00:00Z'
  }
]

describe('EquipmentList', () => {
  it('muestra lista de equipos', () => {
    render(<EquipmentList equipment={mockEquipment} />)
    
    expect(screen.getByText('Equipamiento Disponible')).toBeInTheDocument()
    expect(screen.getByText('Barra Olímpica')).toBeInTheDocument()
    expect(screen.getByText('Mancuernas')).toBeInTheDocument()
    expect(screen.getByText('Rack de Sentadillas')).toBeInTheDocument()
  })

  it('muestra categorías de los equipos', () => {
    render(<EquipmentList equipment={mockEquipment} />)
    
    expect(screen.getByText('BARRA')).toBeInTheDocument()
    expect(screen.getByText('MANCUERNAS')).toBeInTheDocument()
    expect(screen.getByText('RACK')).toBeInTheDocument()
  })

  it('muestra observaciones cuando están disponibles', () => {
    render(<EquipmentList equipment={mockEquipment} />)
    
    expect(screen.getByText('Barra estándar de 20kg')).toBeInTheDocument()
    expect(screen.getByText('Par de mancuernas de 10kg')).toBeInTheDocument()
  })

  it('no muestra observaciones cuando no están disponibles', () => {
    render(<EquipmentList equipment={mockEquipment} />)
    
    // El tercer equipo no tiene observaciones
    expect(screen.queryByText('null')).not.toBeInTheDocument()
  })

  it('muestra fecha de creación para cada equipo', () => {
    render(<EquipmentList equipment={mockEquipment} />)
    
    expect(screen.getByText(/31\/12\/2023/)).toBeInTheDocument()
    expect(screen.getByText(/1\/1\/2024/)).toBeInTheDocument()
    expect(screen.getByText(/2\/1\/2024/)).toBeInTheDocument()
  })

  it('abre dialog al hacer click en un equipo', async () => {
    const user = userEvent.setup()
    render(<EquipmentList equipment={mockEquipment} />)
    
    const equipmentCard = screen.getByText('Barra Olímpica').closest('div')
    await user.click(equipmentCard!)
    
    // Debería mostrar el dialog con información detallada
    expect(screen.getAllByText('Barra Olímpica')).toHaveLength(2) // Uno en la card, otro en el dialog
    expect(screen.getByText('Información del Equipo')).toBeInTheDocument()
    expect(screen.getAllByText('Barra estándar de 20kg')).toHaveLength(2) // Uno en la card, otro en el dialog
  })

  it('muestra imagen en el dialog si está disponible', async () => {
    const user = userEvent.setup()
    render(<EquipmentList equipment={mockEquipment} />)
    
    const equipmentCard = screen.getByText('Barra Olímpica').closest('div')
    await user.click(equipmentCard!)
    
    const image = screen.getByAltText('Barra Olímpica')
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', 'https://example.com/barra.jpg')
  })

  it('no muestra imagen en el dialog si no está disponible', async () => {
    const user = userEvent.setup()
    render(<EquipmentList equipment={mockEquipment} />)
    
    const equipmentCard = screen.getByText('Mancuernas').closest('div')
    await user.click(equipmentCard!)
    
    expect(screen.queryByAltText('Mancuernas')).not.toBeInTheDocument()
  })

  it('cierra el dialog al hacer click en cerrar', async () => {
    const user = userEvent.setup()
    render(<EquipmentList equipment={mockEquipment} />)
    
    // Abrir dialog
    const equipmentCard = screen.getByText('Barra Olímpica').closest('div')
    await user.click(equipmentCard!)
    
    // Verificar que está abierto
    expect(screen.getByText('Información del Equipo')).toBeInTheDocument()
    
    // Cerrar dialog - usar getAllByText y seleccionar el primero
    const closeButtons = screen.getAllByText('Cerrar')
    await user.click(closeButtons[0])
    
    // Verificar que se cerró
    expect(screen.queryByText('Información del Equipo')).not.toBeInTheDocument()
  })

  it('muestra mensaje cuando no hay equipos', () => {
    render(<EquipmentList equipment={[]} />)
    
    expect(screen.getByText('No hay equipos disponibles')).toBeInTheDocument()
  })
})
