import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Stack,
  IconButton
} from '@mui/material'
import {
  Add as AddIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  History as HistoryIcon
} from '@mui/icons-material'
import { apiClient } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'

type AdminNotification = {
  id: number
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
  created_at: string
  updated_at: string
  created_by: string
  updated_by: string
}

type NotificationHistory = {
  id: number
  notification_id: number
  action: 'created' | 'updated'
  old_title?: string
  new_title?: string
  old_message?: string
  new_message?: string
  old_type?: string
  new_type?: string
  changed_by: string
  changed_at: string
}

type CreateNotificationForm = {
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
}

const notificationTypeIcons = {
  info: <InfoIcon sx={{ color: 'info.main' }} />,
  warning: <WarningIcon sx={{ color: 'warning.main' }} />,
  success: <SuccessIcon sx={{ color: 'success.main' }} />,
  error: <ErrorIcon sx={{ color: 'error.main' }} />
}



export function AdminNotifications() {
  const { userRole, isAdmin } = useAuth()
  
  // Debug: verificar permisos
  console.log('🔧 AdminNotifications - userRole:', userRole, 'isAdmin:', isAdmin)
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ show: boolean; id: number | null }>({ show: false, id: null })
  const [filterText, setFilterText] = useState('')
  const [editingNotification, setEditingNotification] = useState<AdminNotification | null>(null)
  const [updating, setUpdating] = useState(false)
  const [historyModal, setHistoryModal] = useState<{ show: boolean; notificationId: number | null }>({ show: false, notificationId: null })
  const [history, setHistory] = useState<NotificationHistory[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [form, setForm] = useState<CreateNotificationForm>({
    title: '',
    message: '',
    type: 'info'
  })

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiClient.getAdminNotifications() as AdminNotification[]
      setNotifications(data || [])
      setError('')
    } catch (error) {
      console.error('Error cargando notificaciones:', error)
      setError('Error al cargar las notificaciones')
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  const handleCreateNotification = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      setError('El título y mensaje son requeridos')
      return
    }

    try {
      setCreating(true)
      setError('') // Limpiar errores anteriores
      setSuccess('') // Limpiar mensajes de éxito anteriores
      
      await apiClient.createAdminNotification(form)
      setForm({
        title: '',
        message: '',
        type: 'info'
      })
      setOpenDialog(false)
      setSuccess('Notificación creada exitosamente')
      await loadNotifications() // Recargar lista
    } catch (error: any) {
      console.error('Error creando notificación:', error)
      const errorMessage = error?.response?.data?.message || error?.message || 'Error al crear la notificación'
      setError(errorMessage)
    } finally {
      setCreating(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const weekdays = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
    
    const weekday = weekdays[date.getDay()]
    const day = date.getDate()
    const month = months[date.getMonth()]
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    
    return `${weekday} ${day} de ${month} a las ${hours}:${minutes}`
  }

  // Filtrar notificaciones por título o mensaje
  const filteredNotifications = (notifications || []).filter(notification =>
    notification.title.toLowerCase().includes(filterText.toLowerCase()) ||
    notification.message.toLowerCase().includes(filterText.toLowerCase())
  )

  const handleDeleteClick = (id: number) => {
    setDeleteConfirmation({ show: true, id })
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirmation.id) return

    try {
      setDeleting(deleteConfirmation.id)
      await apiClient.deleteAdminNotification(deleteConfirmation.id)
      await loadNotifications() // Recargar lista
    } catch (error) {
      console.error('Error eliminando notificación:', error)
      setError('Error al eliminar la notificación')
    } finally {
      setDeleting(null)
      setDeleteConfirmation({ show: false, id: null })
    }
  }

  const handleCancelDelete = () => {
    setDeleteConfirmation({ show: false, id: null })
  }

  const handleEditClick = (notification: AdminNotification) => {
    setEditingNotification(notification)
  }

  const handleUpdateNotification = async () => {
    if (!editingNotification) return

    try {
      setUpdating(true)
      const updatedNotification = await apiClient.updateAdminNotification(editingNotification.id, {
        title: editingNotification.title,
        message: editingNotification.message,
        type: editingNotification.type
      })
      
      // Actualizar la lista local
      setNotifications(prev => 
        prev.map(n => n.id === editingNotification.id ? updatedNotification as AdminNotification : n)
      )
      setEditingNotification(null)
    } catch (error) {
      console.error('Error actualizando notificación:', error)
      setError('Error al actualizar la notificación')
    } finally {
      setUpdating(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingNotification(null)
  }

  const handleViewHistory = async (notificationId: number) => {
    try {
      setLoadingHistory(true)
      setError('') // Limpiar errores anteriores
      const historyData = await apiClient.getNotificationHistory(notificationId)
      setHistory(Array.isArray(historyData) ? historyData : [])
      setHistoryModal({ show: true, notificationId })
    } catch (error) {
      console.error('Error cargando historial:', error)
      setError('Error al cargar el historial')
      setHistory([]) // Asegurar que history sea un array vacío en caso de error
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleCloseHistory = () => {
    setHistoryModal({ show: false, notificationId: null })
    setHistory([])
  }

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress size={60} thickness={4} sx={{ color: 'primary.main' }} />
        <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
          Cargando notificaciones...
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ 
      maxWidth: '900px', 
      mx: 'auto',
      px: { xs: 2, sm: 3, md: 4 },
      height: 'calc(100vh - 300px)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        pt: 2 // Padding superior para bajar el contenido
      }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
          Todas los Avisos
        </Typography>
        {/* Solo mostrar botón de agregar para admin y staff */}
        {(userRole === 'admin' || userRole === 'staff' || isAdmin) && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
            sx={{ 
              fontWeight: 600,
              // En mobile, solo mostrar el ícono
              '@media (max-width: 767px)': {
                minWidth: 'auto',
                px: 1,
                '& .MuiButton-startIcon': {
                  margin: 0
                }
              }
            }}
          >
            <Box sx={{ 
              display: { xs: 'none', sm: 'inline' } // Ocultar texto en mobile
            }}>
              Agregar
            </Box>
          </Button>
        )}
      </Box>

      {/* Filter */}
      <TextField
        fullWidth
        placeholder="Buscar notificaciones por título o mensaje..."
        value={filterText}
        onChange={(e) => setFilterText(e.target.value)}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
        }}
      />

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Success Alert */}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Notifications List */}
      <Box sx={{ 
        flex: 1,
        overflowY: 'auto',
        pr: 1,
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: '#f1f1f1',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#c1c1c1',
          borderRadius: '4px',
          '&:hover': {
            background: '#a8a8a8',
          },
        },
      }}>
        <Stack spacing={2} sx={{ pb: 3 }}>
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  {filterText ? 'No se encontraron notificaciones con ese texto' : 'No hay notificaciones creadas'}
                </Typography>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notification) => (
            <Card key={notification.id} sx={{ 
              border: '1px solid',
              borderColor: 'divider',
              '&:hover': {
                boxShadow: 2,
                transform: 'translateY(-1px)',
                transition: 'all 0.2s ease-in-out'
              }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  {/* Icon */}
                  <Box sx={{ mt: 0.5 }}>
                    {notificationTypeIcons[notification.type]}
                  </Box>

                  {/* Content */}
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {notification.title}
                      </Typography>
                    </Box>
                    
                    <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                      {notification.message}
                    </Typography>

                    {/* Action Buttons - Ahora debajo del texto */}
                    <Box sx={{ 
                      display: 'flex', 
                      gap: 1, 
                      mb: 2,
                      // En mobile, los botones van debajo del título
                      '@media (max-width: 767px)': {
                        alignSelf: 'flex-start'
                      }
                    }}>
                      <IconButton
                        onClick={() => handleViewHistory(notification.id)}
                        disabled={loadingHistory}
                        size="small"
                        sx={{
                          color: 'info.main',
                          '&:hover': {
                            backgroundColor: 'info.light',
                            color: 'white'
                          }
                        }}
                      >
                        {loadingHistory && historyModal.notificationId === notification.id ? (
                          <CircularProgress size={16} />
                        ) : (
                          <HistoryIcon />
                        )}
                      </IconButton>
                      
                      <IconButton
                        onClick={() => handleEditClick(notification)}
                        size="small"
                        sx={{
                          color: 'primary.main',
                          '&:hover': {
                            backgroundColor: 'primary.light',
                            color: 'white'
                          }
                        }}
                      >
                        <EditIcon />
                      </IconButton>

                      {/* Solo mostrar botón de eliminar para admin */}
                      {(userRole === 'admin' || isAdmin) && (
                        <IconButton
                          onClick={() => handleDeleteClick(notification.id)}
                          disabled={deleting === notification.id}
                          size="small"
                          sx={{
                            color: 'error.main',
                            '&:hover': {
                              backgroundColor: 'error.light',
                              color: 'white'
                            }
                          }}
                        >
                          {deleting === notification.id ? (
                            <CircularProgress size={16} />
                          ) : (
                            <DeleteIcon />
                          )}
                        </IconButton>
                      )}
                    </Box>

                    <Typography variant="caption" color="text.secondary">
                      {notification.updated_at !== notification.created_at 
                        ? `Actualizada el ${formatDate(notification.updated_at)} por ${notification.updated_by}`
                        : `Creada el ${formatDate(notification.created_at)} por ${notification.created_by}`
                      }
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))
        )}
      </Stack>
      </Box>

      {/* Create Notification Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          fontWeight: 'bold'
        }}>
          <AddIcon sx={{ color: 'primary.main' }} />
          Agregar Notificación
        </DialogTitle>
        
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Título"
              value={form.title}
              onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
              fullWidth
              required
              placeholder="Ej: Mantenimiento programado"
            />

            <TextField
              label="Mensaje"
              value={form.message}
              onChange={(e) => setForm(prev => ({ ...prev, message: e.target.value }))}
              fullWidth
              required
              multiline
              rows={4}
              placeholder="Describe el mensaje de la notificación..."
            />

            <FormControl fullWidth>
              <InputLabel>Tipo de Notificación</InputLabel>
              <Select
                value="info"
                disabled
                label="Tipo de Notificación"
              >
                <MenuItem value="info">Información</MenuItem>
              </Select>
            </FormControl>


          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={() => setOpenDialog(false)}
            disabled={creating}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateNotification}
            disabled={creating || !form.title.trim() || !form.message.trim()}
            startIcon={creating ? <CircularProgress size={16} /> : undefined}
          >
            {creating ? 'Creando...' : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de confirmación de eliminación */}
      <Dialog
        open={deleteConfirmation.show}
        onClose={handleCancelDelete}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            border: '1px solid',
            borderColor: 'divider'
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 1,
          fontWeight: 600,
          fontSize: '1.2rem',
          color: 'error.main',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          Confirmar eliminación
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body1" sx={{ pt: 2 }}>
            ¿Estás seguro de que quieres eliminar esta notificación? Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={handleCancelDelete}
            disabled={deleting !== null}
            sx={{
              px: 3,
              py: 1,
              borderRadius: 2,
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '0.95rem',
              color: 'text.secondary',
              border: '1px solid',
              borderColor: 'divider',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)'
              }
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmDelete}
            disabled={deleting !== null}
            variant="contained"
            color="error"
            sx={{
              px: 4,
              py: 1,
              borderRadius: 2,
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '0.95rem',
              '&:hover': {
                backgroundColor: '#d32f2f'
              }
            }}
          >
            {deleting !== null ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de edición */}
      <Dialog
        open={!!editingNotification}
        onClose={handleCancelEdit}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          fontWeight: 'bold'
        }}>
          <EditIcon sx={{ color: 'primary.main' }} />
          Editar Notificación
        </DialogTitle>
        
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Título"
              value={editingNotification?.title || ''}
              onChange={(e) => setEditingNotification(prev => prev ? { ...prev, title: e.target.value } : null)}
              fullWidth
              required
              placeholder="Ej: Mantenimiento programado"
            />

            <TextField
              label="Mensaje"
              value={editingNotification?.message || ''}
              onChange={(e) => setEditingNotification(prev => prev ? { ...prev, message: e.target.value } : null)}
              fullWidth
              required
              multiline
              rows={4}
              placeholder="Describe el mensaje de la notificación..."
            />

            <FormControl fullWidth>
              <InputLabel>Tipo de Notificación</InputLabel>
              <Select
                value="info"
                disabled
                label="Tipo de Notificación"
              >
                <MenuItem value="info">Información</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={handleCancelEdit}
            disabled={updating}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdateNotification}
            disabled={updating || !editingNotification?.title.trim() || !editingNotification?.message.trim()}
            startIcon={updating ? <CircularProgress size={16} /> : undefined}
          >
            {updating ? 'Actualizando...' : 'Confirmar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de historial */}
      <Dialog
        open={historyModal.show}
        onClose={handleCloseHistory}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          fontWeight: 'bold'
        }}>
          <HistoryIcon sx={{ color: 'info.main' }} />
          Historial de Cambios
        </DialogTitle>
        
        <DialogContent>
          {loadingHistory ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={40} />
            </Box>
          ) : !history || history.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                No hay historial de cambios disponible
              </Typography>
            </Box>
          ) : (
            <Box sx={{ maxHeight: '400px', overflowY: 'auto' }}>
              <Stack spacing={2} sx={{ mt: 1 }}>
                {history?.map((record) => (
                  <Card key={record.id} sx={{ border: '1px solid', borderColor: 'divider' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {record.action === 'created' ? 'Creada' : 'Actualizada'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          por {record.changed_by}
                        </Typography>
                      </Box>
                      
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        {formatDate(record.changed_at)}
                      </Typography>

                      {record.action === 'updated' && (
                        <Box sx={{ mt: 2 }}>
                          {record.old_title !== record.new_title && (
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                                Se editó el Título
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                Antes: {record.old_title}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                Después: {record.new_title}
                              </Typography>
                            </Box>
                          )}
                          {record.old_message !== record.new_message && (
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                                Se editó el Mensaje
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                Antes: {record.old_message}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                Después: {record.new_message}
                              </Typography>
                            </Box>
                          )}
                          {record.old_type !== record.new_type && (
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                                Se editó el Tipo
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                Antes: {record.old_type}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                Después: {record.new_type}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={handleCloseHistory}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
