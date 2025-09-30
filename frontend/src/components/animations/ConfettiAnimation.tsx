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
    if (trigger && !showConfetti) {
      setShowConfetti(true)
      
      // Ocultar confeti después de 4 segundos
      const timer = setTimeout(() => {
        setShowConfetti(false)
        onComplete?.()
      }, 4000)

      return () => clearTimeout(timer)
    }
  }, [trigger, showConfetti, onComplete])

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
        numberOfPieces={200}
        gravity={0.3}
        initialVelocityY={20}
        colors={['#FFB732', '#FF6B35', '#F7931E', '#FFD23F', '#06FFA5', '#3A86FF', '#8338EC']}
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
