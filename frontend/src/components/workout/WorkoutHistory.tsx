import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  Box,
  Typography,
  Card,
  Stack,
  Button,
  IconButton,
  TextField,
  CircularProgress,
  Alert,
  Snackbar,
  Badge
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Close as CloseIcon
} from '@mui/icons-material'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar'
import { PickersDay } from '@mui/x-date-pickers/PickersDay'
import { es, enUS } from 'date-fns/locale'
import { apiClient } from '../../lib/api'
import { useLanguage } from '../../contexts/LanguageContext'
import { useAuth } from '../../contexts/AuthContext'
import { translations } from '../../i18n/translations'
import { normalizeDate, getDateString, formatDate as formatDateUtil } from '../../lib/dateUtils'
import { getSportEmoji, cleanExerciseName } from '../../lib/exerciseUtils'
import { getGuestMockData } from '../../lib/guestMockData'
import WorkoutDayCard from './WorkoutDayCard'
import WorkoutHistoryDialogs from './WorkoutHistoryDialogs'
import type { Workout, WorkoutDay, ExerciseGroup, WorkoutDayWithExercises } from '../../types/workout'

/**
 * Componente personalizado para renderizar los días del calendario
 * Resalta aquellos días que tienen entrenamientos registrados
 */
function ServerDay(props: any) {
  const { highlightedDays = new Set(), day, outsideCurrentMonth, ...other } = props;

  const dateStr = getDateString(day);
  
  const hasWorkout = !outsideCurrentMonth && highlightedDays.has(dateStr);

  return (
    <Badge
      overlap="circular"
      badgeContent={hasWorkout ? '•' : undefined}
      sx={{ 
        '& .MuiBadge-badge': { 
          fontSize: '1.2rem',
          top: 28,
          right: 18,
          color: 'primary.main',
          backgroundColor: 'transparent'
        } 
      }}
    >
      <PickersDay 
        {...other} 
        outsideCurrentMonth={outsideCurrentMonth} 
        day={day}
        sx={hasWorkout ? {
          backgroundColor: 'rgba(25, 118, 210, 0.12)',
          fontWeight: '700',
          fontSize: '0.9rem',
          '&:hover': {
            backgroundColor: 'rgba(25, 118, 210, 0.2)',
          }
        } : {}}
      />
    </Badge>
  );
}

