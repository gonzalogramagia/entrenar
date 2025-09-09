import { useState, useEffect, useCallback } from 'react'
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Stack, 
  Chip, 
  CircularProgress,
  Alert,
  Paper,
  Avatar
} from '@mui/material'
import { 
  Notifications, 
  Info, 
  ThumbUp, 
  Announcement,
  Celebration
} from '@mui/icons-material'
import { apiClient } from '../../lib/api'
import { useUserSettings } from '../../contexts/UserSettingsContext'

type NotificationType = 'general' | 'kudos' | 'announcement' | 'welcome'

type Notification = {
  id: string
  type: NotificationType
  title: string
  message: string
  created_at: string
  read: boolean
  // Para likes
  from_user?: {
    id: string
    name: string
    avatar_url?: string
  }
  workout?: {
    id: number
    exercise_name: string
  }
  // Para anuncios generales
  priority?: 'low' | 'medium' | 'high'
}

export default function NotificationsList() {
  const { settings } = useUserSettings()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadNotifications = useCallback(async () => {
    setIsLoading(true)
    setError('')
    
    try {
      // Cargar notificaciones del usuario
      const userNotifications = await apiClient.getNotifications() as any[]
      
      // Cargar notificaciones del sistema
      const systemNotifications = await apiClient.getSystemNotifications() as any[]
      
      console.log('Notificaciones del usuario:', userNotifications)
      console.log('Notificaciones del sistema:', systemNotifications)
      
      // Combinar y transformar las notificaciones
      const allNotifications: Notification[] = [
        // Notificaciones del usuario (filtradas por configuración)
        ...(userNotifications || []).map((notif: any) => {
          console.log('Transformando notificación del usuario:', notif)
          return {
            id: notif.id.toString(),
            type: notif.type as NotificationType,
            title: notif.title,
            message: notif.message,
            created_at: notif.created_at,
            read: notif.is_read || false,
            priority: notif.priority || 'medium'
          }
        }).filter((notif: Notification) => {
          // Ocultar notificaciones de kudos si el social está deshabilitado
          if (notif.type === 'kudos' && !settings.showOwnWorkoutsInSocial) {
            return false
          }
          return true
        }),
        // Notificaciones del sistema (filtradas por configuración)
        ...(systemNotifications || []).map((notif: any) => {
          console.log('Transformando notificación del sistema:', notif)
          return {
            id: `system_${notif.id}`,
            type: notif.type as NotificationType,
            title: notif.title,
            message: notif.message,
            created_at: notif.created_at,
            read: notif.read || false,
            priority: notif.priority || 'medium'
          }
        })
      ]
      
      // Ordenar por fecha de creación (más recientes primero)
      allNotifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      
      console.log('Notificaciones finales:', allNotifications)
      setNotifications(allNotifications)
    } catch (error) {
      console.error('Error cargando notificaciones:', error)
      setError('Error al cargar las notificaciones')
    } finally {
      setIsLoading(false)
    }
  }, [settings.showOwnWorkoutsInSocial])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    )
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInMinutes < 1) {
      return 'Hace un momento'
    } else if (diffInMinutes === 1) {
      return 'Hace 1 minuto'
    } else if (diffInMinutes < 60) {
      return `Hace ${diffInMinutes} minutos`
    } else if (diffInHours === 1) {
      return 'Hace 1 hora'
    } else if (diffInHours < 24) {
      return `Hace ${diffInHours} horas`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      if (diffInDays === 1) {
        return 'Ayer'
      } else {
        return `Hace ${diffInDays} días`
      }
    }
  }

  const getNotificationIcon = (type: NotificationType, priority?: string) => {
    switch (type) {
      case 'welcome':
        return <Celebration sx={{ color: 'primary.main' }} />
      case 'announcement':
        return <Announcement sx={{ color: priority === 'high' ? 'error.main' : 'warning.main' }} />
      case 'kudos':
        return <ThumbUp sx={{ color: 'success.main' }} />
      case 'general':
        return <Info sx={{ color: 'info.main' }} />
      default:
        return <Notifications />
    }
  }

  const getNotificationColor = (type: NotificationType, priority?: string) => {
    switch (type) {
      case 'welcome':
        return 'primary'
      case 'announcement':
        return priority === 'high' ? 'error' : 'warning'
      case 'kudos':
        return 'success'
      case 'general':
        return 'info'
      default:
        return 'default'
    }
  }

  if (isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh' 
      }}>
        <CircularProgress size={60} />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Box>
    )
  }

  if (notifications?.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 4, 
            textAlign: 'center',
            backgroundColor: 'grey.50',
            borderRadius: 2
          }}
        >
          <Notifications sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No hay notificaciones
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Te notificaremos cuando haya novedades importantes
          </Typography>
        </Paper>
      </Box>
    )
  }

  const unreadCount = notifications?.filter(n => !n.read)?.length || 0

  return (
    <Box sx={{ p: 2, maxWidth: 600, mx: 'auto' }}>
      <Typography 
        variant="h4" 
        gutterBottom 
        sx={{ 
          mb: 3, 
          textAlign: 'center', 
          color: 'primary.main', 
          fontWeight: 'bold' 
        }}
      >
        Notificaciones
        {unreadCount > 0 && (
          <Chip 
            label={unreadCount} 
            color="error" 
            size="small" 
            sx={{ ml: 2, fontWeight: 'bold' }}
          />
        )}
      </Typography>

      <Stack spacing={2}>
        {notifications?.map((notification) => (
          <Card 
            key={notification.id} 
            sx={{ 
              boxShadow: notification.read ? 1 : 3,
              borderRadius: 2,
              border: '1px solid',
              borderColor: notification.read ? 'divider' : 'primary.main',
              backgroundColor: notification.read ? 'background.paper' : 'primary.50',
              opacity: notification.read ? 0.8 : 1,
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                boxShadow: 4,
                transform: 'translateY(-1px)'
              }
            }}
            onClick={() => markAsRead(notification.id)}
          >
            <CardContent sx={{ p: 3 }}>
              {/* Header con icono y fecha */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  width: 40, 
                  height: 40, 
                  borderRadius: '50%',
                  backgroundColor: `${getNotificationColor(notification.type, notification.priority)}.light`,
                  mr: 2,
                  flexShrink: 0
                }}>
                  {getNotificationIcon(notification.type, notification.priority)}
                </Box>
                
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                    {notification.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(notification.created_at)}
                  </Typography>
                </Box>

                {!notification.read && (
                  <Box sx={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    backgroundColor: 'primary.main',
                    flexShrink: 0
                  }} />
                )}
              </Box>

              {/* Mensaje */}
              <Typography variant="body1" sx={{ mb: 2 }}>
                {notification.message}
              </Typography>

              {/* Información adicional para kudos */}
              {notification.type === 'kudos' && notification.from_user && (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  p: 2, 
                  backgroundColor: 'grey.50',
                  borderRadius: 1,
                  mt: 2
                }}>
                  <Avatar 
                    src={notification.from_user.avatar_url}
                    sx={{ width: 32, height: 32, mr: 2 }}
                  >
                    {notification.from_user.name.charAt(0)}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {notification.from_user.name}
                    </Typography>
                    {notification.workout && (
                      <Typography variant="caption" color="text.secondary">
                        Ejercicio: {notification.workout.exercise_name}
                      </Typography>
                    )}
                  </Box>
                  <ThumbUp sx={{ color: 'success.main', fontSize: 20 }} />
                </Box>
              )}

              {/* Prioridad para anuncios */}
              {notification.type === 'announcement' && notification.priority && (
                <Chip 
                  label={notification.priority === 'high' ? 'Importante' : 'Información'} 
                  color={getNotificationColor(notification.type, notification.priority) as any}
                  size="small"
                  sx={{ mt: 2 }}
                />
              )}
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  )
}
