package models

import (
	"time"
)

// Equipment representa un equipo de gimnasio
type Equipment struct {
	ID           int     `json:"id" db:"id"`
	Name         string  `json:"name" db:"name"`
	Category     string  `json:"category" db:"category"`
	Observations *string `json:"observations" db:"observations"`
	ImageURL     *string `json:"image_url" db:"image_url"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
}

// EquipmentFilter representa filtros para buscar equipos
type EquipmentFilter struct {
	Category string `json:"category"`
	Search   string `json:"search"`
}
