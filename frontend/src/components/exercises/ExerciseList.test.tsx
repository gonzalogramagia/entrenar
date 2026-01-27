import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { screen } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import ExerciseList from './ExerciseList'

const mockExercises = [
  {
    id: 1,
    name: 'Press de Banca',
    muscle_group: 'Pecho',
    primary_muscles: ['Pectoral Mayor', 'Tríceps'],
    secondary_muscles: ['Deltoides Anterior', 'Serrato Anterior'],
    video_url: 'https://www.youtube.com/watch?v=rT7DgCr-3pg'
  },
  {
    id: 2,
    name: 'Sentadilla',
    muscle_group: 'Piernas',
    primary_muscles: ['Cuádriceps', 'Glúteos'],
    secondary_muscles: ['Isquiotibiales', 'Gastrocnemio', 'Core'],
    video_url: 'https://www.youtube.com/watch?v=aclHkVaku9U'
  },
  {
    id: 3,
    name: 'Peso Muerto',
    muscle_group: 'Espalda',
    primary_muscles: ['Erector Espinal', 'Glúteos', 'Isquiotibiales'],
    secondary_muscles: ['Trapecio', 'Romboides', 'Core'],
    video_url: 'https://www.youtube.com/watch?v=op9kVnSso6Q'
  },
  {
    id: 4,
    name: 'Press Militar',
    muscle_group: 'Hombros',
    primary_muscles: ['Deltoides Anterior', 'Deltoides Medio'],
    secondary_muscles: ['Tríceps', 'Trapecio Superior'],
    video_url: 'https://www.youtube.com/watch?v=2yjwXTZQDDI'
  },
  {
    id: 5,
    name: 'Curl de Bíceps',
    muscle_group: 'Brazos',
    primary_muscles: ['Bíceps Braquial'],
    secondary_muscles: ['Braquiorradial', 'Braquial'],
    video_url: 'https://www.youtube.com/watch?v=ykJmrZ5v0Oa'
  },
]

describe('ExerciseList', () => {
  it('muestra lista de ejercicios', () => {
    render(<ExerciseList exercises={mockExercises} onSelectExercise={vi.fn()} />)

    expect(screen.getByText('Press de Banca')).toBeInTheDocument()
    expect(screen.getByText('Sentadilla')).toBeInTheDocument()
    expect(screen.getByText('Peso Muerto')).toBeInTheDocument()
    expect(screen.getByText('Press Militar')).toBeInTheDocument()
    expect(screen.getByText('Curl de Bíceps')).toBeInTheDocument()
  })

  it('muestra información de grupo muscular', () => {
    render(<ExerciseList exercises={mockExercises} onSelectExercise={vi.fn()} />)

    expect(screen.getByText('Pecho')).toBeInTheDocument()
    expect(screen.getByText('Piernas')).toBeInTheDocument()
    expect(screen.getByText('Espalda')).toBeInTheDocument()
    expect(screen.getByText('Hombros')).toBeInTheDocument()
    expect(screen.getByText('Brazos')).toBeInTheDocument()
  })

  it('permite buscar ejercicios por nombre', async () => {
    const user = userEvent.setup()
    render(<ExerciseList exercises={mockExercises} onSelectExercise={vi.fn()} />)

    const searchInput = screen.getByPlaceholderText('Buscar ejercicios...')
    await user.type(searchInput, 'Press')

    expect(screen.getByText('Press de Banca')).toBeInTheDocument()
    expect(screen.getByText('Press Militar')).toBeInTheDocument()
    expect(screen.queryByText('Sentadilla')).not.toBeInTheDocument()
    expect(screen.queryByText('Peso Muerto')).not.toBeInTheDocument()
    expect(screen.queryByText('Curl de Bíceps')).not.toBeInTheDocument()
  })

  it('llama a onSelectExercise cuando se hace click en un ejercicio', async () => {
    const onSelectExercise = vi.fn()
    const user = userEvent.setup()
    render(<ExerciseList exercises={mockExercises} onSelectExercise={onSelectExercise} />)

    const exerciseCard = screen.getByText('Press de Banca').closest('div')
    await user.click(exerciseCard!)

    expect(onSelectExercise).toHaveBeenCalledWith(mockExercises[0])
  })

  it('muestra mensaje cuando no hay ejercicios', () => {
    render(<ExerciseList exercises={[]} onSelectExercise={vi.fn()} />)

    expect(screen.getByText(/No hay ejercicios disponibles/i)).toBeInTheDocument()
  })

  it('muestra mensaje cuando no hay resultados de búsqueda', async () => {
    const user = userEvent.setup()
    render(<ExerciseList exercises={mockExercises} onSelectExercise={vi.fn()} />)

    const searchInput = screen.getByPlaceholderText('Buscar ejercicios...')
    await user.type(searchInput, 'EjercicioInexistente')

    expect(screen.getByText('Sin resultados')).toBeInTheDocument()
  })
})
