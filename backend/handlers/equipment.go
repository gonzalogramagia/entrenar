package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/goalritmo/gym/backend/database"
	"github.com/goalritmo/gym/backend/models"
)

// GetEquipmentHandler obtiene la lista de equipos con filtros
func GetEquipmentHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Obtener parámetros de query
	category := r.URL.Query().Get("category")
	search := r.URL.Query().Get("search")

	query := `
		SELECT id, name, category, observations, image_url, created_at
		FROM equipment
		WHERE 1=1
	`

	args := []interface{}{}
	argIndex := 1

	if category != "" {
		query += ` AND category = $` + strconv.Itoa(argIndex)
		args = append(args, category)
		argIndex++
	}

	if search != "" {
		query += ` AND name ILIKE $` + strconv.Itoa(argIndex)
		args = append(args, "%"+search+"%")
		argIndex++
	}

	query += ` ORDER BY name ASC`

	rows, err := database.DB.Query(query, args...)
	if err != nil {
		http.Error(w, "Error consultando equipos", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var equipment []models.Equipment
	for rows.Next() {
		var eq models.Equipment
		err := rows.Scan(
			&eq.ID,
			&eq.Name,
			&eq.Category,
			&eq.Observations,
			&eq.ImageURL,
			&eq.CreatedAt,
		)
		if err != nil {
			http.Error(w, "Error escaneando equipo", http.StatusInternalServerError)
			return
		}
		equipment = append(equipment, eq)
	}

	json.NewEncoder(w).Encode(equipment)
}

// GetEquipmentByIdHandler obtiene un equipo específico por ID
func GetEquipmentByIdHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	vars := mux.Vars(r)
	id, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "ID inválido", http.StatusBadRequest)
		return
	}

	query := `
		SELECT id, name, category, observations, image_url, created_at
		FROM equipment
		WHERE id = $1
	`

	var equipment models.Equipment
	err = database.DB.QueryRow(query, id).Scan(
		&equipment.ID,
		&equipment.Name,
		&equipment.Category,
		&equipment.Observations,
		&equipment.ImageURL,
		&equipment.CreatedAt,
	)

	if err != nil {
		http.Error(w, "Equipo no encontrado", http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(equipment)
}
