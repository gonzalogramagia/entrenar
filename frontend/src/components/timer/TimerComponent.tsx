import { useState, useEffect, useRef } from 'react'
import { Button, Box, Typography } from '@mui/material'

type TimerComponentProps = {
  onTimeComplete?: (seconds: number) => void
  onTimeUpdate?: (seconds: number, isRunning: boolean) => void
  onCapturedChange?: (isCaptured: boolean) => void
  disabled?: boolean
  timerMode?: 'rest' | 'series'
  onTimerModeChange?: (mode: 'rest' | 'series') => void
}

export default function TimerComponent({ 
  onTimeComplete, 
  onTimeUpdate, 
  onCapturedChange,
  disabled = false,
  timerMode = 'rest',
  onTimerModeChange
}: TimerComponentProps) {
  const [restTime, setRestTime] = useState(0)
  const [seriesTime, setSeriesTime] = useState(0)
  const [isRestRunning, setIsRestRunning] = useState(false)
  const [isSeriesRunning, setIsSeriesRunning] = useState(false)
  const [isRestCaptured, setIsRestCaptured] = useState(false)
  const [isSeriesCaptured, setIsSeriesCaptured] = useState(false)
  const restIntervalRef = useRef<number | null>(null)
  const seriesIntervalRef = useRef<number | null>(null)

  // Auto-start inicial para el modo descanso
  useEffect(() => {
    if (timerMode === 'rest' && !isRestRunning && !isRestCaptured) {
      setIsRestRunning(true)
    }
  }, [])

  // Escuchar evento para resetear el cronómetro cuando se pare la rutina
  useEffect(() => {
    const handleResetTimer = () => {
      console.log('🔄 Reseteando cronómetros desde TimerComponent')
      // Parar ambos cronómetros
      setIsRestRunning(false)
      setIsSeriesRunning(false)
      // Resetear tiempos
      setRestTime(0)
      setSeriesTime(0)
      // Resetear estado de captura
      setIsRestCaptured(false)
      setIsSeriesCaptured(false)
    }

    window.addEventListener('resetTimer', handleResetTimer)
    
    return () => {
      window.removeEventListener('resetTimer', handleResetTimer)
    }
  }, [])

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Cronómetro de descanso
  useEffect(() => {
    if (isRestRunning) {
      restIntervalRef.current = setInterval(() => {
        setRestTime(prevTime => {
          const newTime = prevTime + 1
          if (onTimeUpdate && timerMode === 'rest') {
            onTimeUpdate(newTime, true)
          }
          return newTime
        })
      }, 1000) as unknown as number
    } else {
      if (restIntervalRef.current) {
        clearInterval(restIntervalRef.current)
        restIntervalRef.current = null
      }
      if (onTimeUpdate && timerMode === 'rest') {
        onTimeUpdate(restTime, false)
      }
    }

    return () => {
      if (restIntervalRef.current) {
        clearInterval(restIntervalRef.current)
      }
    }
  }, [isRestRunning, onTimeUpdate, timerMode, restTime])

  // Cronómetro de entrenamiento
  useEffect(() => {
    if (isSeriesRunning) {
      seriesIntervalRef.current = setInterval(() => {
        setSeriesTime(prevTime => {
          const newTime = prevTime + 1
          if (onTimeUpdate && timerMode === 'series') {
            onTimeUpdate(newTime, true)
          }
          return newTime
        })
      }, 1000) as unknown as number
    } else {
      if (seriesIntervalRef.current) {
        clearInterval(seriesIntervalRef.current)
        seriesIntervalRef.current = null
      }
      if (onTimeUpdate && timerMode === 'series') {
        onTimeUpdate(seriesTime, false)
      }
    }

    return () => {
      if (seriesIntervalRef.current) {
        clearInterval(seriesIntervalRef.current)
      }
    }
  }, [isSeriesRunning, onTimeUpdate, timerMode, seriesTime])

  // Auto-start cuando cambie el modo
  useEffect(() => {
    // Parar ambos cronómetros cuando cambie el modo
    setIsRestRunning(false)
    setIsSeriesRunning(false)
    
    // Resetear tiempos cuando cambie el modo
    setRestTime(0)
    setSeriesTime(0)
    
    // Resetear estado de captura
    setIsRestCaptured(false)
    setIsSeriesCaptured(false)
    
    // Iniciar el cronómetro correspondiente al nuevo modo
    if (timerMode === 'rest') {
      setIsRestRunning(true)
    } else if (timerMode === 'series') {
      setIsSeriesRunning(true)
    }
  }, [timerMode])

  const handleRestTimer = () => {
    if (!isRestRunning) {
      if (isRestCaptured) {
        // Reiniciar el cronómetro de descanso
        setIsRestRunning(true)
        setIsRestCaptured(false)
        setRestTime(0)
      } else {
        // Iniciar el cronómetro de descanso
        setIsRestRunning(true)
        if (onTimerModeChange) {
          onTimerModeChange('rest')
        }
      }
    } else {
      // Parar el cronómetro de descanso
      setIsRestRunning(false)
      setIsRestCaptured(true)
      if (onCapturedChange) {
        onCapturedChange(true)
      }
      if (onTimeComplete) {
        onTimeComplete(restTime)
      }
    }
    // Quitar el focus del botón
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  }

  const handleSeriesTimer = () => {
    if (!isSeriesRunning) {
      if (isSeriesCaptured) {
        // Reiniciar el cronómetro de entrenamiento
        setIsSeriesRunning(true)
        setIsSeriesCaptured(false)
        setSeriesTime(0)
      } else {
        // Iniciar el cronómetro de entrenamiento
        setIsSeriesRunning(true)
        if (onTimerModeChange) {
          onTimerModeChange('series')
        }
      }
    } else {
      // Parar el cronómetro de entrenamiento
      setIsSeriesRunning(false)
      setIsSeriesCaptured(true)
      if (onCapturedChange) {
        onCapturedChange(true)
      }
      if (onTimeComplete) {
        onTimeComplete(seriesTime)
      }
    }
    // Quitar el focus del botón
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'row',
      alignItems: 'center', 
      justifyContent: 'center',
      gap: 3,
      width: '100%'
    }}>
      {/* Display del tiempo */}
              <Typography 
          variant="h4" 
          component="div" 
          sx={{ 
            fontFamily: 'monospace',
            color: timerMode === 'rest' ? 'primary.main' : 'warning.main',
            textAlign: 'center',
            fontSize: '2.5rem',
            fontWeight: 'bold',
            minWidth: '140px'
          }}
        >
        {formatTime(timerMode === 'rest' ? restTime : seriesTime)}
      </Typography>
      
      {/* Botón único */}
      <Button 
        variant="contained" 
        onClick={timerMode === 'rest' ? handleRestTimer : handleSeriesTimer}
        disabled={disabled}
        size="large"
        sx={{ 
          minWidth: 140,
          py: 1.5,
          px: 3,
          borderRadius: 1.5,
          fontSize: '1.1rem',
          fontWeight: 'bold',
          backgroundColor: timerMode === 'rest' ? 'primary.main' : 'warning.main',
          '&:hover': {
            backgroundColor: timerMode === 'rest' ? 'primary.dark' : 'warning.dark'
          }
        }}
      >
        {timerMode === 'rest' 
          ? (!isRestRunning ? 'Reiniciar' : 'Parar')
          : (!isSeriesRunning ? 'Reiniciar' : 'Parar')
        }
      </Button>
    </Box>
  )
}
