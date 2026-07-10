import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ModeEdit as ModeEditIcon
} from '@mui/icons-material'
import type { WorkoutDay, ExerciseGroup, WorkoutDayWithExercises } from '../../types/workout'

interface WorkoutDayCardProps {
  day: WorkoutDayWithExercises
  expandedDays: Set<string>
  toggleDayExpansion: (date: string) => void
  formatDate: (dateString: string) => string
  cleanExerciseName: (name: string) => string
  getSportEmoji: (name: string) => string | null
  loadingWorkoutId: number | null
  language: string
  onExerciseClick: (group: ExerciseGroup, workoutDay: WorkoutDay) => void
  onEditSessionName: (dayId: number, currentName: string) => void
}

export default function WorkoutDayCard({
  day,
  expandedDays,
  toggleDayExpansion,
  formatDate,
  cleanExerciseName,
  getSportEmoji,
  loadingWorkoutId,
  language,
  onExerciseClick,
  onEditSessionName
}: WorkoutDayCardProps) {
  return (
    <Box 
      key={day.workoutDay.date} 
      data-date={day.workoutDay.date}
      sx={{ position: 'relative', mb: 2 }}
    >
      <Card sx={{
        boxShadow: 2,
        width: '100%',
        cursor: 'pointer',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        filter: loadingWorkoutId === day.workoutDay.id ? 'blur(1px)' : 'none',
        transition: 'filter 0.2s ease-in-out',
        '&:hover': {
          boxShadow: 4,
          transform: 'translateY(-2px)',
          transition: 'all 0.2s ease-in-out'
        }
      }}
        onClick={() => toggleDayExpansion(day.workoutDay.date)}
      >
        <CardContent sx={{ pl: 2.5, pr: 2, pt: 2, pb: 0 }}>
          {/* Header del día */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ pl: 0, ml: 0.5, pb: '2 !important', mt: 0.5 }}>
              <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold', color: 'primary.main', textAlign: 'left', fontSize: '1rem' }}>
                {formatDate(day.workoutDay.date)}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'left' }}>
                  {day.workoutDay.name}
                </Typography>
                <ModeEditIcon
                  sx={{
                    ml: 1,
                    fontSize: '1rem',
                    color: 'text.secondary',
                    opacity: 0.6,
                    cursor: 'pointer',
                    borderRadius: 1,
                    p: 0.5,
                    transition: 'background-color 0.2s',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                      opacity: 1
                    }
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditSessionName(day.workoutDay.id, day.workoutDay.name);
                  }}
                />
              </Box>
              {!expandedDays.has(day.workoutDay.date) && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'left', mt: 0.5 }}>
                  {day.totalWorkouts} {day.totalWorkouts === 1 ? (language === 'es' ? 'ejercicio' : 'exercise') : (language === 'es' ? 'ejercicios' : 'exercises')}
                  {day.exerciseGroups.length > 0 && (
                    <span> ({day.exerciseGroups.reduce((total, group) => total + group.workouts.length, 0)} {language === 'es' ? 'series en total' : 'total sets'})</span>
                  )}
                </Typography>
              )}
            </Box>

            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                toggleDayExpansion(day.workoutDay.date);
              }}
              size="small"
            >
              {expandedDays.has(day.workoutDay.date) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>

          {/* Resumen de ejercicios */}
          {expandedDays.has(day.workoutDay.date) && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
              {day.exerciseGroups.map((group, index) => (
                <Card
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation()
                    onExerciseClick(group, day.workoutDay)
                  }}
                  sx={{
                    boxShadow: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    width: '100%',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      boxShadow: 3,
                      transform: 'translateY(-2px)',
                      borderColor: 'primary.main'
                    }
                  }}
                >
                  <CardContent sx={{
                    p: 2,
                    pb: 1.5,
                    '&:last-child': {
                      paddingBottom: '16px !important'
                    }
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main', textAlign: 'left', fontSize: '0.88rem' }}>
                        {cleanExerciseName(group.exerciseName)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>
                        {(group.workouts.every(workout => workout.is_sport) ||
                          group.exerciseName.toLowerCase().includes('running') ||
                          group.exerciseName.toLowerCase().includes('bici')) ?
                          getSportEmoji(group.exerciseName) || group.workouts.length :
                          group.workouts.length
                        }
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}
