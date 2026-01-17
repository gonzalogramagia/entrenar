import { useState, useEffect } from 'react'
import { Fab, Zoom } from '@mui/material'
import { AllInclusive, People, FitnessCenter } from '@mui/icons-material'
import { useUserSettings } from '../../contexts/UserSettingsContext'

import { TABS, type TabType } from '../../constants/tabs'
import { useLanguage } from '../../contexts/LanguageContext'
import { translations } from '../../i18n/translations'

type FloatingNavButtonProps = {
  currentTab: TabType
  onTabChange: (tab: TabType) => void
  activeRoutine?: any
}

export default function FloatingNavButton({ currentTab, onTabChange, activeRoutine }: FloatingNavButtonProps) {
  const { language } = useLanguage()
  const t = translations[language].navigation
  const { getRoutineProgress } = useUserSettings()
  const [isVisible, setIsVisible] = useState(true)

  // Detectar si la rutina está completa
  const isRoutineComplete = activeRoutine ? (() => {
    const today = new Date().toISOString().split('T')[0]
    return getRoutineProgress(today, activeRoutine.id, activeRoutine) === 100
  })() : false

  useEffect(() => {
    // Mostrar el botón en WORKOUT, HISTORY, SOCIAL y ROUTINES (cuando hay rutina activa)
    if (currentTab === TABS.WORKOUT || currentTab === TABS.HISTORY || currentTab === TABS.SOCIAL || (currentTab === TABS.ROUTINES && activeRoutine)) {
      // En historial y social, siempre mostrar el botón
      if (currentTab === TABS.HISTORY || currentTab === TABS.SOCIAL) {
        setIsVisible(true)
        return
      }

      // En Mis Rutinas con rutina activa, siempre mostrar el botón
      if (currentTab === TABS.ROUTINES && activeRoutine) {
        setIsVisible(true)
        return
      }

      // En el formulario de registro, ocultar después de 3 segundos
      if (currentTab === TABS.WORKOUT) {
        setIsVisible(true)
        const timer = setTimeout(() => {
          setIsVisible(false)
        }, 3000)

        return () => {
          clearTimeout(timer)
        }
      }
    } else {
      // En otras tabs (EXERCISES, NOTIFICATIONS), ocultar el botón
      setIsVisible(false)
    }
  }, [currentTab, activeRoutine])

  const handleClick = () => {
    if (currentTab === TABS.ROUTINES && activeRoutine) {
      if (isRoutineComplete) {
        onTabChange(TABS.HISTORY) // Ir a Entrenamientos cuando está completa
      } else {
        onTabChange(TABS.WORKOUT) // Ir a Registro cuando está activa
      }
    } else if (currentTab === TABS.WORKOUT) {
      onTabChange(TABS.HISTORY)
    } else if (currentTab === TABS.HISTORY) {
      onTabChange(TABS.SOCIAL)
    } else if (currentTab === TABS.SOCIAL) {
      onTabChange(TABS.WORKOUT)
    }
  }

  const getIcon = () => {
    if (currentTab === TABS.ROUTINES && activeRoutine) {
      return isRoutineComplete ? <FitnessCenter /> : <AllInclusive />
    } else if (currentTab === TABS.WORKOUT) {
      return <FitnessCenter />
    } else if (currentTab === TABS.HISTORY) {
      return <People />
    } else if (currentTab === TABS.SOCIAL) {
      return <AllInclusive />
    }
    return <AllInclusive />
  }

  const getTooltip = () => {
    if (currentTab === TABS.ROUTINES && activeRoutine) {
      return isRoutineComplete ? t.viewWorkouts : t.logWorkout
    } else if (currentTab === TABS.WORKOUT) {
      return t.viewHistory
    } else if (currentTab === TABS.HISTORY) {
      return t.viewSocial
    } else if (currentTab === TABS.SOCIAL) {
      return t.logWorkout
    }
    return t.logWorkout
  }

  return (
    <Zoom in={isVisible}>
      <Fab
        aria-label={getTooltip()}
        onClick={handleClick}
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
        {getIcon()}
      </Fab>
    </Zoom>
  )
}
