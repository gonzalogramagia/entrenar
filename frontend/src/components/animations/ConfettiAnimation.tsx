import React, { useState, useEffect } from 'react'
import Confetti from 'react-confetti'
import { Box } from '@mui/material'

interface ConfettiAnimationProps {
  trigger: boolean
  onComplete?: () => void
}

const ConfettiAnimation: React.FC<ConfettiAnimationProps> = ({ trigger, onComplete }) => {
  const [showConfetti, setShowConfetti] = useState(false)
  const [windowDimensions, setWindowDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  })

  useEffect(() => {
    if (trigger) {
      // Resetear el estado antes de activar
      setShowConfetti(false)
      
      // Pequeño delay para asegurar que el reset se complete
      const resetTimer = setTimeout(() => {
        setShowConfetti(true)
        
        // Ocultar confeti después de 2 segundos (aún más rápido)
        const hideTimer = setTimeout(() => {
          setShowConfetti(false)
          onComplete?.()
        }, 2000)

        return () => clearTimeout(hideTimer)
      }, 50)

      return () => {
        clearTimeout(resetTimer)
      }
    }
  }, [trigger, onComplete])

  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (!showConfetti) return null

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 9999,
        pointerEvents: 'none'
      }}
    >
      <Confetti
        width={windowDimensions.width}
        height={windowDimensions.height}
        recycle={false}
        numberOfPieces={600}
        gravity={0.8}
        initialVelocityX={40}
        initialVelocityY={40}
        colors={['#FFB732', '#FF6B35', '#F7931E', '#FFD23F', '#06FFA5', '#3A86FF', '#8338EC', '#FF1744', '#00E676', '#FF9800', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5']}
        style={{
          position: 'absolute',
          top: 0,
          left: 0
        }}
      />
    </Box>
  )
}

export default ConfettiAnimation
