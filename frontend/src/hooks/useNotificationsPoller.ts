import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { apiClient } from '../lib/api'

export function useNotificationsPoller() {
  const { isGuest } = useAuth()
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  // Función para cargar el contador de notificaciones no leídas
  const loadUnreadNotificationsCount = useCallback(async () => {
    if (isGuest) {
      const isRead = localStorage.getItem('guest_welcome_read') === 'true'
      setUnreadNotifications(isRead ? 0 : 1)
      return
    }
    try {
      const response = await apiClient.getUnreadNotificationsCount() as { unread_count: number }
      setUnreadNotifications(response.unread_count || 0)
    } catch (error) {
      console.error('Error cargando contador de notificaciones:', error)
      setUnreadNotifications(0)
    }
  }, [isGuest])

  // Función para cargar notificaciones automáticamente al ingresar
  const loadNotificationsOnLogin = useCallback(async () => {
    if (isGuest) return
    try {
      // Cargar contador de notificaciones no leídas
      await loadUnreadNotificationsCount()
    } catch (error) {
      console.error('Error cargando notificaciones al ingresar:', error)
    }
  }, [loadUnreadNotificationsCount, isGuest])

  // Cargar contador de notificaciones no leídas al montar el componente
  useEffect(() => {
    loadUnreadNotificationsCount()
  }, [loadUnreadNotificationsCount])

  // Cargar notificaciones automáticamente al ingresar
  useEffect(() => {
    loadNotificationsOnLogin()
  }, [loadNotificationsOnLogin])

  return {
    unreadNotifications,
    loadUnreadNotificationsCount
  }
}
