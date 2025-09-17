import { supabase } from './supabase'

const getApiBaseUrl = () => {
  // Temporal: hardcode para Railway deployment
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://entrenar.up.railway.app'
  // Asegurar que siempre termine con /api
  return baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`
}

const API_BASE_URL = getApiBaseUrl()

interface ApiRequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers?: Record<string, string>
  body?: any
  requireAuth?: boolean
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.access_token) {
      throw new Error('No auth session found')
    }

    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    }
  }

  private async request<T>(endpoint: string, config: ApiRequestConfig = {}): Promise<T> {
    const {
      method = 'GET',
      headers = {},
      body,
      requireAuth = true
    } = config

    // Construir la URL correctamente para el proxy
    let url: string
    if (this.baseUrl === '/api/proxy') {
      // Para el proxy, necesitamos pasar el endpoint como query parameter
      const path = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
      url = `${this.baseUrl}?path=${encodeURIComponent(path)}`
    } else {
      // Para desarrollo local, usar la URL completa
      url = `${this.baseUrl}${endpoint}`
    }
    
    let requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers
    }

    // Add auth headers if required
    if (requireAuth) {
      try {
        const authHeaders = await this.getAuthHeaders()
        requestHeaders = { ...requestHeaders, ...authHeaders }
      } catch (error) {
        throw new Error('Authentication required')
      }
    }

    const requestConfig: RequestInit = {
      method,
      headers: requestHeaders,
    }

    if (body && method !== 'GET') {
      const bodyString = JSON.stringify(body)
      requestConfig.body = bodyString
    }

    try {
      const response = await fetch(url, requestConfig)
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API Error: ${response.status} - ${errorText}`)
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        return await response.json()
      } else {
        return {} as T
      }
    } catch (error) {
      console.error(`API request failed: ${method} ${url}`, error)
      throw error
    }
  }

  // Health check (no auth required)
  async health() {
    return this.request('/health', { requireAuth: false })
  }

  // Update last sign in
  async updateLastSignIn() {
    return this.request('/me/last-signin', { method: 'POST' })
  }

  // Setup user after registration
  async setupUser(userId: string, email: string, name?: string) {
    return this.request('/me/setup', {
      method: 'POST',
      body: { user_id: userId, email, name }
    })
  }

  // Workouts API
  async getWorkouts(date?: string, workoutDayId?: string) {
    const params = new URLSearchParams()
    if (date) params.append('date', date)
    if (workoutDayId) params.append('workout_day_id', workoutDayId)
    
    const query = params.toString()
    const endpoint = query ? `/workouts?${query}` : '/workouts'
    return this.request(endpoint)
  }

  async createWorkout(workout: any) {
    return this.request('/workouts', {
      method: 'POST',
      body: workout
    })
  }

  async updateWorkout(id: number, workout: any) {
    return this.request(`/workouts/${id}`, {
      method: 'PUT',
      body: workout
    })
  }

  async updateWorkoutDayName(id: number, name: string) {
    return this.request(`/workout-days/${id}/name`, {
      method: 'PUT',
      body: { name }
    })
  }

  async deleteWorkout(id: number) {
    return this.request(`/workouts/${id}`, {
      method: 'DELETE'
    })
  }

  // Workout Days API
  async getWorkoutDays() {
    return this.request('/workout-days')
  }

  // Exercises API
  async getExercises() {
    return this.request('/exercises')
  }

  async getExercise(id: number) {
    return this.request(`/exercises/${id}`)
  }

  // Equipment API
  async getEquipment() {
    return this.request('/equipment')
  }

  async getEquipmentById(id: number) {
    return this.request(`/equipment/${id}`)
  }

  // User API
  async getCurrentUser() {
    return this.request('/me')
  }

  async getUserStats() {
    return this.request('/me/stats')
  }

  // Social API
  async getSocialWorkouts(limit: number = 10, offset: number = 0): Promise<any[]> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    })
    return this.request(`/social/workouts?${params}`)
  }

  async giveKudos(workoutId: number) {
    return this.request(`/social/workouts/${workoutId}/kudos`, {
      method: 'POST'
    })
  }

  // Notifications API
  async getNotifications(limit: number = 20, offset: number = 0) {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    })
    return this.request(`/notifications?${params}`)
  }

  async getSystemNotifications() {
    return this.request('/notifications/system')
  }

  async getUnreadNotificationsCount() {
    return this.request('/notifications/count')
  }

  async markNotificationAsRead(id: number) {
    return this.request(`/notifications/${id}/read`, {
      method: 'PUT'
    })
  }

  async markAllNotificationsAsRead() {
    return this.request('/notifications/read-all', {
      method: 'PUT'
    })
  }

  async deleteNotification(id: number) {
    return this.request(`/notifications/${id}`, {
      method: 'DELETE'
    })
  }

  // Welcome notification API
  async createWelcomeNotification() {
    return this.request('/welcome-notification', {
      method: 'POST'
    })
  }

  async getWelcomeNotification() {
    return this.request('/welcome-notification')
  }

  // User Settings API
  async getUserSettings() {
    return this.request('/user-settings')
  }

  async updateUserSettings(settings: { show_own_workouts_in_social?: boolean; has_configured_favorites?: boolean; favorite_exercises?: number[] }) {
    return this.request('/user-settings', {
      method: 'PUT',
      body: settings
    })
  }

  // Admin API
  async getAdminNotifications() {
    return this.request('/admin/notifications')
  }

  async createAdminNotification(notification: {
    title: string
    message: string
    type: 'info' | 'warning' | 'success' | 'error'
  }) {
    return this.request('/admin/notifications', {
      method: 'POST',
      body: notification
    })
  }

  async deleteAdminNotification(id: number) {
    return this.request(`/admin/notifications/${id}`, {
      method: 'DELETE'
    })
  }

  async updateAdminNotification(id: number, notification: {
    title: string
    message: string
    type: 'info' | 'warning' | 'success' | 'error'
  }) {
    return this.request(`/admin/notifications/${id}`, {
      method: 'PUT',
      body: notification
    })
  }

  async getNotificationHistory(id: number) {
    return this.request(`/admin/notifications/${id}/history`)
  }

  async getAdminExercises() {
    return this.request('/admin/exercises')
  }

  async createAdminExercise(exercise: {
    name: string
    muscle_group: string
    primary_muscles: string[]
    secondary_muscles: string[]
    equipment: string
    video_url?: string
    bodyweight?: boolean
    is_sport?: boolean
  }) {
    return this.request('/admin/exercises', {
      method: 'POST',
      body: exercise
    })
  }

  async getAdminUsers() {
    return this.request('/admin/users')
  }

  async deleteAdminUser(id: string) {
    return this.request(`/admin/users/${id}`, {
      method: 'DELETE'
    })
  }

  async updateAdminUserRole(id: string, role: string) {
    return this.request(`/admin/users/${id}/role`, {
      method: 'PUT',
      body: { role }
    })
  }

  async updateAdminUserName(id: string, name: string) {
    return this.request(`/admin/users/${id}/name`, {
      method: 'PUT',
      body: { name }
    })
  }

  // Routines API
  async getUserRoutines() {
    return this.request('/routines')
  }

  async getUserRoutine(id: number) {
    return this.request(`/routines/${id}`)
  }

  async createUserRoutine(routine: {
    name: string
    description?: string
    exercises?: Array<{
      exercise_id: number
      order_index: number
      sets: number
      reps: number
      weight?: number
      rest_time_seconds: number
      notes?: string
    }>
  }) {
    return this.request('/routines', {
      method: 'POST',
      body: routine
    })
  }

  async updateUserRoutine(id: number, routine: {
    name?: string
    description?: string
    is_active?: boolean
  }) {
    return this.request(`/routines/${id}`, {
      method: 'PUT',
      body: routine
    })
  }

  async deleteUserRoutine(id: number) {
    return this.request(`/routines/${id}`, {
      method: 'DELETE'
    })
  }
}

// Export singleton instance
export const apiClient = new ApiClient(API_BASE_URL)

// Export types for use in components
export type { ApiRequestConfig }