export default function WorkoutHistory() {
  const { language } = useLanguage()
  const { isGuest } = useAuth()
  const [workoutDays, setWorkoutDays] = useState<WorkoutDay[]>([])
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ show: boolean; workoutId: number | null }>({ show: false, workoutId: null })
  const [loadingWorkoutId, setLoadingWorkoutId] = useState<number | null>(null)
  const [exerciseModal, setExerciseModal] = useState<{ show: boolean; exerciseGroup: ExerciseGroup | null; workoutDay: WorkoutDay | null }>({ show: false, exerciseGroup: null, workoutDay: null })
  const [editObservationModal, setEditObservationModal] = useState<{
    show: boolean;
    workoutId: number | null;
    currentObservation: string;
  }>({
    show: false,
    workoutId: null,
    currentObservation: ''
  });
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isCalendarSearch, setIsCalendarSearch] = useState(false);

  const [editValueModal, setEditValueModal] = useState<{
    show: boolean;
    workoutId: number | null;
    field: 'weight' | 'reps' | 'seconds' | null;
    currentValue: string;
    unit?: string;
  }>({
    show: false,
    workoutId: null,
    field: null,
    currentValue: ''
  });

  const [editNameModal, setEditNameModal] = useState<{
    show: boolean;
    dayId: number | null;
    currentName: string;
    newName: string;
  }>({
    show: false,
    dayId: null,
    currentName: '',
    newName: ''
  });

  const resultsRef = useRef<HTMLDivElement>(null);

  // Wrapper que inyecta el language actual
  const formatDate = useCallback((dateString: string) => {
    return formatDateUtil(dateString, language);
  }, [language]);

  // Auto-hide success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('')
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [successMessage])

  // Agrupar workouts por día y crear días con ejercicios
  const workoutDaysWithExercises = useMemo(() => {
    const days: WorkoutDayWithExercises[] = [];

    const safeWorkoutDays = workoutDays || [];
    const safeWorkouts = workouts || [];

    const workoutsByDay = new Map<number, Workout[]>();
    safeWorkouts.forEach(workout => {
      const dayId = workout.workout_day_id;
      if (!workoutsByDay.has(dayId)) {
        workoutsByDay.set(dayId, []);
      }
      workoutsByDay.get(dayId)!.push(workout);
    });

    safeWorkoutDays.forEach(day => {
      const dayWorkouts = workoutsByDay.get(day.id) || [];

      const exerciseGroups: ExerciseGroup[] = [];
      const exerciseMap = new Map<string, Workout[]>();

      dayWorkouts.forEach(workout => {
        const exerciseName = workout.exercise_name;
        if (!exerciseMap.has(exerciseName)) {
          exerciseMap.set(exerciseName, []);
        }
        exerciseMap.get(exerciseName)!.push(workout);
      });

      exerciseMap.forEach((workouts, exerciseName) => {
        exerciseGroups.push({
          exerciseName,
          workouts
        });
      });

      if (dayWorkouts.length > 0) {
        days.push({
          workoutDay: day,
          exerciseGroups,
          totalWorkouts: exerciseGroups.length
        });
      }
    });

    return days;
  }, [workoutDays, workouts]);

  const trainingDates = useMemo(() => 
    new Set(workoutDaysWithExercises.map(day => normalizeDate(day.workoutDay.date))), 
    [workoutDaysWithExercises]
  );

  // Filtrar días
  const filteredWorkoutDays = useMemo(() => {
    let filtered = workoutDaysWithExercises;

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(day => {
        const formattedDate = formatDate(day.workoutDay.date).toLowerCase();
        
        let dateMatch = false;
        if (isCalendarSearch) {
          dateMatch = formattedDate.startsWith(searchLower) || 
                     formattedDate.includes(` ${searchLower}`);
        } else {
          dateMatch = formattedDate.includes(searchLower);
        }

        const workoutNameMatch = day.workoutDay.name?.toLowerCase().includes(searchLower) || false;

        const exerciseMatch = day.exerciseGroups.some(group =>
          group.exerciseName.toLowerCase().includes(searchLower)
        );

        const observationMatch = day.exerciseGroups.some(group =>
          group.workouts.some(workout =>
            workout.observations && workout.observations.toLowerCase().includes(searchLower)
          )
        );

        const workoutDataMatch = day.exerciseGroups.some(group =>
          group.workouts.some(workout =>
            workout.weight.toString().includes(searchLower) ||
            workout.reps.toString().includes(searchLower) ||
            (workout.seconds && workout.seconds.toString().includes(searchLower))
          )
        );

        return dateMatch || workoutNameMatch || exerciseMatch || observationMatch || workoutDataMatch;
      });
    }

    // Ordenar por fecha (shallow copy para no mutar el memoized array)
    const sorted = [...filtered].sort((a, b) => {
      const dateA = new Date(a.workoutDay.date).getTime();
      const dateB = new Date(b.workoutDay.date).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return sorted;
  }, [workoutDaysWithExercises, searchTerm, sortOrder, isCalendarSearch]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      if (isGuest) {
        const { workoutDays: mockDays, workouts: mockWorkouts } = getGuestMockData(language);
        setWorkoutDays(mockDays);
        setWorkouts(mockWorkouts);
        setLoading(false);
        return;
      }

      const [workoutDaysData, workoutsData] = await Promise.all([
        apiClient.getWorkoutDays(),
        apiClient.getWorkouts()
      ]);

      setWorkoutDays(workoutDaysData as WorkoutDay[] || []);
      setWorkouts(workoutsData as Workout[] || []);
    } catch (error: any) {
      console.error('Error cargando datos:', error);
      setError(language === 'es' ? 'Error cargando entrenamientos' : 'Error loading workouts');
    } finally {
      setLoading(false);
    }
  }, [isGuest, language]);

  // Cargar datos
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Funciones de UI
  const toggleDayExpansion = (date: string) => {
    const newExpanded = new Set(expandedDays);
    const isExpanding = !newExpanded.has(date);
    
    if (!isExpanding) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    
    setExpandedDays(newExpanded);

    if (isExpanding) {
      setTimeout(() => {
        const element = document.querySelector(`[data-date="${date}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 50);
    }
  };

  const handleDeleteWorkout = async (workoutId: number) => {
    setLoadingWorkoutId(workoutId)
    try {
      await apiClient.deleteWorkout(workoutId)
      await loadData()
      setSuccessMessage(language === 'es' ? 'Ejercicio eliminado exitosamente' : 'Exercise deleted successfully')
      window.dispatchEvent(new CustomEvent('socialFeedRefresh'))
    } catch (error) {
      console.error('❌ Error eliminando workout:', error)
      setError(language === 'es' ? 'Error al eliminar el ejercicio. Inténtalo de nuevo.' : 'Error deleting exercise. Please try again.')
    } finally {
      setLoadingWorkoutId(null)
      setDeleteConfirmation({ show: false, workoutId: null })
    }
  }

  const handleConfirmDelete = () => {
    if (deleteConfirmation.workoutId) {
      handleDeleteWorkout(deleteConfirmation.workoutId)
    }
  }

  const handleEditSessionName = (dayId: number, currentName: string) => {
    setEditNameModal({
      show: true,
      dayId,
      currentName,
      newName: currentName
    });
  };

  const handleSaveSessionName = async () => {
    if (!editNameModal.dayId || !editNameModal.newName.trim()) {
      return;
    }

    try {
      await apiClient.updateWorkoutDayName(editNameModal.dayId, editNameModal.newName.trim());

      setWorkoutDays(prevDays =>
        prevDays.map(day =>
          day.id === editNameModal.dayId
            ? { ...day, name: editNameModal.newName.trim() }
            : day
        )
      );

      setEditNameModal({ show: false, dayId: null, currentName: '', newName: '' });
    } catch (error) {
      console.error('Error actualizando nombre del entrenamiento:', error);
      alert(language === 'es' ? 'Error al actualizar el nombre del entrenamiento' : 'Error updating workout name');
    }
  };

  const handleSaveObservation = async () => {
    if (!editObservationModal.workoutId) return;

    try {
      await apiClient.updateWorkout(editObservationModal.workoutId, {
        observations: editObservationModal.currentObservation.trim()
      });

      await loadData();

      if (exerciseModal.show && exerciseModal.exerciseGroup) {
        const updatedGroup = { ...exerciseModal.exerciseGroup };
        const workoutIndex = updatedGroup.workouts.findIndex(w => w.id === editObservationModal.workoutId);
        if (workoutIndex !== -1) {
          updatedGroup.workouts[workoutIndex] = {
            ...updatedGroup.workouts[workoutIndex],
            observations: editObservationModal.currentObservation.trim()
          };
          setExerciseModal(prev => ({ ...prev, exerciseGroup: updatedGroup }));
        }
      }

      setEditObservationModal({ show: false, workoutId: null, currentObservation: '' });
      setSuccessMessage(language === 'es' ? 'Observación actualizada' : 'Observation updated');
    } catch (error) {
      console.error('Error actualizando observación:', error);
      setError(language === 'es' ? 'Error al actualizar la observación' : 'Error updating observation');
    }
  };

  const handleSaveValue = async () => {
    if (!editValueModal.workoutId || !editValueModal.field) return;

    try {
      const numValue = parseFloat(editValueModal.currentValue);
      const updateData = {
        [editValueModal.field]: isNaN(numValue) ? 0 : (editValueModal.field === 'seconds' ? numValue * 60 : numValue)
      };

      await apiClient.updateWorkout(editValueModal.workoutId, updateData);

      await loadData();

      if (exerciseModal.show && exerciseModal.exerciseGroup) {
        const updatedGroup = { ...exerciseModal.exerciseGroup };
        const workoutIndex = updatedGroup.workouts.findIndex(w => w.id === editValueModal.workoutId);
        if (workoutIndex !== -1) {
          updatedGroup.workouts[workoutIndex] = {
            ...updatedGroup.workouts[workoutIndex],
            [editValueModal.field!]: isNaN(numValue) ? 0 : (editValueModal.field === 'seconds' ? numValue * 60 : numValue)
          };
          setExerciseModal(prev => ({ ...prev, exerciseGroup: updatedGroup }));
        }
      }

      setEditValueModal({ show: false, workoutId: null, field: null, currentValue: '' });
      setSuccessMessage(language === 'es' ? 'Valor actualizado' : 'Value updated');
    } catch (error) {
      console.error('Error updating value:', error);
      setError(language === 'es' ? 'Error al actualizar el valor' : 'Error updating value');
    }
  };

  if (loading) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 'calc(100vh - 200px)',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress size={60} thickness={4} sx={{ color: 'primary.main' }} />
        <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
          {translations[language].common.loading}
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }


  return (
    <LocalizationProvider 
      dateAdapter={AdapterDateFns} 
      adapterLocale={language === 'es' ? { ...es, options: { ...es.options, weekStartsOn: 0 } } : enUS}
    >
      <Box sx={{
        p: 1,
        height: '100%',
        overflow: 'hidden'
      }}>

        <Stack spacing={3} sx={{
          height: '100%',
          overflowY: 'auto',
          pr: 0.5,
          '&::-webkit-scrollbar': {
            display: 'none'
          },
          '&::-moz-scrollbar': {
            display: 'none'
          },
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
        <Box sx={{ mb: 2, mt: 1.5, textAlign: 'center' }}>
          <Typography variant="h5" sx={{ 
            fontWeight: 1000, 
            color: 'primary.main', 
            mb: 1,
            letterSpacing: '-0.5px',
            textTransform: 'uppercase',
            fontSize: { xs: '1.25rem', sm: '1.5rem' }
          }}>
            {translations[language].navigation.history}
          </Typography>
          <Typography sx={{ 
            fontSize: '0.800rem',
            lineHeight: 1.43,
            letterSpacing: '0.01071em',
            color: 'rgba(0, 0, 0, 0.6)',
            fontStyle: 'normal',
            opacity: 1,
            fontWeight: 500,
            px: 2,
            textAlign: 'center'
          }}>
            {language === 'es' ? 'Visualiza y filtra tu historial de sesiones' : 'View and filter your workout history'}
          </Typography>
        </Box>

        {/* Calendario de Entrenamientos */}


        {/* Calendario de Entrenamientos */}
        <Card sx={{ 
          mx: 0.5, 
          borderRadius: 3, 
          boxShadow: 2,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          background: 'white',
          minHeight: '360px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <DateCalendar 
            defaultValue={new Date()}
            showDaysOutsideCurrentMonth
            fixedWeekNumber={6}
            shouldDisableDate={(date: Date) => {
              const dateStr = getDateString(date);
              return !trainingDates.has(dateStr);
            }}
            onChange={(newDate: Date | null) => {
              if (newDate) {
                const dayNum = newDate.getDate()
                const monthName = newDate.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { month: 'long' })
                const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1)
                
                const searchString = language === 'es' 
                  ? `${dayNum} de ${capitalizedMonth}`
                  : `${capitalizedMonth} ${dayNum}`
                
                setSearchTerm(searchString)
                setIsCalendarSearch(true)

                setTimeout(() => {
                  resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
              }
            }}
            slots={{
              day: ServerDay,
            }}
            slotProps={{
              day: {
                highlightedDays: trainingDates,
              } as any,
            }}
            sx={{
              width: '100%',
              flexGrow: 1,
              '& .MuiPickersDay-root.Mui-selected': {
                backgroundColor: 'primary.main',
              },
              '& .MuiDayCalendar-header': {
                borderBottom: '1px solid',
                borderColor: 'divider',
                mb: 1
              },
              '& .MuiDayCalendar-monthContainer': {
                minHeight: '240px'
              },
              '& .MuiPickersCalendarHeader-label': {
                textTransform: 'capitalize'
              }
            }}
          />
        </Card>

        {/* Buscador y ordenamiento */}
        <Box sx={{
          p: 3,
          mx: 0.5,
          bgcolor: 'primary.main',
          borderRadius: 3,
          boxShadow: 3,
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: 'white'
        }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              placeholder={language === 'es' ? 'Filtrar mis entrenamientos...' : 'Filter my workouts...'}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsCalendarSearch(false);
              }}
              sx={{
                flex: 1,
                minWidth: 200,
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'transparent',
                  border: '1px solid white',
                  borderRadius: 2,
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                  },
                  '&.Mui-focused': {
                    bgcolor: 'transparent',
                    borderColor: 'white',
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'transparent'
                  }
                },
                '& .MuiInputBase-input': {
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: 500,
                  '&::placeholder': {
                    color: 'rgba(255, 255, 255, 0.7)',
                    opacity: 1
                  }
                }
              }}
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
              {searchTerm ? (
                <IconButton 
                  onClick={() => setSearchTerm('')}
                  sx={{ 
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.3)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                  }}
                >
                  <CloseIcon />
                </IconButton>
              ) : (
                <IconButton 
                  onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                  sx={{ 
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.3)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                  }}
                >
                  {sortOrder === 'desc' ? <ExpandMoreIcon /> : <ExpandLessIcon />}
                </IconButton>
              )}
            </Box>
          </Box>
        </Box>

        {/* Cards de entrenamientos */}
        <Box ref={resultsRef} sx={{ mx: 0.5, pb: filteredWorkoutDays.length > 0 ? 40 : 0 }}>
          {filteredWorkoutDays.map((day) => (
            <WorkoutDayCard
              key={day.workoutDay.date}
              day={day}
              expandedDays={expandedDays}
              toggleDayExpansion={toggleDayExpansion}
              formatDate={formatDate}
              cleanExerciseName={cleanExerciseName}
              getSportEmoji={getSportEmoji}
              loadingWorkoutId={loadingWorkoutId}
              language={language}
              onExerciseClick={(group, workoutDay) => setExerciseModal({ show: true, exerciseGroup: group, workoutDay })}
              onEditSessionName={handleEditSessionName}
            />
          ))}
        </Box>

        {filteredWorkoutDays.length === 0 && (
          <Box sx={{ 
            p: 6, 
            textAlign: 'center', 
            mx: 0.5,
            mb: 15,
            bgcolor: 'rgba(0,0,0,0.02)', 
            borderRadius: 4,
            border: '2px dashed',
            borderColor: 'divider'
          }}>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
              {language === 'es' ? 'Sin resultados' : 'No results'}
            </Typography>
            <Typography color="text.secondary" sx={{ opacity: 0.8 }}>
              {searchTerm 
                ? (language === 'es' ? 'No se encontraron entrenamientos que coincidan con tu búsqueda.' : 'We couldn\'t find any workouts matching your search.')
                : (language === 'es' ? 'Aún no tienes entrenamientos registrados.' : 'You don\'t have any workouts recorded yet.')
              }
            </Typography>
            {searchTerm && (
              <Button 
                onClick={() => setSearchTerm('')}
                sx={{ mt: 3, textTransform: 'none', fontWeight: 600 }}
                variant="outlined"
              >
                {language === 'es' ? 'Limpiar búsqueda' : 'Clear search'}
              </Button>
            )}
          </Box>
        )}

        {/* Alerta de éxito completamente personalizada */}
        {successMessage && (
          <Box
            sx={{
              position: 'fixed',
              top: 32,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '95%',
              maxWidth: '800px',
              zIndex: 99998,
              animation: 'slideDown 0.3s ease-out'
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#e8f5e8',
                color: '#2e7d32',
                border: '1px solid #4caf50',
                borderRadius: 2,
                padding: '12px 16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                fontSize: '0.95rem',
                fontWeight: 500,
                width: '100%'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ fontSize: '1.2rem' }}>✅</Box>
                <Typography sx={{ color: '#2e7d32', fontWeight: 500 }}>
                  {successMessage}
                </Typography>
              </Box>
              <IconButton
                size="small"
                onClick={() => setSuccessMessage('')}
                sx={{
                  color: '#2e7d32',
                  '&:hover': {
                    backgroundColor: 'rgba(46, 125, 50, 0.1)'
                  }
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        )}

        {/* Dialogs */}
        <WorkoutHistoryDialogs
          language={language}
          loadingWorkoutId={loadingWorkoutId}
          formatDate={formatDate}
          editNameModal={editNameModal}
          setEditNameModal={setEditNameModal}
          handleSaveSessionName={handleSaveSessionName}
          deleteConfirmation={deleteConfirmation}
          setDeleteConfirmation={setDeleteConfirmation}
          handleConfirmDelete={handleConfirmDelete}
          setExpandedDays={setExpandedDays}
          editObservationModal={editObservationModal}
          setEditObservationModal={setEditObservationModal}
          handleSaveObservation={handleSaveObservation}
          editValueModal={editValueModal}
          setEditValueModal={setEditValueModal}
          handleSaveValue={handleSaveValue}
          exerciseModal={exerciseModal}
          setExerciseModal={setExerciseModal}
        />

        <Snackbar
          open={!!error}
          autoHideDuration={4000}
          onClose={() => setError('')}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          sx={{
            mt: 6,
            width: { xs: '95%', sm: '90%', md: '70%' },
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 99999
          }}
        >
          <Alert
            severity="error"
            sx={{
              width: '100%',
              minWidth: '300px',
              fontSize: '0.95rem',
              fontWeight: 500,
              backgroundColor: '#ffebee',
              color: '#c62828',
              border: '1px solid #f44336',
              '& .MuiAlert-icon': {
                color: '#c62828'
              }
            }}
          >
            ❌ {error}
          </Alert>
        </Snackbar>
      </Stack>
    </Box>
    </LocalizationProvider>
  )
}
