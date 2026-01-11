export interface Exercise {
  id: number
  name: string
  muscle_group: string
  primary_muscles: string[]
  secondary_muscles: string[]

  video_url?: string
  bodyweight: boolean
  is_sport: boolean
  created_at: string
}

export interface CreateExerciseRequest {
  name: string
  muscle_group: string
  primary_muscles: string[]
  secondary_muscles: string[]

  video_url?: string
  bodyweight?: boolean
  is_sport?: boolean
}

export interface UpdateExerciseRequest {
  name?: string
  muscle_group?: string
  primary_muscles?: string[]
  secondary_muscles?: string[]

  video_url?: string
  bodyweight?: boolean
  is_sport?: boolean
}

export interface ExerciseFilter {
  muscle_group?: string

  search?: string
  is_sport?: boolean
}
