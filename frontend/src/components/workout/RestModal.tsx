import { useState, useEffect } from 'react'
import { Dialog, DialogContent, Typography, Box, IconButton } from '@mui/material'
import { PlayArrow as PlayArrowIcon } from '@mui/icons-material'
import { useLanguage } from '../../contexts/LanguageContext'
import { translations } from '../../i18n/translations'

type RestModalProps = {
  open: boolean
  onClose: () => void
  initialRestTime: number
  lastRegisteredExercise: string
}

export default function RestModal({
  open,
  onClose,
  initialRestTime,
  lastRegisteredExercise
}: RestModalProps) {
  const { language } = useLanguage()
  const t = translations[language].workout
  
  const [restTime, setRestTime] = useState(initialRestTime)
  const [isRestRunning, setIsRestRunning] = useState(false)
  const [targetTime, setTargetTime] = useState<number | null>(null)

  // Iniciar timer cuando se abre el modal
  useEffect(() => {
    if (open) {
      setRestTime(initialRestTime)
      setTargetTime(Date.now() + initialRestTime * 1000)
      setIsRestRunning(true)
    } else {
      setIsRestRunning(false)
      setTargetTime(null)
    }
  }, [open, initialRestTime])

  // Timer para el modal de descanso
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null

    if (isRestRunning && targetTime) {
      interval = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((targetTime - Date.now()) / 1000))
        setRestTime(remaining)
      }, 500)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isRestRunning, targetTime])

  useEffect(() => {
    if (isRestRunning && restTime === 0) {
      setIsRestRunning(false)
      onClose()
    }
  }, [restTime, isRestRunning, onClose])

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        if (reason !== 'backdropClick') onClose()
      }}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          backgroundColor: 'primary.main',
          color: 'white'
        }
      }}
    >
      <DialogContent sx={{ textAlign: 'center', py: 3 }}>
        <Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}>
          {t.restingAfter}
        </Typography>

        <Typography variant="h5" sx={{ mb: 2, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
          {lastRegisteredExercise}
        </Typography>

        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3
        }}>
          <Typography variant="h2" sx={{ fontWeight: 800, fontFamily: 'monospace' }}>
            {Math.floor(restTime / 60)}:{(restTime % 60).toString().padStart(2, '0')}
          </Typography>

          <IconButton
            onClick={onClose}
            aria-label={t.skipRest}
            sx={{
              color: 'white',
              backgroundColor: 'rgba(255,255,255,0.1)',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.2)'
              }
            }}
          >
            <PlayArrowIcon />
          </IconButton>
        </Box>
      </DialogContent>
    </Dialog>
  )
}
