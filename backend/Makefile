.PHONY: build run test clean deps

# Variables
BINARY_NAME=entrenar-api
GO_FILES=$(shell find . -name "*.go" -type f)

# Construir el binario
build:
	go build -o $(BINARY_NAME) .

# Ejecutar el servidor
run:
	go run main.go

# Ejecutar tests
test:
	go test -v ./...

# Ejecutar solo tests unitarios (sin integración)
test-unit:
	go test -v -short ./...

# Ejecutar tests de integración
test-integration:
	go test -v -run="Integration" ./...

# Ejecutar tests con coverage
test-coverage:
	go test -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report generado en coverage.html"

# Ejecutar tests con coverage detallado
test-coverage-func:
	go test -coverprofile=coverage.out ./...
	go tool cover -func=coverage.out

# Benchmarks
benchmark:
	go test -bench=. -benchmem ./...

# Tests con race detection
test-race:
	go test -race -v ./...

# Tests en modo watch (requiere entr)
test-watch:
	find . -name "*.go" | entr -c make test-unit

# Setup de testing con Supabase
test-setup:
	./scripts/test-setup.sh

# Tests específicos con Supabase
test-supabase:
	go test -v -run="TestSupabase" ./handlers

# Verificar conexión con Supabase
test-db-connection:
	go test -v -run="TestSupabaseIntegration/Create_workout_with_real_database" ./handlers -count=1

# Instalar dependencias
deps:
	go mod tidy
	go mod download

# Limpiar archivos generados
clean:
	go clean
	rm -f $(BINARY_NAME)
	rm -f coverage.out coverage.html

# Verificar formato del código
fmt:
	go fmt ./...

# Ejecutar linter
lint:
	golangci-lint run

# Hot reload para desarrollo (requiere air)
dev:
	air

# Instalar air para hot reload
install-air:
	go install github.com/cosmtrek/air@latest

# Help
help:
	@echo "Comandos disponibles:"
	@echo "  build          - Construir el binario"
	@echo "  run            - Ejecutar el servidor"
	@echo "  test           - Ejecutar tests"
	@echo "  test-coverage  - Ejecutar tests con coverage"
	@echo "  deps           - Instalar dependencias"
	@echo "  clean          - Limpiar archivos generados"
	@echo "  fmt            - Formatear código"
	@echo "  lint           - Ejecutar linter"
	@echo "  dev            - Hot reload (requiere air)"
	@echo "  install-air    - Instalar air para desarrollo"
