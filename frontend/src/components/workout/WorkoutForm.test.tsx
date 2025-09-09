import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import WorkoutForm from './WorkoutForm.tsx'

const exercises = [{ id: 1, name: 'Press de Banca' }]

describe('WorkoutForm', () => {
  it('envía datos válidos', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<WorkoutForm exercises={exercises} onSubmit={onSubmit} />)

    // Seleccionar ejercicio (select nativo de MUI)
    const selectElement = screen.getByRole('combobox', { name: 'Ejercicio' })
    fireEvent.change(selectElement, { target: { value: '1' } })

    // Campos requeridos
    await user.type(screen.getByRole('spinbutton', { name: 'Peso (kg)' }), '80')
    await user.type(screen.getByRole('spinbutton', { name: 'Repeticiones' }), '8')

    // Opcionales
    await user.type(screen.getByRole('spinbutton', { name: 'Serie' }), '1')
    await user.type(screen.getByRole('spinbutton', { name: 'Segundos (capturados del cronómetro)' }), '45')
    await user.type(screen.getByRole('textbox', { name: 'Observaciones' }), 'Buena técnica')

    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        exerciseId: 1,
        weight: 80,
        reps: 8,
        serie: 1,
        seconds: 45,
        observations: 'Buena técnica',
      })
    })
  })

  it('muestra errores si faltan requeridos', async () => {
    const onSubmit = vi.fn()
    render(<WorkoutForm exercises={exercises} onSubmit={onSubmit} />)

    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    // Verificamos que aparezcan mensajes de error (string genérico de zod para NaN)
    const errs = await screen.findAllByText(/invalid input/i)
    expect(errs.length).toBeGreaterThanOrEqual(2)
    expect(onSubmit).not.toHaveBeenCalled()
  })
})


