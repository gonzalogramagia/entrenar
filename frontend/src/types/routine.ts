export interface RoutineExercise {
  id: number
  routine_id: number
  exercise_id: number
  exercise_name: string
  order_index: number
  sets: number
  reps: number
  weight?: number
  rest_time_seconds: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface UserRoutine {
  id: number
  user_id: string
  name: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
  exercises?: RoutineExercise[]
}

export interface RoutineWithExercises extends UserRoutine {
  exercises: RoutineExercise[]
  total_exercises: number
}

export interface CreateRoutineRequest {
  name: string
  description?: string
  exercises?: CreateRoutineExerciseRequest[]
}

export interface CreateRoutineExerciseRequest {
  exercise_id: number
  order_index: number
  sets: number
  reps: number
  weight?: number
  rest_time_seconds: number
  notes?: string
}

export interface UpdateRoutineRequest {
  name?: string
  description?: string
  is_active?: boolean
}

export interface UpdateRoutineExerciseRequest {
  order_index?: number
  sets?: number
  reps?: number
  weight?: number
  rest_time_seconds?: number
  notes?: string
}
