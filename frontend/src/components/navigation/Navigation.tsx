import { useState, useRef, useEffect } from 'react'
import { 
  Box, 
  IconButton, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText,
  AppBar,
  Toolbar,
  Typography,
  Collapse,
  Fade
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import CloseIcon from '@mui/icons-material/Close'
import HistoryIcon from '@mui/icons-material/History'
import AllInclusiveIcon from '@mui/icons-material/AllInclusive'
import PeopleIcon from '@mui/icons-material/People'
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter'
import UserAvatar from '../user/UserAvatar'
import { TABS, type TabType } from '../../constants/tabs'


type NavigationProps = {
  activeTab: TabType
  onTabChange: (newValue: TabType) => void
  onLogout: () => void
  onOpenSettings?: () => void
  onOpenNotifications?: () => void
  onOpenAdminPanel?: () => void
  unreadNotifications?: number
}

export default function Navigation({ activeTab, onTabChange, onOpenSettings, onOpenNotifications, onOpenAdminPanel, unreadNotifications = 0 }: Omit<NavigationProps, 'onLogout'>) {

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [visibleItems, setVisibleItems] = useState<number[]>([])
  const [showToolbarElements, setShowToolbarElements] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const timeoutsRef = useRef<number[]>([])
  const menuRef = useRef<HTMLDivElement>(null)



  // Limpiar timeouts cuando el componente se desmonte
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout)
    }
  }, [])

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (drawerOpen && menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setDrawerOpen(false)
        setVisibleItems([])
      }
    }

    if (drawerOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [drawerOpen])

  // Mostrar elementos de la barra al cargar
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowToolbarElements(true)
    }, 50) as unknown as number
    timeoutsRef.current.push(timer)
    
    return () => clearTimeout(timer)
  }, [])

  // Animar elementos de la barra cuando cambie el tab
  useEffect(() => {
    setShowToolbarElements(false)
    const timer = setTimeout(() => {
      setShowToolbarElements(true)
    }, 80) as unknown as number
    timeoutsRef.current.push(timer)
    
    return () => clearTimeout(timer)
  }, [activeTab])

  const handleDrawerToggle = () => {
    // Limpiar timeouts existentes
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
    
    if (!drawerOpen) {
      setDrawerOpen(true)
      setIsClosing(false)
      // Animación escalonada: mostrar items uno por uno
      setVisibleItems([])
      menuItems.forEach((_, index) => {
        const timeoutId = setTimeout(() => {
          setVisibleItems(prev => [...prev, index])
        }, index * 80) as unknown as number // 80ms entre cada item
        timeoutsRef.current.push(timeoutId)
      })
    } else {
      setIsClosing(true)
      // Animación de cierre escalonada más rápida
      const reversedItems = [...visibleItems].reverse()
      reversedItems.forEach((_, index) => {
        const timeoutId = setTimeout(() => {
          setVisibleItems(prev => prev.slice(0, -1))
        }, index * 20) as unknown as number // 20ms entre cada item (más rápido)
        timeoutsRef.current.push(timeoutId)
      })
      
      // Cerrar el menú después de la animación
      setTimeout(() => {
        setDrawerOpen(false)
        setIsClosing(false)
      }, reversedItems.length * 20 + 100) // 100ms adicionales (más rápido)
    }
  }

  const handleTabChange = (newValue: TabType) => {
    onTabChange(newValue)
    setIsClosing(true)
    // Animación de cierre escalonada más rápida
    const reversedItems = [...visibleItems].reverse()
    reversedItems.forEach((_, index) => {
      const timeoutId = setTimeout(() => {
        setVisibleItems(prev => prev.slice(0, -1))
      }, index * 20) as unknown as number // 20ms entre cada item (más rápido)
      timeoutsRef.current.push(timeoutId)
    })
    
    // Cerrar el menú después de la animación
    setTimeout(() => {
      setDrawerOpen(false)
      setIsClosing(false)
    }, reversedItems.length * 20 + 100) // 100ms adicionales (más rápido)
  }

  const menuItems = [
    { label: 'Registrar', icon: <AllInclusiveIcon />, value: TABS.WORKOUT },
    { label: 'Mis Rutinas', icon: <HistoryIcon />, value: TABS.ROUTINES },
    { label: 'Entrenamientos', icon: <FitnessCenterIcon />, value: TABS.HISTORY },
    { label: 'Feed Social', icon: <PeopleIcon />, value: TABS.SOCIAL },
  ]

  return (
    <Box sx={{ 
      position: 'relative',
      zIndex: 99998,
      '@keyframes slideInFromLeft': {
        '0%': {
          transform: 'translateX(-60px)',
          opacity: 0
        },
        '30%': {
          transform: 'translateX(-40px)',
          opacity: 0.1
        },
        '60%': {
          transform: 'translateX(-10px)',
          opacity: 0.4
        },
        '85%': {
          transform: 'translateX(8px)',
          opacity: 0.8
        },
        '100%': {
          transform: 'translateX(0)',
          opacity: 1
        }
      },
      '@keyframes slideInFromTop': {
        '0%': {
          transform: 'translateY(-30px)',
          opacity: 0
        },
        '30%': {
          transform: 'translateY(-20px)',
          opacity: 0.1
        },
        '60%': {
          transform: 'translateY(-5px)',
          opacity: 0.4
        },
        '85%': {
          transform: 'translateY(4px)',
          opacity: 0.8
        },
        '100%': {
          transform: 'translateY(0)',
          opacity: 1
        }
      },
      '@keyframes slideInFromRight': {
        '0%': {
          transform: 'translateX(60px)',
          opacity: 0
        },
        '30%': {
          transform: 'translateX(40px)',
          opacity: 0.1
        },
        '60%': {
          transform: 'translateX(10px)',
          opacity: 0.4
        },
        '85%': {
          transform: 'translateX(-6px)',
          opacity: 0.8
        },
        '100%': {
          transform: 'translateX(0)',
          opacity: 1
        }
      },
      '@keyframes slideOutToLeft': {
        '0%': {
          transform: 'translateX(0)',
          opacity: 1
        },
        '15%': {
          transform: 'translateX(-6px)',
          opacity: 0.8
        },
        '40%': {
          transform: 'translateX(-10px)',
          opacity: 0.4
        },
        '70%': {
          transform: 'translateX(-40px)',
          opacity: 0.1
        },
        '100%': {
          transform: 'translateX(-60px)',
          opacity: 0
        }
      },
      '@keyframes slideOutToTop': {
        '0%': {
          transform: 'translateY(0)',
          opacity: 1
        },
        '15%': {
          transform: 'translateY(4px)',
          opacity: 0.8
        },
        '40%': {
          transform: 'translateY(-5px)',
          opacity: 0.4
        },
        '70%': {
          transform: 'translateY(-20px)',
          opacity: 0.1
        },
        '100%': {
          transform: 'translateY(-30px)',
          opacity: 0
        }
      },
      '@keyframes slideOutToRight': {
        '0%': {
          transform: 'translateX(0)',
          opacity: 1
        },
        '15%': {
          transform: 'translateX(8px)',
          opacity: 0.8
        },
        '40%': {
          transform: 'translateX(-10px)',
          opacity: 0.4
        },
        '70%': {
          transform: 'translateX(-40px)',
          opacity: 0.1
        },
        '100%': {
          transform: 'translateX(-60px)',
          opacity: 0
        }
      }
    }}>
      <AppBar position="static" sx={{ backgroundColor: '#1976d2' }}>
        <Toolbar>
          {showToolbarElements && (
            <Box sx={{ 
              transform: 'translateX(0)',
              transition: 'all 0.3s ease-in-out',
              animation: isClosing ? 'slideOutToLeft 0.3s ease-out' : 'slideInFromLeft 0.3s ease-out'
            }}>
              <IconButton
                color="inherit"
                aria-label={drawerOpen ? "cerrar menú" : "abrir menú"}
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2 }}
              >
                {drawerOpen ? <CloseIcon /> : <MenuIcon />}
              </IconButton>
            </Box>
          )}
          
          {showToolbarElements && (
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                flexGrow: 1, 
                textAlign: 'center',
                fontWeight: 'bold',
                transform: 'translateY(0)',
                transition: 'all 0.3s ease-in-out',
                animation: 'slideInFromTop 0.3s ease-out'
              }}
            >
              entrenar.app
            </Typography>
          )}
          
          {showToolbarElements && (
            <Box sx={{ 
              transform: 'translateX(0)',
              transition: 'all 0.3s ease-in-out',
              animation: 'slideInFromRight 0.3s ease-out'
            }}>
                              <UserAvatar 
                  onOpenSettings={onOpenSettings} 
                  onOpenNotifications={onOpenNotifications}
                  onOpenAdminPanel={onOpenAdminPanel}
                  unreadNotifications={unreadNotifications}
                />
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Collapse in={drawerOpen} timeout="auto" unmountOnExit>
        <Box 
          ref={menuRef}
          sx={{ 
            backgroundColor: '#1976d2',
            color: 'white',
            width: '100%',
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 9999,
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }} 
          role="presentation"
        >

          <List>
            {menuItems.map((item, index) => (
              <Fade 
                key={item.value} 
                in={visibleItems.includes(index)} 
                timeout={300}
                style={{ transitionDelay: `${index * 50}ms` }}
              >
                <ListItem disablePadding>
                  <ListItemButton 
                    selected={activeTab === item.value}
                    onClick={() => handleTabChange(item.value)}
                    sx={{
                      color: 'white',
                      transform: visibleItems.includes(index) ? 'translateY(0)' : 'translateY(-15px)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: '#1565c0',
                      },
                      '&.Mui-selected': {
                        backgroundColor: '#1565c0',
                        '&:hover': {
                          backgroundColor: '#0d47a1',
                        },
                      },
                    }}
                  >
                    <ListItemIcon sx={{ color: 'white' }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.label}
                      sx={{ 
                        color: 'white',
                        fontWeight: activeTab === item.value ? 'bold' : 'normal'
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              </Fade>
            ))}
          </List>
        </Box>
      </Collapse>
    </Box>
  )
}
