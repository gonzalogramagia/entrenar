import type { Workout, WorkoutDay } from '../types/workout'

/**
 * Datos mock para el modo invitado del historial de entrenamientos
 */
export function getGuestMockData(language: string): { workoutDays: WorkoutDay[]; workouts: Workout[] } {
  // Sesiones del 20, 22 y 24 de abril
  const april24 = '2026-04-24'
  const april22 = '2026-04-22'
  const april20 = '2026-04-20'
  
  const workoutDays: WorkoutDay[] = [
    {
      id: 1000,
      user_id: 'guest',
      date: april24,
      name: 'Brazos (Bíceps y Tríceps)',
      created_at: april24,
      updated_at: april24,
      effort: 3,
      mood: 5
    },
    {
      id: 999,
      user_id: 'guest',
      date: april22,
      name: 'Pecho y Espalda',
      created_at: april22,
      updated_at: april22,
      effort: 4,
      mood: 4
    },
    {
      id: 998,
      user_id: 'guest',
      date: april20,
      name: 'Piernas y Glúteos',
      created_at: april20,
      updated_at: april20,
      effort: 5,
      mood: 3
    }
  ]
  
  const workouts: Workout[] = [
    // Brazos - 24 Abril
    {
      id: 10000,
      user_id: 'guest',
      workout_day_id: 1000,
      exercise_id: 100,
      exercise_name: language === 'es' ? 'Calentamiento' : 'Warm Up',
      reps: 1,
      weight: 0,
      seconds: 300,
      set: 1,
      created_at: april24,
      observations: ''
    },
    {
      id: 10001,
      user_id: 'guest',
      workout_day_id: 1000,
      exercise_id: 5,
      exercise_name: 'Curl de Bíceps',
      reps: 12,
      weight: 15,
      set: 1,
      created_at: april24,
      observations: 'Buen pump'
    },
    {
      id: 10002,
      user_id: 'guest',
      workout_day_id: 1000,
      exercise_id: 5,
      exercise_name: 'Curl de Bíceps',
      reps: 10,
      weight: 15,
      set: 2,
      created_at: april24,
      observations: ''
    },
    {
      id: 10003,
      user_id: 'guest',
      workout_day_id: 1000,
      exercise_id: 6,
      exercise_name: 'Extensiones de Tríceps',
      reps: 15,
      weight: 20,
      set: 1,
      created_at: april24,
      observations: ''
    },
    {
      id: 10010,
      user_id: 'guest',
      workout_day_id: 1000,
      exercise_id: 9,
      exercise_name: 'Martillo',
      reps: 12,
      weight: 12,
      set: 1,
      created_at: april24,
      observations: ''
    },
    {
      id: 10013,
      user_id: 'guest',
      workout_day_id: 1000,
      exercise_id: 101,
      exercise_name: language === 'es' ? 'Estiramiento' : 'Stretching',
      reps: 1,
      weight: 0,
      seconds: 300,
      set: 1,
      created_at: april24,
      observations: ''
    },
    
    // Pecho y Espalda - 22 Abril
    {
      id: 10014,
      user_id: 'guest',
      workout_day_id: 999,
      exercise_id: 100,
      exercise_name: language === 'es' ? 'Calentamiento' : 'Warm Up',
      reps: 1,
      weight: 0,
      seconds: 300,
      set: 1,
      created_at: april22,
      observations: ''
    },
    {
      id: 10004,
      user_id: 'guest',
      workout_day_id: 999,
      exercise_id: 1,
      exercise_name: 'Press de Banca',
      reps: 10,
      weight: 70,
      set: 1,
      created_at: april22,
      observations: 'Récord personal'
    },
    {
      id: 10005,
      user_id: 'guest',
      workout_day_id: 999,
      exercise_id: 7,
      exercise_name: 'Remo con Barra',
      reps: 12,
      weight: 50,
      set: 1,
      created_at: april22,
      observations: ''
    },
    {
      id: 10011,
      user_id: 'guest',
      workout_day_id: 999,
      exercise_id: 10,
      exercise_name: 'Dominadas',
      reps: 10,
      weight: 0,
      set: 1,
      created_at: april22,
      observations: ''
    },
    {
      id: 10015,
      user_id: 'guest',
      workout_day_id: 999,
      exercise_id: 101,
      exercise_name: language === 'es' ? 'Estiramiento' : 'Stretching',
      reps: 1,
      weight: 0,
      seconds: 300,
      set: 1,
      created_at: april22,
      observations: ''
    },
    
    // Piernas - 20 Abril
    {
      id: 10016,
      user_id: 'guest',
      workout_day_id: 998,
      exercise_id: 100,
      exercise_name: language === 'es' ? 'Calentamiento' : 'Warm Up',
      reps: 1,
      weight: 0,
      seconds: 300,
      set: 1,
      created_at: april20,
      observations: ''
    },
    {
      id: 10006,
      user_id: 'guest',
      workout_day_id: 998,
      exercise_id: 2,
      exercise_name: 'Sentadilla',
      reps: 12,
      weight: 90,
      set: 1,
      created_at: april20,
      observations: 'Muy pesado pero bien'
    },
    {
      id: 10007,
      user_id: 'guest',
      workout_day_id: 998,
      exercise_id: 2,
      exercise_name: 'Sentadilla',
      reps: 10,
      weight: 90,
      set: 2,
      created_at: april20,
      observations: ''
    },
    {
      id: 10008,
      user_id: 'guest',
      workout_day_id: 998,
      exercise_id: 8,
      exercise_name: 'Prensa',
      reps: 15,
      weight: 120,
      set: 1,
      created_at: april20,
      observations: ''
    },
    {
      id: 10012,
      user_id: 'guest',
      workout_day_id: 998,
      exercise_id: 11,
      exercise_name: 'Gemelos en Máquina',
      reps: 20,
      weight: 40,
      set: 1,
      created_at: april20,
      observations: ''
    },
    {
      id: 10017,
      user_id: 'guest',
      workout_day_id: 998,
      exercise_id: 101,
      exercise_name: language === 'es' ? 'Estiramiento' : 'Stretching',
      reps: 1,
      weight: 0,
      seconds: 300,
      set: 1,
      created_at: april20,
      observations: ''
    }
  ]

  return { workoutDays, workouts }
}
