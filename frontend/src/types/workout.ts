// Tipos para la nueva estructura de workout_days

export interface WorkoutDay {
  id: number
  user_id: string
  date: string // Formato YYYY-MM-DD
  name: string
  effort: number
  mood: number
  created_at: string
  updated_at: string
}

export interface Workout {
  id: number
  user_id: string
  workout_day_id: number
  exercise_id: number
  exercise_name: string
  weight: number
  reps: number
  set: number
  seconds?: number
  observations: string
  created_at: string
  is_sport?: boolean
}

export interface CreateWorkoutRequest {
  exercise_id: number
  weight: number
  reps: number
  set?: number
  seconds?: number
  observations?: string
}

export interface UpdateWorkoutDayRequest {
  name?: string
  effort?: number
  mood?: number
}

export interface ExerciseGroup {
  exerciseName: string
  workouts: Workout[]
}

export interface WorkoutDayWithExercises {
  workoutDay: WorkoutDay
  exerciseGroups: ExerciseGroup[]
  totalWorkouts: number
}

// Tipos para notificaciones
export interface Notification {
  id: number
  user_id: string
  type: string
  title: string
  message: string
  data: string
  is_read: boolean
  created_at: string
}

export interface UnreadCountResponse {
  unread_count: number
}

export interface MarkAllReadResponse {
  message: string
  count: number
}
