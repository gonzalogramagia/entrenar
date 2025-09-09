package models

import "time"

// UserRoutine representa una rutina personalizada de un usuario
type UserRoutine struct {
	ID          int       `json:"id" db:"id"`
	UserID      string    `json:"user_id" db:"user_id"`
	Name        string    `json:"name" db:"name"`
	Description *string   `json:"description" db:"description"`
	IsActive    bool      `json:"is_active" db:"is_active"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
	Exercises   []RoutineExercise `json:"exercises,omitempty"`
}

// RoutineExercise representa un ejercicio dentro de una rutina
type RoutineExercise struct {
	ID              int       `json:"id" db:"id"`
	RoutineID       int       `json:"routine_id" db:"routine_id"`
	ExerciseID      int       `json:"exercise_id" db:"exercise_id"`
	ExerciseName    string    `json:"exercise_name" db:"exercise_name"`
	OrderIndex      int       `json:"order_index" db:"order_index"`
	Sets            int       `json:"sets" db:"sets"`
	Reps            int       `json:"reps" db:"reps"`
	Weight          *float64  `json:"weight" db:"weight"`
	RestTimeSeconds int       `json:"rest_time_seconds" db:"rest_time_seconds"`
	Notes           *string   `json:"notes" db:"notes"`
	CreatedAt       time.Time `json:"created_at" db:"created_at"`
	UpdatedAt       time.Time `json:"updated_at" db:"updated_at"`
}

// CreateRoutineRequest representa la solicitud para crear una rutina
type CreateRoutineRequest struct {
	Name        string `json:"name" validate:"required,min=1,max=255"`
	Description string `json:"description,omitempty"`
	Exercises   []CreateRoutineExerciseRequest `json:"exercises,omitempty"`
}

// CreateRoutineExerciseRequest representa la solicitud para agregar un ejercicio a una rutina
type CreateRoutineExerciseRequest struct {
	ExerciseID      int     `json:"exercise_id" validate:"required,gt=0"`
	OrderIndex      int     `json:"order_index" validate:"required,gte=0"`
	Sets            int     `json:"sets" validate:"required,gt=0,lte=20"`
	Reps            int     `json:"reps" validate:"required,gt=0,lte=100"`
	Weight          *float64 `json:"weight,omitempty" validate:"omitempty,gt=0,lte=1000"`
	RestTimeSeconds int     `json:"rest_time_seconds" validate:"required,gte=0,lte=3600"`
	Notes           string  `json:"notes,omitempty"`
}

// UpdateRoutineRequest representa la solicitud para actualizar una rutina
type UpdateRoutineRequest struct {
	Name        *string `json:"name,omitempty" validate:"omitempty,min=1,max=255"`
	Description *string `json:"description,omitempty"`
	IsActive    *bool   `json:"is_active,omitempty"`
}

// UpdateRoutineExerciseRequest representa la solicitud para actualizar un ejercicio en una rutina
type UpdateRoutineExerciseRequest struct {
	OrderIndex      *int     `json:"order_index,omitempty" validate:"omitempty,gte=0"`
	Sets            *int     `json:"sets,omitempty" validate:"omitempty,gt=0,lte=20"`
	Reps            *int     `json:"reps,omitempty" validate:"omitempty,gt=0,lte=100"`
	Weight          *float64 `json:"weight,omitempty" validate:"omitempty,gt=0,lte=1000"`
	RestTimeSeconds *int     `json:"rest_time_seconds,omitempty" validate:"omitempty,gte=0,lte=3600"`
	Notes           *string  `json:"notes,omitempty"`
}

// RoutineWithExercises representa una rutina con sus ejercicios incluidos
type RoutineWithExercises struct {
	UserRoutine
	Exercises []RoutineExercise `json:"exercises"`
	TotalExercises int `json:"total_exercises"`
}
