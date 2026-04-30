import React from 'react'
import { Fab, Box } from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material'
import { useTab } from '../../contexts/TabContext'
import { TABS } from '../../constants/tabs'

const FloatingNavButtons: React.FC = () => {
  const { activeTab, setActiveTab } = useTab()

  // Mapeo de navegación según las especificaciones
  const getNavigationButtons = () => {
    switch (activeTab) {
      case TABS.WORKOUT:
        return {
          left: { tab: TABS.ROUTINES, icon: <ArrowBackIcon />, tooltip: 'Ir a Mis Rutinas' },
          right: { tab: TABS.HISTORY, icon: <ArrowForwardIcon />, tooltip: 'Ir a Mis Entrenamientos' }
        }
      case TABS.HISTORY:
        return {
          left: { tab: TABS.WORKOUT, icon: <ArrowBackIcon />, tooltip: 'Ir a Registro' },
          right: { tab: TABS.ROUTINES, icon: <ArrowForwardIcon />, tooltip: 'Ir a Mis Rutinas' }
        }
      case TABS.ROUTINES:
        return {
          left: { tab: TABS.HISTORY, icon: <ArrowBackIcon />, tooltip: 'Ir a Mis Entrenamientos' },
          right: { tab: TABS.WORKOUT, icon: <ArrowForwardIcon />, tooltip: 'Ir a Registro' }
        }
      default:
        return null
    }
  }

  const navigationButtons = getNavigationButtons()

  if (!navigationButtons) return null

  return (
    <Box>
      {/* Botón flotante izquierdo */}
      <Fab
        aria-label={navigationButtons.left.tooltip}
        onClick={() => setActiveTab(navigationButtons.left.tab)}
        sx={{
          position: 'fixed',
          bottom: 24,
          left: 24,
          zIndex: 1000,
          backgroundColor: '#ffc107',
          color: '#fff',
          boxShadow: '0 4px 12px rgba(255, 193, 7, 0.3)',
          '&:hover': {
            backgroundColor: '#ffb300',
            boxShadow: '0 6px 16px rgba(255, 193, 7, 0.4)',
            transform: 'scale(1.05)'
          },
          transition: 'all 0.2s ease-in-out',
          '& .MuiSvgIcon-root': {
            color: '#fff'
          }
        }}
      >
        {navigationButtons.left.icon}
      </Fab>

      {/* Botón flotante derecho */}
      <Fab
        aria-label={navigationButtons.right.tooltip}
        onClick={() => setActiveTab(navigationButtons.right.tab)}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
          backgroundColor: '#ffc107',
          color: '#fff',
          boxShadow: '0 4px 12px rgba(255, 193, 7, 0.3)',
          '&:hover': {
            backgroundColor: '#ffb300',
            boxShadow: '0 6px 16px rgba(255, 193, 7, 0.4)',
            transform: 'scale(1.05)'
          },
          transition: 'all 0.2s ease-in-out',
          '& .MuiSvgIcon-root': {
            color: '#fff'
          }
        }}
      >
        {navigationButtons.right.icon}
      </Fab>
    </Box>
  )
}

export default FloatingNavButtons
