package models

import (
	"time"
)

// Exercise representa un ejercicio
type Exercise struct {
	ID               int      `json:"id" db:"id"`
	Name             string   `json:"name" db:"name"`
	MuscleGroup      string   `json:"muscle_group" db:"muscle_group"`
	PrimaryMuscles   []string `json:"primary_muscles" db:"primary_muscles"`
	SecondaryMuscles []string `json:"secondary_muscles" db:"secondary_muscles"`
	Equipment        string   `json:"equipment" db:"equipment"`
	VideoURL         *string  `json:"video_url" db:"video_url"`
	Bodyweight       bool     `json:"bodyweight" db:"bodyweight"`
	IsSport          bool     `json:"is_sport" db:"is_sport"`
	CreatedAt        time.Time `json:"created_at" db:"created_at"`
}

// ExerciseFilter representa filtros para buscar ejercicios
type ExerciseFilter struct {
	MuscleGroup string `json:"muscle_group"`
	Equipment   string `json:"equipment"`
	Search      string `json:"search"`
	IsSport     *bool  `json:"is_sport"`
}
