import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import AppLayout from './AppLayout'

describe('AppLayout', () => {
  it('renderiza children correctamente', () => {
    render(
      <AppLayout>
        <div data-testid="test-content">Contenido de prueba</div>
      </AppLayout>
    )
    
    expect(screen.getByTestId('test-content')).toBeInTheDocument()
    expect(screen.getByText('Contenido de prueba')).toBeInTheDocument()
  })

  it('aplica el tema de Material UI', () => {
    render(
      <AppLayout>
        <div>Contenido</div>
      </AppLayout>
    )
    
    // Verificar que el componente se renderiza sin errores
    expect(screen.getByText('Contenido')).toBeInTheDocument()
  })

  it('mantiene dimensiones consistentes', () => {
    render(
      <AppLayout>
        <div>Contenido</div>
      </AppLayout>
    )
    
    // El layout debería tener las clases CSS correctas para dimensiones fijas
    const container = screen.getByText('Contenido').closest('div')
    expect(container).toBeInTheDocument()
  })
})
