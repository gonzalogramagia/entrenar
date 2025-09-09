// API Proxy para evitar problemas de CORS con Railway
const BACKEND_URL = 'https://entrenar.up.railway.app';

export async function apiProxy(endpoint: string, options: RequestInit = {}) {
  const url = `${BACKEND_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Funciones específicas para cada endpoint
export const api = {
  // User settings
  getUserSettings: () => apiProxy('/api/user-settings'),
  updateUserSettings: (data: any) => apiProxy('/api/user-settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // Workouts
  getWorkouts: () => apiProxy('/api/workouts'),
  createWorkout: (data: any) => apiProxy('/api/workouts', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Exercises
  getExercises: () => apiProxy('/api/exercises'),
  getExercise: (id: string) => apiProxy(`/api/exercises/${id}`),

  // Equipment
  getEquipment: () => apiProxy('/api/equipment'),
  getEquipmentById: (id: string) => apiProxy(`/api/equipment/${id}`),

  // User
  getCurrentUser: () => apiProxy('/api/me'),
  getUserStats: () => apiProxy('/api/me/stats'),

  // Notifications
  getNotifications: () => apiProxy('/api/notifications'),
  getUnreadCount: () => apiProxy('/api/notifications/count'),
  markAsRead: (id: string) => apiProxy(`/api/notifications/${id}/read`, {
    method: 'PUT',
  }),

  // Routines
  getRoutines: () => apiProxy('/api/routines'),
  createRoutine: (data: any) => apiProxy('/api/routines', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getRoutine: (id: string) => apiProxy(`/api/routines/${id}`),
  updateRoutine: (id: string, data: any) => apiProxy(`/api/routines/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteRoutine: (id: string) => apiProxy(`/api/routines/${id}`, {
    method: 'DELETE',
  }),
};
