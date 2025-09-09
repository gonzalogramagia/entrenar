import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import TimerComponent from './TimerComponent.tsx'

describe('TimerComponent', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('muestra tiempo inicial en 00:00', () => {
    render(<TimerComponent />)
    
    expect(screen.getByText('00:00')).toBeInTheDocument()
  })

  it('inicia el timer al hacer click en Start', () => {
    render(<TimerComponent />)
    
    const startButton = screen.getByRole('button', { name: /iniciar/i })
    fireEvent.click(startButton)
    
    // Avanzar 1 segundo
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    
    expect(screen.getByText('00:01')).toBeInTheDocument()
  })

  it('pausa el timer al hacer click en Pause', () => {
    render(<TimerComponent />)
    
    const startButton = screen.getByRole('button', { name: /iniciar/i })
    fireEvent.click(startButton)
    
    // Avanzar 2 segundos
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(screen.getByText('00:02')).toBeInTheDocument()
    
    const pauseButton = screen.getByRole('button', { name: /pausar/i })
    fireEvent.click(pauseButton)
    
    // Avanzar 1 segundo más - no debería cambiar
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(screen.getByText('00:02')).toBeInTheDocument()
  })

  it('resetea el timer al hacer click en Reset', () => {
    render(<TimerComponent />)
    
    const startButton = screen.getByRole('button', { name: /iniciar/i })
    fireEvent.click(startButton)
    
    // Avanzar 3 segundos
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(screen.getByText('00:03')).toBeInTheDocument()
    
    const resetButton = screen.getByRole('button', { name: /resetear/i })
    fireEvent.click(resetButton)
    
    expect(screen.getByText('00:00')).toBeInTheDocument()
  })

  it('muestra tiempo en formato MM:SS correctamente', () => {
    render(<TimerComponent />)
    
    const startButton = screen.getByRole('button', { name: /iniciar/i })
    fireEvent.click(startButton)
    
    // Avanzar 65 segundos (1 minuto y 5 segundos)
    act(() => {
      vi.advanceTimersByTime(65000)
    })
    
    expect(screen.getByText('01:05')).toBeInTheDocument()
  })

  it('cambia el texto del botón Start a Pause cuando está corriendo', () => {
    render(<TimerComponent />)
    
    const startButton = screen.getByRole('button', { name: /iniciar/i })
    expect(startButton).toBeInTheDocument()
    
    fireEvent.click(startButton)
    
    const pauseButton = screen.getByRole('button', { name: /pausar/i })
    expect(pauseButton).toBeInTheDocument()
  })

  it('permite reanudar después de pausar', () => {
    render(<TimerComponent />)
    
    const startButton = screen.getByRole('button', { name: /iniciar/i })
    fireEvent.click(startButton)
    
    // Avanzar 2 segundos
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(screen.getByText('00:02')).toBeInTheDocument()
    
    const pauseButton = screen.getByRole('button', { name: /pausar/i })
    fireEvent.click(pauseButton)
    
    // Reanudar (el botón vuelve a ser "Iniciar")
    const resumeButton = screen.getByRole('button', { name: /iniciar/i })
    fireEvent.click(resumeButton)
    
    // Avanzar 1 segundo más
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(screen.getByText('00:03')).toBeInTheDocument()
  })
})
