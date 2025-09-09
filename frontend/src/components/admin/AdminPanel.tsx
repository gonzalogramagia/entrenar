import { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton
} from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material'
import { AdminNotifications } from './AdminNotifications'
import { AdminExercises } from './AdminExercises'
import { AdminUsers } from './AdminUsers'
import { useAuth } from '../../contexts/AuthContext'

interface TabPanelProps {
  children?: React.ReactNode
  value: string
  tabValue: string
}

function TabPanel(props: TabPanelProps) {
  const { children, value, tabValue, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== tabValue}
      id={`admin-tabpanel-${tabValue}`}
      aria-labelledby={`admin-tab-${tabValue}`}
      {...other}
    >
      {value === tabValue && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  )
}

type AdminPanelProps = {
  open: boolean
  onClose: () => void
}

export default function AdminPanel({ open, onClose }: AdminPanelProps) {
  const [loading, setLoading] = useState(true)
  const { userRole, isAdmin } = useAuth()

  // Determinar qué pestañas están disponibles según el rol
  const getAvailableTabs = () => {
    const tabs = []
    
    if (userRole === 'admin' || userRole === 'staff' || userRole === 'profe' || isAdmin) {
      tabs.push('notifications')
    }
    if (userRole === 'admin' || userRole === 'profe' || isAdmin) {
      tabs.push('exercises')
    }
    if (userRole === 'admin' || isAdmin) {
      tabs.push('users')
    }
    
    return tabs
  }

  const availableTabs = useMemo(() => getAvailableTabs(), [userRole, isAdmin])
  const [activeTab, setActiveTab] = useState<string>(availableTabs[0] || 'notifications')

  // Si no hay pestañas disponibles, no mostrar el panel
  if (availableTabs.length === 0) {
    return null
  }

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue)
  }

  // Resetear activeTab si no está en las pestañas disponibles
  useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.includes(activeTab)) {
      console.log('🔄 AdminPanel - Reseteando activeTab de', activeTab, 'a', availableTabs[0])
      setActiveTab(availableTabs[0])
    }
  }, [availableTabs, activeTab]) // Incluir activeTab para evitar cambios innecesarios

  useEffect(() => {
    // No necesitamos verificar permisos aquí porque el usuario ya pasó la verificación del menú
    setLoading(false)
  }, [])

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '90vh',
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        bgcolor: 'primary.main',
        color: 'white',
        pb: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            {userRole === 'staff' ? '🛠️ Panel de Staff' : 
             userRole === 'profe' ? '👍 Panel de Profesor' : 
             '🛠️ Panel de Administrador'}
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
        {loading ? (
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
              Verificando permisos de administrador...
            </Typography>
          </Box>
        ) : (
          <Box sx={{ height: '100%' }}>
            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Box sx={{ 
                overflowX: 'auto',
                '&::-webkit-scrollbar': {
                  height: '8px',
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
                <Tabs 
                  value={activeTab} 
                  onChange={handleTabChange} 
                  aria-label="admin tabs"
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{
                    '& .MuiTab-root': {
                      fontSize: '1rem',
                      fontWeight: 600,
                      textTransform: 'none',
                      minHeight: 64,
                      minWidth: 'auto',
                      px: 3
                    }
                  }}
                >
                  {availableTabs.map((tab) => {
                    const tabConfig = {
                      notifications: { label: "📢 Notificaciones", value: "notifications" },
                      exercises: { label: "💪 Ejercicios", value: "exercises" },
                      users: { label: "👥 Usuarios", value: "users" }
                    }
                    
                    return (
                      <Tab 
                        key={tab}
                        label={tabConfig[tab as keyof typeof tabConfig].label}
                        value={tabConfig[tab as keyof typeof tabConfig].value}
                      />
                    )
                  })}
                </Tabs>
              </Box>
            </Box>

            {/* Tab Panels */}
            <Box sx={{ height: 'calc(100% - 64px)', overflow: 'hidden' }}>
              {availableTabs.map((tab) => {
                const panelConfig = {
                  notifications: <AdminNotifications />,
                  exercises: <AdminExercises />,
                  users: <AdminUsers />
                }
                
                return (
                  <TabPanel key={tab} value={activeTab} tabValue={tab}>
                    <Box sx={{ height: '100%' }}>
                      {panelConfig[tab as keyof typeof panelConfig]}
                    </Box>
                  </TabPanel>
                )
              })}
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}
