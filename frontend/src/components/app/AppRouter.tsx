import { Box } from '@mui/material'
import { TABS, type TabType } from '../../constants/tabs'
import WorkoutForm from '../workout/WorkoutForm'
import WorkoutHistory from '../workout/WorkoutHistory'
import RoutineList from '../routines/RoutineList'
import ExerciseList from '../exercises/ExerciseList'

type AppRouterProps = {
  activeTab: TabType
  exercises: any[]
  handleWorkoutSubmit: (data: any) => Promise<void>
  isSubmittingWorkout: boolean
  activeRoutine: any
  isRoutinePaused: boolean
  handleStopRoutine: () => void
  preloadedExercise: any
  handleNavigateToRoutines: () => void
  userRole: string | undefined
  isAdmin: boolean
  routineProgress: number
}

export default function AppRouter({
  activeTab,
  exercises,
  handleWorkoutSubmit,
  isSubmittingWorkout,
  activeRoutine,
  isRoutinePaused,
  handleStopRoutine,
  preloadedExercise,
  handleNavigateToRoutines,
  userRole,
  isAdmin,
  routineProgress
}: AppRouterProps) {
  switch (activeTab) {
    case TABS.WORKOUT:
      return (
        <Box sx={{
          position: 'relative',
          zIndex: 1,
          height: '100%',
          overflow: activeRoutine ? 'auto' : 'hidden',
          px: { xs: 2, sm: 1 },
          pb: 0,
          '&::-webkit-scrollbar': { display: 'none' },
          '&::-moz-scrollbar': { display: 'none' },
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          <WorkoutForm
            exercises={exercises}
            onSubmit={handleWorkoutSubmit}
            isLoading={isSubmittingWorkout}
            activeRoutine={activeRoutine}
            isRoutinePaused={isRoutinePaused}
            onStopRoutine={handleStopRoutine}
            preloadedExercise={preloadedExercise}
            onNavigateToRoutines={handleNavigateToRoutines}
            userRole={userRole}
            isAdmin={isAdmin}
          />
        </Box>
      )
    case TABS.HISTORY:
      return (
        <Box sx={{ height: '100%' }}>
          <WorkoutHistory />
        </Box>
      )
    case TABS.ROUTINES:
      return (
        <Box sx={{ height: '100%' }}>
          <RoutineList activeRoutine={activeRoutine} routineProgress={routineProgress} />
        </Box>
      )
    case TABS.EXERCISES:
      return (
        <Box sx={{ minHeight: 'calc(100vh - 200px)' }}>
          <ExerciseList
            exercises={[
              {
                id: 1,
                name: 'Press de Banca',
                muscle_group: 'Pecho',
                primary_muscles: ['Pectoral Mayor', 'Tríceps'],
                secondary_muscles: ['Deltoides Anterior', 'Serrato Anterior'],
                video_url: 'https://www.youtube.com/watch?v=rT7DgCr-3pg'
              },
              {
                id: 2,
                name: 'Sentadilla',
                muscle_group: 'Piernas',
                primary_muscles: ['Cuádriceps', 'Glúteos'],
                secondary_muscles: ['Isquiotibiales', 'Gastrocnemio', 'Core'],
                video_url: 'https://www.youtube.com/watch?v=aclHkVaku9U'
              },
              {
                id: 3,
                name: 'Peso Muerto',
                muscle_group: 'Espalda',
                primary_muscles: ['Erector Espinal', 'Glúteos', 'Isquiotibiales'],
                secondary_muscles: ['Trapecio', 'Romboides', 'Core'],
                video_url: 'https://www.youtube.com/watch?v=op9kVnSso6Q'
              },
              {
                id: 4,
                name: 'Press Militar',
                muscle_group: 'Hombros',
                primary_muscles: ['Deltoides Anterior', 'Deltoides Medio'],
                secondary_muscles: ['Tríceps', 'Trapecio Superior'],
                video_url: 'https://www.youtube.com/watch?v=2yjwXTZQDDI'
              },
              {
                id: 5,
                name: 'Curl de Bíceps',
                muscle_group: 'Brazos',
                primary_muscles: ['Bíceps Braquial'],
                secondary_muscles: ['Braquiorradial', 'Braquial'],
                video_url: 'https://www.youtube.com/watch?v=ykJmrZ5v0Oa'
              },
            ]}
            onSelectExercise={(exercise) => console.log('Ejercicio seleccionado:', exercise)}
          />
        </Box>
      )
    default:
      return null
  }
}
