import { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material'
import { Search as SearchIcon, Person as PersonIcon, Delete as DeleteIcon } from '@mui/icons-material'
import { apiClient } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'

type AdminUser = {
  id: string
  email: string | null
  name: string | null
  is_admin: boolean
  role: string
  created_at: string
  last_login: string | null
  settings: {
    show_own_workouts_in_social: boolean
    unc_notifications_enabled: boolean
  } | null
}

export function AdminUsers() {
  const { isAdmin } = useAuth()
  

  
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [filterText, setFilterText] = useState('')
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ open: boolean; user: AdminUser | null }>({ open: false, user: null })
  const [updatingRole, setUpdatingRole] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const usersData = await apiClient.getAdminUsers()
      setUsers(Array.isArray(usersData) ? usersData : [])
    } catch (error) {
      console.error('Error cargando usuarios:', error)
      setError('Error al cargar los usuarios')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const weekdays = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
    
    const weekday = weekdays[date.getDay()]
    const day = date.getDate()
    const month = months[date.getMonth()]
    const year = date.getFullYear()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    
    return `${weekday} ${day} de ${month} de ${year} a las ${hours}:${minutes}`
  }

  const handleDeleteClick = (user: AdminUser) => {
    setDeleteConfirmation({ open: true, user })
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirmation.user) return
    
    try {
      setDeleting(deleteConfirmation.user.id)
      setError('') // Limpiar errores anteriores
      await apiClient.deleteAdminUser(deleteConfirmation.user.id)
      setUsers(users.filter(u => u.id !== deleteConfirmation.user!.id))
      setDeleteConfirmation({ open: false, user: null })
      setSuccess(`Usuario "${deleteConfirmation.user.name || deleteConfirmation.user.email}" eliminado exitosamente`)
      
      // Limpiar mensaje de éxito después de 5 segundos
      setTimeout(() => {
        setSuccess('')
      }, 5000)
    } catch (error) {
      console.error('Error eliminando usuario:', error)
      setError('Error al eliminar el usuario')
    } finally {
      setDeleting(null)
    }
  }

  const handleCancelDelete = () => {
    setDeleteConfirmation({ open: false, user: null })
  }

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      setUpdatingRole(userId)
      setError('') // Limpiar errores anteriores
      await apiClient.updateAdminUserRole(userId, newRole)
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ))
      
      const user = users.find(u => u.id === userId)
      setSuccess(`Rol de "${user?.name || user?.email}" actualizado a "${newRole}"`)
      
      // Limpiar mensaje de éxito después de 5 segundos
      setTimeout(() => {
        setSuccess('')
      }, 5000)
    } catch (error) {
      console.error('Error actualizando rol:', error)
      setError('Error al actualizar el rol del usuario')
    } finally {
      setUpdatingRole(null)
    }
  }

  // Filtrar usuarios por nombre, email o tipo de usuario
  const filteredUsers = (users || []).filter(user => {
    const searchText = filterText.toLowerCase()
    
    // Búsqueda por nombre o email
    const nameMatch = user.name && user.name.toLowerCase().includes(searchText)
    const emailMatch = user.email && user.email.toLowerCase().includes(searchText)
    
    // Búsqueda por tipo de usuario
    const adminMatch = searchText === 'admin' && user.is_admin
    const profeMatch = searchText === 'profe' && !user.is_admin && user.role === 'profe'
    const staffMatch = searchText === 'staff' && !user.is_admin && user.role === 'staff'
    
    return nameMatch || emailMatch || adminMatch || profeMatch || staffMatch
  })

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
          Cargando usuarios...
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
        mb: 3 
      }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
          Usuarios Registrados
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {filteredUsers.length} de {users.length} usuarios
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Success Alert */}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {/* Search Bar */}
      <TextField
        fullWidth
        placeholder="Buscar por nombre, email, tipo de usuario..."
        value={filterText}
        onChange={(e) => setFilterText(e.target.value)}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
        }}
      />

      {/* Users List */}
      <Box sx={{ 
        flex: 1,
        overflowY: 'auto',
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
          {filteredUsers.length === 0 ? (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              minHeight: '300px',
              textAlign: 'center'
            }}>
              <Typography variant="body1" color="text.secondary">
                {filterText ? 'No se encontraron usuarios que coincidan con la búsqueda' : 'No hay usuarios registrados'}
              </Typography>
            </Box>
          ) : (
            filteredUsers.map((user) => (
              <Card key={user.id} sx={{ border: '1px solid', borderColor: 'divider' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: user.is_admin ? 'primary.main' : 'grey.500', mt: 0.5 }}>
                      <PersonIcon />
                    </Avatar>
                    
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {user.name || 'Sin nombre'}
                          </Typography>
                          {user.is_admin && (
                            <Chip 
                              label="Admin" 
                              size="small" 
                              color="primary" 
                              sx={{ fontSize: '0.75rem' }}
                            />
                          )}
                          {!user.is_admin && (
                            <Chip 
                              label={user.role === 'profe' ? 'Profe' : user.role === 'staff' ? 'Staff' : 'Usuario'} 
                              size="small" 
                              color={user.role === 'profe' ? 'secondary' : user.role === 'staff' ? 'warning' : 'default'} 
                              variant="outlined"
                              sx={{ fontSize: '0.75rem' }}
                            />
                          )}
                        </Box>
                        
                        {/* User Settings */}
                        {user.settings && (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Chip 
                              label={user.settings.show_own_workouts_in_social ? "Social activado" : "Social desactivado"}
                              size="small"
                              color={user.settings.show_own_workouts_in_social ? "success" : "default"}
                              variant="outlined"
                              sx={{ fontSize: '0.7rem' }}
                            />
                            <Chip 
                              label={user.settings.unc_notifications_enabled ? "Notificaciones activadas" : "Notificaciones desactivadas"}
                              size="small"
                              color={user.settings.unc_notifications_enabled ? "success" : "default"}
                              variant="outlined"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          </Box>
                        )}
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {user.email}
                      </Typography>

                      {/* Role Selection and Delete Button */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                          <InputLabel>Rol</InputLabel>
                          <Select
                            value={user.role}
                            label="Rol"
                            onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                            disabled={updatingRole === user.id}
                          >
                            <MenuItem value="user">Usuario</MenuItem>
                            <MenuItem value="profe">Profe</MenuItem>
                            <MenuItem value="staff">Staff</MenuItem>
                          </Select>
                        </FormControl>

                        {isAdmin && (
                          <IconButton
                            onClick={() => handleDeleteClick(user)}
                            disabled={deleting === user.id}
                            color="error"
                            size="small"
                          >
                            {deleting === user.id ? (
                              <CircularProgress size={16} />
                            ) : (
                              <DeleteIcon />
                            )}
                          </IconButton>
                        )}
                      </Box>

                      {/* Registration and Last Login Info */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          Registrado el {formatDate(user.created_at)}
                        </Typography>
                        
                        {user.last_login && (
                          <Typography variant="caption" color="text.secondary">
                            Último acceso: {formatDate(user.last_login)}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))
          )}
        </Stack>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmation.open} onClose={handleCancelDelete}>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que quieres eliminar al usuario{' '}
            <strong>{deleteConfirmation.user?.name || deleteConfirmation.user?.email}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Esta acción no se puede deshacer y eliminará todos los datos del usuario.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete}>Cancelar</Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error" 
            variant="contained"
            disabled={deleting === deleteConfirmation.user?.id}
          >
            {deleting === deleteConfirmation.user?.id ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
