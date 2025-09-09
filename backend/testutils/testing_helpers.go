package testutils

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gorilla/mux"
)

// TestRequest encapsula una request de prueba
type TestRequest struct {
	Method      string
	URL         string
	Body        interface{}
	Headers     map[string]string
	UserID      string
	QueryParams map[string]string
}

// APITestSuite provee utilities para testing de APIs
type APITestSuite struct {
	Router *mux.Router
	t      *testing.T
}

// NewAPITestSuite crea una nueva suite de testing
func NewAPITestSuite(t *testing.T) *APITestSuite {
	return &APITestSuite{
		Router: mux.NewRouter(),
		t:      t,
	}
}

// MakeRequest crea y ejecuta una request de prueba
func (suite *APITestSuite) MakeRequest(req TestRequest) *httptest.ResponseRecorder {
	var bodyReader *bytes.Buffer
	if req.Body != nil {
		bodyBytes, err := json.Marshal(req.Body)
		if err != nil {
			suite.t.Fatalf("Error marshaling request body: %v", err)
		}
		bodyReader = bytes.NewBuffer(bodyBytes)
	} else {
		bodyReader = bytes.NewBuffer([]byte{})
	}

	httpReq, err := http.NewRequest(req.Method, req.URL, bodyReader)
	if err != nil {
		suite.t.Fatalf("Error creating request: %v", err)
	}

	// Agregar headers
	httpReq.Header.Set("Content-Type", "application/json")
	for key, value := range req.Headers {
		httpReq.Header.Set(key, value)
	}

	// Agregar parámetros de query
	if len(req.QueryParams) > 0 {
		q := httpReq.URL.Query()
		for key, value := range req.QueryParams {
			q.Add(key, value)
		}
		httpReq.URL.RawQuery = q.Encode()
	}

	// Agregar user_id al contexto si se especifica
	if req.UserID != "" {
		ctx := context.WithValue(httpReq.Context(), "user_id", req.UserID)
		httpReq = httpReq.WithContext(ctx)
	}

	// Ejecutar request
	rr := httptest.NewRecorder()
	suite.Router.ServeHTTP(rr, httpReq)

	return rr
}

// AssertStatus verifica el código de estado HTTP
func (suite *APITestSuite) AssertStatus(rr *httptest.ResponseRecorder, expectedStatus int) {
	if rr.Code != expectedStatus {
		suite.t.Errorf("Expected status %d, got %d. Response: %s",
			expectedStatus, rr.Code, rr.Body.String())
	}
}

// AssertJSON verifica que la respuesta sea JSON válido
func (suite *APITestSuite) AssertJSON(rr *httptest.ResponseRecorder, target interface{}) {
	if err := json.Unmarshal(rr.Body.Bytes(), target); err != nil {
		suite.t.Errorf("Response is not valid JSON: %v. Body: %s", err, rr.Body.String())
	}
}

// AssertContains verifica que la respuesta contenga un string específico
func (suite *APITestSuite) AssertContains(rr *httptest.ResponseRecorder, expected string) {
	body := rr.Body.String()
	if !contains(body, expected) {
		suite.t.Errorf("Expected response to contain '%s', got: %s", expected, body)
	}
}

// AssertNotContains verifica que la respuesta NO contenga un string específico
func (suite *APITestSuite) AssertNotContains(rr *httptest.ResponseRecorder, unexpected string) {
	body := rr.Body.String()
	if contains(body, unexpected) {
		suite.t.Errorf("Expected response to NOT contain '%s', got: %s", unexpected, body)
	}
}

// AssertHeaderEquals verifica que un header tenga el valor esperado
func (suite *APITestSuite) AssertHeaderEquals(rr *httptest.ResponseRecorder, header, expected string) {
	actual := rr.Header().Get(header)
	if actual != expected {
		suite.t.Errorf("Expected header %s to be '%s', got '%s'", header, expected, actual)
	}
}

// contains es un helper que verifica si un string contiene otro
func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(substr) == 0 || 
		(len(substr) <= len(s) && containsHelper(s, substr)))
}

func containsHelper(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}

// TestDatabase representa una configuración de DB para testing
type TestDatabase struct {
	ConnectionString string
	CleanupFuncs     []func()
}

// NewTestDatabase crea una nueva instancia de DB para testing
func NewTestDatabase() *TestDatabase {
	return &TestDatabase{
		CleanupFuncs: make([]func(), 0),
	}
}

// Cleanup ejecuta todas las funciones de limpieza registradas
func (db *TestDatabase) Cleanup() {
	for _, cleanup := range db.CleanupFuncs {
		cleanup()
	}
}

// AddCleanup registra una función de limpieza
func (db *TestDatabase) AddCleanup(cleanup func()) {
	db.CleanupFuncs = append(db.CleanupFuncs, cleanup)
}

// MockData contiene datos de prueba comunes
type MockData struct {
	UserID string
}

// NewMockData crea datos de prueba estándar
func NewMockData() *MockData {
	return &MockData{
		UserID: "test_user_123",
	}
}
