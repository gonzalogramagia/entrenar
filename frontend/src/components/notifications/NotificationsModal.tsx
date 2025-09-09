import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Box,
  Card,
  CardContent,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  Paper,
  Avatar,
  IconButton,
  Button
} from '@mui/material'
import { 
  Notifications, 
  ThumbUp, 
  Announcement,
  Close,
  CheckCircleOutline,
  Celebration
} from '@mui/icons-material'
import { apiClient } from '../../lib/api'
import { useUserSettings } from '../../contexts/UserSettingsContext'

type NotificationType = 'kudos' | 'announcement' | 'workout_created' | 'welcome'

type Notification = {
  id: number
  type: NotificationType
  title: string
  message: string
  created_at: string
  is_read: boolean
  data?: any
  // Para kudos agrupados
  from_users?: {
    id: string
    name: string
    avatar_url?: string
  }[]
  workout?: {
    id: number
    exercise_name: string
    date: string
  }
  // Para anuncios generales
  priority?: 'low' | 'medium' | 'high'
}

type NotificationsModalProps = {
  open: boolean
  onClose: () => void
  onMarkAsRead: (count: number) => void
}

export default function NotificationsModal({ open, onClose, onMarkAsRead }: NotificationsModalProps) {
  const { settings } = useUserSettings()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadNotifications = useCallback(async () => {
    setIsLoading(true)
    setError('')
    
    try {
      const notificationsData = await apiClient.getNotifications() as Notification[]
      
      // Filtrar notificaciones basándose en la configuración del usuario
      const filteredNotifications = (notificationsData || []).filter((notif: Notification) => {
        // Ocultar notificaciones de kudos si el social está deshabilitado
        if (notif.type === 'kudos' && !settings.showOwnWorkoutsInSocial) {
          return false
        }
        return true
      })
      
      setNotifications(filteredNotifications)
    } catch (error) {
      console.error('Error cargando notificaciones:', error)
      setError('Error al cargar las notificaciones')
    } finally {
      setIsLoading(false)
    }
  }, [settings.showOwnWorkoutsInSocial])

  useEffect(() => {
    if (open) {
      loadNotifications()
    }
  }, [open, loadNotifications])

  const markAsRead = async (notificationId: number) => {
    try {
      const notification = notifications.find(n => n.id === notificationId)
      if (notification && !notification.is_read) {
        await apiClient.markNotificationAsRead(notificationId)
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, is_read: true }
              : notif
          )
        )
        onMarkAsRead(1)
      }
    } catch (error) {
      console.error('Error marcando notificación como leída:', error)
      setError('Error al marcar la notificación como leída')
    }
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

  const formatWorkoutDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', { 
      weekday: 'long',
      day: 'numeric', 
      month: 'long'
    })
  }

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'welcome':
        return <Celebration sx={{ color: 'primary.main', fontSize: 28 }} />
      case 'announcement':
        return <Announcement sx={{ color: '#ff9800', fontSize: 28 }} />
      case 'kudos':
        return <ThumbUp sx={{ color: 'success.main', fontSize: 28 }} />
      default:
        return <Notifications sx={{ fontSize: 28 }} />
    }
  }



  const unreadCount = notifications?.filter(n => !n.is_read)?.length || 0

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          maxHeight: '80vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        pb: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Notifications sx={{ color: 'grey.600' }} />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Notificaciones
          </Typography>
          {unreadCount > 0 && (
            <Chip 
              label={unreadCount} 
              size="small"
              sx={{ 
                ml: 1, 
                fontWeight: 'bold',
                backgroundColor: '#ff9800',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#f57c00'
                }
              }}
            />
          )}
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2, px: 3, pb: 3 }}>
        {isLoading ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '200px' 
          }}>
            <CircularProgress size={40} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : notifications?.length === 0 ? (
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
        ) : (
          <Stack spacing={2} sx={{ maxWidth: 600, mx: 'auto', mt: 2 }}>
            {notifications?.map((notification) => (
              <Card 
                key={notification.id} 
                sx={{ 
                  boxShadow: notification.is_read ? 1 : 3,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: notification.is_read ? 'divider' : 'divider',
                  backgroundColor: notification.is_read ? 'background.paper' : '#fff3e0',
                  opacity: notification.is_read ? 0.8 : 1,
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
                      width: 63, 
                      height: 63, 
                      borderRadius: '50%',
                      backgroundColor: notification.type === 'welcome' ? 'primary.50' : 
                                      notification.type === 'announcement' ? 'warning.50' : 
                                      notification.type === 'kudos' ? 'success.50' : 'grey.50',
                      flexShrink: 0
                    }}>
                      {getNotificationIcon(notification.type)}
                    </Box>
                    
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                        {notification.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(notification.created_at)}
                      </Typography>
                    </Box>


                  </Box>

                  {/* Mensaje */}
                  <Typography variant="body1" sx={{ px: 1.875, mb: 0.875 }}>
                    {notification.message}
                  </Typography>

                  {/* Información adicional para kudos */}
                  {notification.type === 'kudos' && notification.from_users && notification.workout && (
                    <Box sx={{ 
                      p: 2, 
                      backgroundColor: 'grey.50',
                      borderRadius: 1,
                      mt: 2
                    }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                        Entrenamiento: {notification.workout.exercise_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                        {formatWorkoutDate(notification.workout.date)}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Kudos de:
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {notification.from_users.map((user) => (
                            <Avatar 
                              key={user.id}
                              src={user.avatar_url}
                              sx={{ 
                                width: 24, 
                                height: 24,
                                fontSize: '0.7rem',
                                border: '1px solid white'
                              }}
                            >
                              {user.name.charAt(0)}
                            </Avatar>
                          ))}
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ThumbUp sx={{ color: 'success.main', fontSize: 16 }} />
                        <Typography variant="caption" color="text.secondary">
                          {notification.from_users.length} kudos
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  {/* Botón marcar como leída */}
                  {!notification.is_read && (
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      mt: 2 
                    }}>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<CheckCircleOutline />}
                        onClick={(e) => {
                          e.stopPropagation()
                          markAsRead(notification.id)
                        }}
                        sx={{
                          fontSize: '0.75rem',
                          py: 0.5,
                          px: 1.5,
                          backgroundColor: '#ff9800',
                          color: 'white',
                          '&:hover': {
                            backgroundColor: '#f57c00'
                          }
                        }}
                      >
                        Marcar como leída
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  )
}
