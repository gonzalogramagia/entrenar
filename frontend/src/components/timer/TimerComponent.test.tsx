import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act } from '../../test/test-utils'
import { screen, fireEvent } from '@testing-library/dom'
import TimerComponent from './TimerComponent'

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

  it('auto-inicia en modo rest y muestra el botón Parar', () => {
    render(<TimerComponent timerMode="rest" />)

    // El componente auto-inicia en modo rest, así que el botón debería decir "Parar"
    expect(screen.getByRole('button', { name: /parar/i })).toBeInTheDocument()
  })

  it('incrementa el tiempo cuando está corriendo', () => {
    render(<TimerComponent timerMode="rest" />)

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(screen.getByText('00:03')).toBeInTheDocument()
  })

  it('detiene el timer al hacer click en Parar y muestra Reiniciar', () => {
    render(<TimerComponent timerMode="rest" />)

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    const stopButton = screen.getByRole('button', { name: /parar/i })
    fireEvent.click(stopButton)

    // Después de parar, el botón debería decir "Reiniciar"
    expect(screen.getByRole('button', { name: /reiniciar/i })).toBeInTheDocument()

    // El tiempo no debería seguir avanzando
    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(screen.getByText('00:02')).toBeInTheDocument()
  })

  it('muestra tiempo en formato MM:SS correctamente', () => {
    render(<TimerComponent timerMode="rest" />)

    act(() => {
      vi.advanceTimersByTime(65000)
    })

    expect(screen.getByText('01:05')).toBeInTheDocument()
  })

  it('llama a onTimeComplete al parar el timer', () => {
    const onTimeComplete = vi.fn()
    render(<TimerComponent timerMode="rest" onTimeComplete={onTimeComplete} />)

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    const stopButton = screen.getByRole('button', { name: /parar/i })
    fireEvent.click(stopButton)

    expect(onTimeComplete).toHaveBeenCalledWith(5)
  })

  it('se puede deshabilitar con la prop disabled', () => {
    render(<TimerComponent timerMode="rest" disabled />)

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })
})
