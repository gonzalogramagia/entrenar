package models

import "time"

// WorkoutDay representa un día de entrenamiento
type WorkoutDay struct {
	ID        int       `json:"id" db:"id"`
	UserID    string    `json:"user_id" db:"user_id"`
	Date      string    `json:"date" db:"date"` // Formato YYYY-MM-DD
	Name      string    `json:"name" db:"name"`
	Effort    int       `json:"effort" db:"effort"`
	Mood      int       `json:"mood" db:"mood"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

// Workout representa un ejercicio individual
type Workout struct {
	ID           int       `json:"id" db:"id"`
	UserID       string    `json:"user_id" db:"user_id"`
	WorkoutDayID int       `json:"workout_day_id" db:"workout_day_id"`
	ExerciseID   int       `json:"exercise_id" db:"exercise_id"`
	ExerciseName string    `json:"exercise_name" db:"exercise_name"`
	Weight       float64   `json:"weight" db:"weight"`
	Reps         int       `json:"reps" db:"reps"`
	Set          int       `json:"set" db:"set"`
	Seconds      *int      `json:"seconds" db:"seconds"`
	Observations string    `json:"observations" db:"observations"`
	IsSport      bool      `json:"is_sport" db:"is_sport"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
}

// CreateWorkoutRequest representa la solicitud para crear un workout
type CreateWorkoutRequest struct {
	ExerciseID   int      `json:"exercise_id" validate:"required,gt=0"`
	Weight       *float64 `json:"weight" validate:"omitempty,gt=0"`
	Reps         *int     `json:"reps" validate:"omitempty,gt=0"`
	Set          *int     `json:"set"`
	Seconds      *int     `json:"seconds" validate:"omitempty,gt=0"`
	Observations string   `json:"observations"`
}

// UpdateWorkoutDayRequest representa la solicitud para actualizar un día de entrenamiento
type UpdateWorkoutDayRequest struct {
	Name   string `json:"name"`
	Effort int    `json:"effort" validate:"min=0,max=10"`
	Mood   int    `json:"mood" validate:"min=0,max=10"`
}

// ExerciseGroup representa un grupo de ejercicios del mismo tipo
type ExerciseGroup struct {
	ExerciseName string    `json:"exercise_name"`
	Workouts     []Workout `json:"workouts"`
}

// WorkoutDayWithExercises representa un día de entrenamiento con sus ejercicios agrupados
type WorkoutDayWithExercises struct {
	WorkoutDay     WorkoutDay      `json:"workout_day"`
	ExerciseGroups []ExerciseGroup `json:"exercise_groups"`
	TotalWorkouts  int             `json:"total_workouts"`
}
