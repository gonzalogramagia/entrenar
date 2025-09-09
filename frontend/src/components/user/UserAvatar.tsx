import React, { useState } from 'react'
import {
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Box,
  IconButton,
  Badge
} from '@mui/material'
import { Logout as LogoutIcon, Settings as SettingsIcon, AdminPanelSettings as AdminIcon, Notifications as NotificationsIcon } from '@mui/icons-material'
import { useAuth } from '../../contexts/AuthContext'
// import { useUserSettings } from '../../contexts/UserSettingsContext' // Ya no se usa

type UserAvatarProps = {
  onOpenSettings?: () => void
  onOpenNotifications?: () => void
  onOpenAdminPanel?: () => void
  unreadNotifications?: number
}

export default function UserAvatar({ onOpenSettings, onOpenNotifications, onOpenAdminPanel, unreadNotifications = 0 }: UserAvatarProps) {
  const { user, logout, isAdmin, userRole } = useAuth()
  // const { settings } = useUserSettings() // Ya no se usa
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = async () => {
    handleClose()
    await logout()
  }

  const handleOpenSettings = () => {
    handleClose()
    if (onOpenSettings) {
      onOpenSettings()
    }
  }

  const handleOpenNotifications = () => {
    handleClose()
    if (onOpenNotifications) {
      onOpenNotifications()
    }
  }

  const handleOpenAdminPanel = () => {
    handleClose()
    if (onOpenAdminPanel) {
      onOpenAdminPanel()
    }
  }

  // Función para obtener iniciales del usuario
  const getUserInitials = () => {
    if (!user?.email) return 'U'
    
    if (user.user_metadata?.full_name) {
      return user.user_metadata.full_name
        .split(' ')
        .map((word: string) => word[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    }
    
    return user.email[0].toUpperCase()
  }

  // URL del avatar del usuario (Google OAuth)
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture

  return (
    <>
      <IconButton
        onClick={handleClick}
        size="small"
        sx={{ ml: 2 }}
        aria-controls={open ? 'account-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
      >
        <Badge 
          badgeContent={unreadNotifications} 
          sx={{
            '& .MuiBadge-badge': {
              fontSize: '0.7rem',
              minWidth: '18px',
              height: '18px',
              backgroundColor: '#ff9800',
              color: 'white'
            }
          }}
          invisible={unreadNotifications === 0}
        >
          <Avatar
            sx={{ 
              width: 32, 
              height: 32,
              bgcolor: avatarUrl ? 'transparent' : 'primary.main',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
            src={avatarUrl}
          >
            {!avatarUrl && getUserInitials()}
          </Avatar>
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleClose}
        PaperProps={{
          elevation: 3,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            minWidth: 200,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* Información del usuario */}
        <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #e0e0e0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Avatar
              sx={{ 
                width: 40, 
                height: 40,
                mr: 1.5,
                bgcolor: avatarUrl ? 'transparent' : 'primary.main'
              }}
              src={avatarUrl}
            >
              {!avatarUrl && getUserInitials()}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider />

        {/* Opción de Panel de Admin - se muestra si el usuario es administrador, profe o staff */}
        {(isAdmin || userRole === 'profe' || userRole === 'staff') && (
          <MenuItem onClick={handleOpenAdminPanel}>
            <ListItemIcon>
              <AdminIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>
              {userRole === 'profe' ? 'Panel de Profe' : 
               userRole === 'staff' ? 'Panel de Staff' : 
               'Panel de Admin'}
            </ListItemText>
          </MenuItem>
        )}

        {/* Opción de notificaciones - siempre visible */}
        <MenuItem onClick={handleOpenNotifications}>
          <ListItemIcon>
            <Box sx={{ position: 'relative' }}>
              <NotificationsIcon fontSize="small" />
              {unreadNotifications > 0 && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    backgroundColor: '#ff9800',
                    color: 'white',
                    borderRadius: '50%',
                    minWidth: '16px',
                    height: '16px',
                    fontSize: '0.6rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold'
                  }}
                >
                  {unreadNotifications}
                </Box>
              )}
            </Box>
          </ListItemIcon>
          <ListItemText>
            Notificaciones
          </ListItemText>
        </MenuItem>

        {/* Opción de configuración - solo para admins, profe y staff */}
        {(isAdmin || userRole === 'profe' || userRole === 'staff') && (
          <MenuItem onClick={handleOpenSettings}>
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Configuración</ListItemText>
          </MenuItem>
        )}

        {/* Opción de logout */}
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Cerrar Sesión</ListItemText>
        </MenuItem>
      </Menu>
    </>
  )
}
