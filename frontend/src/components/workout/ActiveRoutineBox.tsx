import {
  Box,
  Button,
  IconButton,
  Typography
} from '@mui/material'
import {
  KeyboardArrowDown,
  KeyboardArrowUp,
  Stop as StopIcon,
  Close as CloseIcon
} from '@mui/icons-material'
import { useState } from 'react'
import { useLanguage } from '../../contexts/LanguageContext'
import { translations } from '../../i18n/translations'
import { useUserSettings } from '../../contexts/UserSettingsContext'

type ActiveRoutineBoxProps = {
  activeRoutine: any
  isRoutinePaused: boolean
  onStopRoutine?: () => void
  onNavigateToRoutines?: () => void
  onLoadExercise: (exercise: any) => void
}

export default function ActiveRoutineBox({
  activeRoutine,
  isRoutinePaused,
  onStopRoutine,
  onNavigateToRoutines,
  onLoadExercise
}: ActiveRoutineBoxProps) {
  const { language } = useLanguage()
  const t = translations[language].workout
  const { toggleExerciseCompleted, getCompletedExercisesForRoutine, getRoutineProgress } = useUserSettings()

  const [showRoutineExercises, setShowRoutineExercises] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const completedExercises = getCompletedExercisesForRoutine(today, activeRoutine.id)
  const realRoutineProgress = getRoutineProgress(today, activeRoutine.id, activeRoutine)
  const isRoutineComplete = realRoutineProgress === 100

  return (
    <Box sx={{
      mb: 3,
      p: 2,
      backgroundColor: isRoutineComplete ? 'success.main' : (isRoutinePaused ? 'primary.main' : '#FFB732'),
      borderRadius: 2,
      color: 'white',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      position: 'relative'
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            textAlign: 'left',
            cursor: 'pointer',
            '&:hover': { opacity: 0.8 }
          }}
          onClick={onNavigateToRoutines}
        >
          🏋️ {isRoutinePaused ? t.restTime : activeRoutine.name}
        </Typography>

        <IconButton
          size="small"
          onClick={onStopRoutine}
          sx={{ color: 'white', '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' } }}
        >
          {isRoutineComplete ? <CloseIcon /> : <StopIcon />}
        </IconButton>
      </Box>

      <Box sx={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 1, height: 8, mb: 1 }}>
        <Box sx={{ width: `${realRoutineProgress}%`, backgroundColor: 'white', borderRadius: 1, height: '100%', transition: 'width 0.3s ease' }} />
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
          {realRoutineProgress}% {t.routineCompleteLabel}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {!showRoutineExercises && (
            <Typography
              variant="body2"
              sx={{ fontWeight: 'bold', cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
              onClick={() => setShowRoutineExercises(!showRoutineExercises)}
            >
              {isRoutineComplete ? (language === 'es' ? '¡Felicitaciones!' : 'Congratulations!') : (isRoutinePaused ? t.chooseRoutine : t.viewRoutine)}
            </Typography>
          )}

          <IconButton
            size="small"
            onClick={() => setShowRoutineExercises(!showRoutineExercises)}
            sx={{ color: 'white', backgroundColor: 'rgba(255,255,255,0.1)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' } }}
          >
            {showRoutineExercises ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </Box>
      </Box>

      {/* Lista expandible de ejercicios de la rutina */}
      {showRoutineExercises && activeRoutine?.exercises && (
        <Box sx={{ mt: 2, p: 2, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'visible' }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 2, color: 'white' }}>
            {t.remainingExercises}
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {activeRoutine.exercises.map((exercise: any, index: number) => {
              const completedSets = completedExercises[exercise.exercise_id] || []

              return (
                <Box
                  key={`${exercise.exercise_id}-${index}`}
                  sx={{ p: 1.5, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 1, transition: 'all 0.2s ease' }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'white', flex: 1, textAlign: 'left', pl: 2 }}>
                      {exercise.exercise_name}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {Array.from({ length: exercise.sets }, (_, setIndex) => {
                        const setNumber = setIndex + 1
                        const isCompleted = completedSets.includes(setNumber)

                        return (
                          <Box
                            key={setNumber}
                            sx={{
                              width: 24, height: 24, borderRadius: '50%',
                              border: '2px solid',
                              borderColor: isCompleted ? 'warning.main' : 'rgba(255,255,255,0.5)',
                              backgroundColor: isCompleted ? 'warning.main' : 'transparent',
                              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: 'all 0.2s ease',
                              '&:hover': { borderColor: isCompleted ? 'warning.dark' : 'warning.main', backgroundColor: isCompleted ? 'warning.dark' : 'rgba(255,152,0,0.2)' }
                            }}
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleExerciseCompleted(today, activeRoutine.id, exercise.exercise_id, setNumber, activeRoutine)
                            }}
                          >
                            {isCompleted && (
                              <Typography variant="caption" sx={{ color: 'white', fontWeight: 'bold', fontSize: '0.7rem' }}>✓</Typography>
                            )}
                          </Box>
                        )
                      })}
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, mb: 1, justifyContent: 'center' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600, lineHeight: 1 }}>{exercise.sets}</Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.65rem', lineHeight: 1 }}>
                        {exercise.sets === 1 ? (language === 'es' ? 'serie' : 'set') : (language === 'es' ? 'series' : 'sets')}
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>•</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600, lineHeight: 1 }}>{exercise.reps}</Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.65rem', lineHeight: 1 }}>
                        {exercise.reps === 1 ? (language === 'es' ? 'rep' : 'rep') : (language === 'es' ? 'reps' : 'reps')}
                      </Typography>
                    </Box>
                    {exercise.weight && (
                      <>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>•</Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600, lineHeight: 1 }}>{exercise.weight}</Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.65rem', lineHeight: 1 }}>kg</Typography>
                        </Box>
                      </>
                    )}
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>•</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600, lineHeight: 1 }}>
                        {Math.floor(exercise.rest_time_seconds / 60)}:{(exercise.rest_time_seconds % 60).toString().padStart(2, '0')}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.65rem', lineHeight: 1 }}>
                        {language === 'es' ? 'descanso' : 'rest'}
                      </Typography>
                    </Box>
                  </Box>

                  <Button
                    variant="outlined"
                    size="small"
                    sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)', '&:hover': { borderColor: '#FFB732', backgroundColor: 'rgba(255,183,50,0.1)' } }}
                    onClick={() => {
                      onLoadExercise(exercise)
                      setShowRoutineExercises(false)
                    }}
                  >
                    {t.loadInForm}
                  </Button>
                </Box>
              )
            })}
          </Box>
        </Box>
      )}
    </Box>
  )
}
