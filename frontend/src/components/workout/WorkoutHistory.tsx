import { useState, useEffect, useMemo, useCallback } from 'react'
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Stack, 
  Chip, 
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material'
import { 
  ExpandMore as ExpandMoreIcon, 
  ExpandLess as ExpandLessIcon,
  Delete as DeleteIcon,
  ModeEdit as ModeEditIcon,
  Close as CloseIcon
} from '@mui/icons-material'
import { apiClient } from '../../lib/api'
import type { Workout, WorkoutDay, ExerciseGroup, WorkoutDayWithExercises } from '../../types/workout'

export default function WorkoutHistory() {
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



  const formatDate = (dateString: string) => {
    try {
      // Ajustar la fecha para compensar el problema del día de atraso
      const date = new Date(dateString);
      date.setDate(date.getDate() + 1);
      
      const weekdays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
      const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
      
      const weekday = weekdays[date.getDay()]
      const day = date.getDate()
      const month = months[date.getMonth()]
      
      return `${weekday} ${day} de ${month}`
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return dateString;
    }
  }

  // Función para formatear tiempo de deportes en formato legible
  const formatTimeForSport = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${minutes}m`
    }
  }

  // Función para obtener el emoji del deporte
  const getSportEmoji = (exerciseName: string) => {
    const name = exerciseName.toLowerCase()
    if (name.includes('fútbol')) return '⚽'
    if (name.includes('básquet') || name.includes('baloncesto')) return '🏀'
    if (name.includes('pádel')) return '🎾'
    if (name.includes('voley')) return '🏐'
    if (name.includes('bici')) return '🚴'
    if (name.includes('handball')) return '⚾'
    if (name.includes('hockey')) return '🏑'
    if (name.includes('natación')) return '🏊‍♂️'
    if (name.includes('running')) return '🏃‍♂️'
    return null
  }

  // Función para limpiar el nombre del ejercicio (quitar emojis)
  const cleanExerciseName = (exerciseName: string) => {
    // Remover emojis comunes de ejercicios
    return exerciseName
      .replace(/🚴\s*/g, '') // Bici
      .replace(/🏃‍♂️\s*/g, '') // Running
      .replace(/⚽\s*/g, '') // Fútbol
      .replace(/🏀\s*/g, '') // Básquet
      .replace(/🎾\s*/g, '') // Pádel
      .replace(/🏐\s*/g, '') // Voley
      .replace(/⚾\s*/g, '') // Handball
      .replace(/🏑\s*/g, '') // Hockey
      .replace(/🏊‍♂️\s*/g, '') // Natación
      .trim()
  }

  // Agrupar workouts por día y crear días con ejercicios
  const workoutDaysWithExercises = useMemo(() => {
    const days: WorkoutDayWithExercises[] = [];

    // Verificar que los arrays no sean null/undefined
    const safeWorkoutDays = workoutDays || [];
    const safeWorkouts = workouts || [];

    console.log('🔍 Debug workoutDays:', {
      workoutDays: safeWorkoutDays.map(d => ({ 
        id: d.id, 
        date: d.date 
      })),
      workouts: safeWorkouts.map(w => ({ 
        id: w.id, 
        created_at: w.created_at, 
        workout_day_id: w.workout_day_id
      }))
    });

    // Agrupar workouts por workout_day_id
    const workoutsByDay = new Map<number, Workout[]>();
    safeWorkouts.forEach(workout => {
      const dayId = workout.workout_day_id;
      if (!workoutsByDay.has(dayId)) {
        workoutsByDay.set(dayId, []);
      }
      workoutsByDay.get(dayId)!.push(workout);
    });

    console.log('🔍 Workouts agrupados por day_id:', Object.fromEntries(workoutsByDay));

    safeWorkoutDays.forEach(day => {
      // Filtrar workouts por workout_day_id
      const dayWorkouts = workoutsByDay.get(day.id) || [];
      
      console.log(`🔍 Día ${day.id}: encontró ${dayWorkouts.length} workouts`)
      
      // Agrupar ejercicios por nombre
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

      // Solo agregar días que tengan workouts
      if (dayWorkouts.length > 0) {
        days.push({
          workoutDay: day,
          exerciseGroups,
          totalWorkouts: exerciseGroups.length // Usar número de grupos de ejercicios únicos, no total de series
        });
      }
    });

    console.log('🔍 WorkoutHistory Debug:', {
      workoutDaysCount: safeWorkoutDays.length,
      workoutsCount: safeWorkouts.length,
      workoutDaysWithExercisesCount: days.length
    });

    return days;
  }, [workoutDays, workouts]);

  // Filtrar días
  const filteredWorkoutDays = useMemo(() => {
    let filtered = workoutDaysWithExercises;
    
    // Filtrar por término de búsqueda
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(day => {
        // Buscar en fecha formateada (ej: "Lunes 12 de Agosto")
        const formattedDate = formatDate(day.workoutDay.date);
        const dateMatch = formattedDate.toLowerCase().includes(searchLower);
        
        // Buscar en nombre de ejercicios
        const exerciseMatch = day.exerciseGroups.some(group => 
          group.exerciseName.toLowerCase().includes(searchLower)
        );
        
        // Buscar en observaciones de workouts
        const observationMatch = day.exerciseGroups.some(group =>
          group.workouts.some(workout => 
            workout.observations && workout.observations.toLowerCase().includes(searchLower)
          )
        );
        
        // Buscador
        const workoutDataMatch = day.exerciseGroups.some(group =>
          group.workouts.some(workout => 
            workout.weight.toString().includes(searchLower) ||
            workout.reps.toString().includes(searchLower) ||
            (workout.seconds && workout.seconds.toString().includes(searchLower))
          )
        );
        
        return dateMatch || exerciseMatch || observationMatch || workoutDataMatch;
      });
    }
    
    // Ordenar por fecha (más recientes primero)
    filtered.sort((a, b) => {
      const dateA = new Date(a.workoutDay.date);
      const dateB = new Date(b.workoutDay.date);
      return dateB.getTime() - dateA.getTime();
    });
    
    return filtered;
  }, [workoutDaysWithExercises, searchTerm]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      const [workoutDaysData, workoutsData] = await Promise.all([
        apiClient.getWorkoutDays(),
        apiClient.getWorkouts()
      ]);
      
      setWorkoutDays(workoutDaysData as WorkoutDay[] || []);
      setWorkouts(workoutsData as Workout[] || []);
    } catch (error: any) {
      console.error('Error cargando datos:', error);
      setError('Error cargando entrenamientos');
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar datos
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Funciones de UI
  const toggleDayExpansion = (date: string) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDays(newExpanded);
  };

  const handleDeleteWorkout = async (workoutId: number) => {
    console.log('🔍 handleDeleteWorkout llamado con ID:', workoutId)
    setLoadingWorkoutId(workoutId)
    try {
      console.log('🔍 Llamando a apiClient.deleteWorkout...')
      await apiClient.deleteWorkout(workoutId)
      console.log('🔍 Workout eliminado exitosamente')
      // Recargar datos después de eliminar
      await loadData()
      console.log('🔍 Datos recargados')
      setSuccessMessage('Ejercicio eliminado exitosamente')
      
      // Disparar evento para actualizar el feed social
      console.log('🔄 Disparando evento de actualización del feed social después de eliminar')
      window.dispatchEvent(new CustomEvent('socialFeedRefresh'))
    } catch (error) {
      console.error('❌ Error eliminando workout:', error)
      setError('Error al eliminar el ejercicio. Inténtalo de nuevo.')
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
      
      // Actualizar el estado local
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
      alert('Error al actualizar el nombre del entrenamiento');
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
          Cargando entrenamientos...
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
    <Box sx={{ p: 1 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3, fontWeight: 'bold', textAlign: 'center', color: 'primary.main' }}>
        Entrenamientos
      </Typography>
      
      <Stack spacing={3}>
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
            placeholder="Buscar por fecha, ejercicios, etc..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
          

        </Box>
      </Box>

        {/* Cards de entrenamientos */}
        <Box sx={{ mx: 0.5 }}>
          {filteredWorkoutDays.map((day) => (
            <Box key={day.workoutDay.date} sx={{ position: 'relative', mb: 2 }}>
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
                          handleEditSessionName(day.workoutDay.id, day.workoutDay.name);
                        }}
                      />
                    </Box>
                    {!expandedDays.has(day.workoutDay.date) && (
                      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'left', mt: 0.5 }}>
                        {day.totalWorkouts} {day.totalWorkouts === 1 ? 'ejercicio' : 'ejercicios'} 
                        {day.exerciseGroups.length > 0 && (
                          <span> ({day.exerciseGroups.reduce((total, group) => total + group.workouts.length, 0)} series en total)</span>
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
                      onClick={() => setExerciseModal({ show: true, exerciseGroup: group, workoutDay: day.workoutDay })}
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

          {/* Modal de confirmación de eliminación */}
          <Dialog
            open={deleteConfirmation.show}
            onClose={() => {
              setDeleteConfirmation({ show: false, workoutId: null });
              // Mantener cerrada la sección expandida
              setExpandedDays(new Set());
            }}
            maxWidth="sm"
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                border: '1px solid',
                borderColor: 'divider'
              }
            }}
          >
            <DialogTitle sx={{ 
              pb: 2, 
              borderBottom: 1, 
              borderColor: 'divider',
              textAlign: 'center',
              fontWeight: 600,
              color: 'error.main'
            }}>
              ⚠️ Confirmar eliminación
            </DialogTitle>
            <DialogContent sx={{ py: 2, px: 3 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  Esta acción no se puede deshacer. El ejercicio será eliminado permanentemente.
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 1, gap: 2, justifyContent: 'center' }}>
              <Button 
                onClick={() => {
                  setDeleteConfirmation({ show: false, workoutId: null });
                  // Mantener cerrada la sección expandida
                  setExpandedDays(new Set());
                }}
                variant="outlined"
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '0.95rem',
                  borderColor: 'grey.400',
                  color: 'text.primary',
                  '&:hover': {
                    borderColor: 'grey.600',
                    backgroundColor: 'grey.50'
                  }
                }}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleConfirmDelete} 
                color="error" 
                variant="contained"
                disabled={loadingWorkoutId !== null}
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '0.95rem',
                  backgroundColor: '#d32f2f',
                  '&:hover': {
                    backgroundColor: '#c62828'
                  },
                  '&:disabled': {
                    backgroundColor: '#ffcdd2',
                    color: '#c62828'
                  }
                }}
              >
                {loadingWorkoutId !== null ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={16} color="inherit" />
                    Eliminando...
                  </Box>
                ) : (
                  'Eliminar'
                )}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Modal de ejercicio individual */}
          <Dialog
            open={exerciseModal.show}
            onClose={() => setExerciseModal({ show: false, exerciseGroup: null, workoutDay: null })}
            maxWidth="md"
            fullWidth

            BackdropProps={{
              sx: {
                backgroundColor: 'rgba(0, 0, 0, 0.1) !important'
              }
            }}
            sx={{
              '& .MuiBackdrop-root': {
                backgroundColor: 'rgba(0, 0, 0, 0.1) !important'
              },
              '& .MuiDialog-paper': {
                backgroundColor: 'background.paper',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                border: '1px solid',
                borderColor: 'divider'
              }
            }}
          >
            <DialogTitle sx={{ 
              pb: 1, 
              borderBottom: 1, 
              borderColor: 'divider',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                {exerciseModal.exerciseGroup?.exerciseName}
              </Typography>
              <IconButton 
                onClick={() => setExerciseModal({ show: false, exerciseGroup: null, workoutDay: null })}
                size="small"
              >
                <ExpandLessIcon />
              </IconButton>
            </DialogTitle>
            
            <DialogContent sx={{ p: { xs: 2, sm: 3 }, pt: 2 }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ margin: '8px 0px -16px' }}>
                  {exerciseModal.workoutDay ? formatDate(exerciseModal.workoutDay.date) : ''}
                </Typography>
              </Box>

              <Stack spacing={2}>
                {exerciseModal.exerciseGroup?.workouts
                  .sort((a, b) => a.set - b.set) // Ordenar por número de serie ascendente
                  .map((workout, workoutIndex) => (
                  <Card key={workoutIndex} sx={{ 
                    boxShadow: 1, 
                    border: '1px solid',
                    borderColor: 'divider',
                    position: 'relative',
                    filter: loadingWorkoutId === workout.id ? 'blur(2px)' : 'none',
                    transition: 'all 0.3s ease-in-out'
                  }}>
                    {/* Loader overlay cuando se está eliminando */}
                    {loadingWorkoutId === workout.id && (
                      <Box sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        borderRadius: 1,
                        zIndex: 10
                      }}>
                        <CircularProgress size={40} sx={{ color: 'primary.main' }} />
                      </Box>
                    )}
                    <CardContent sx={{ 
                      p: 2
                    }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            {workout.is_sport || workout.exercise_name.toLowerCase().includes('running') || workout.exercise_name.toLowerCase().includes('bici') ? 
                              getSportEmoji(workout.exercise_name) || `Serie nº${workout.set}` : 
                              `Serie nº${workout.set}`
                            }
                          </Typography>
                          
                          <Stack direction="row" spacing={1} alignItems="center">
                            {/* Para deportes, mostrar solo el tiempo formateado */}
                            {workout.is_sport ? (
                              workout.seconds && workout.seconds > 0 && (
                                <Chip 
                                  label={formatTimeForSport(workout.seconds)} 
                                  variant="outlined" 
                                  size="small"
                                  sx={{ 
                                    fontWeight: 'bold',
                                    borderColor: '#ff9800',
                                    color: '#ff9800',
                                    minWidth: '80px',
                                    '&:hover': {
                                      backgroundColor: '#ff9800',
                                      color: 'white'
                                    }
                                  }}
                                />
                              )
                            ) : (
                              /* Para ejercicios normales, mostrar solo peso y reps */
                              <>
                                <Chip 
                                  label={workout.weight === 0 ? 'Peso corporal' : `${workout.weight}${workout.exercise_name.toLowerCase().includes('running') || workout.exercise_name.toLowerCase().includes('bici') ? 'km' : 'kg'}`}
                                  variant="outlined" 
                                  size="small"
                                  sx={{ 
                                    fontWeight: 'bold',
                                    borderColor: '#2196f3',
                                    color: '#2196f3',
                                    minWidth: workout.weight === 0 ? '100px' : '60px',
                                    '&:hover': {
                                      backgroundColor: '#2196f3',
                                      color: 'white'
                                    }
                                  }}
                                />
                                {!workout.exercise_name.toLowerCase().includes('running') && !workout.exercise_name.toLowerCase().includes('bici') && (
                                  <Chip 
                                    label={`${workout.reps} reps`} 
                                    variant="outlined" 
                                    size="small"
                                    sx={{ 
                                      fontWeight: 'bold',
                                      borderColor: '#4caf50',
                                      color: '#4caf50',
                                      minWidth: '60px',
                                      '&:hover': {
                                        backgroundColor: '#4caf50',
                                        color: 'white'
                                      }
                                    }}
                                  />
                                )}
                              </>
                            )}
                          </Stack>
                        </Box>
                        
                        <IconButton
                          onClick={(e) => {
                            console.log('🔍 Botón eliminar clickeado para workout ID:', workout.id)
                            e.stopPropagation();
                            setExerciseModal({ show: false, exerciseGroup: null, workoutDay: null });
                            setDeleteConfirmation({ show: true, workoutId: workout.id });
                          }}
                          size="small"
                          sx={{ 
                            color: 'error.main',
                            opacity: 0.7,
                            '&:hover': { opacity: 1 }
                          }}
                          disabled={loadingWorkoutId === workout.id}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                      
                      {workout.observations && (
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', pt: 1, borderTop: 1, borderColor: 'divider' }}>
                          "{workout.observations}"
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </DialogContent>
            
            <DialogActions sx={{ p: { xs: 2, sm: 3 }, pt: 1, justifyContent: 'center' }}>
              <Button 
                onClick={() => setExerciseModal({ show: false, exerciseGroup: null, workoutDay: null })}
                variant="contained"
                sx={{
                  px: 4,
                  py: 1,
                  borderRadius: 2,
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '0.95rem',
                  backgroundColor: '#1976d2',
                  '&:hover': {
                    backgroundColor: '#1565c0'
                  }
                }}
              >
                Cerrar
              </Button>
            </DialogActions>
          </Dialog>
            </Box>
          ))}
        </Box>

        {filteredWorkoutDays.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              {searchTerm ? 'No se encontraron entrenamientos con esa búsqueda' : 'No hay entrenamientos registrados'}
            </Typography>
          </Box>
        )}

        {/* Alerta de éxito completamente personalizada */}
        {successMessage && (
          <Box
            sx={{
              position: 'fixed',
              bottom: 32,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '95%',
              maxWidth: '800px',
              zIndex: 99998,
              animation: 'slideUp 0.3s ease-out'
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

        {/* Modal de edición de nombre */}
        <Dialog
          open={editNameModal.show}
          onClose={() => setEditNameModal({ show: false, dayId: null, currentName: '', newName: '' })}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              border: '1px solid',
              borderColor: 'divider'
            }
          }}
        >
          <DialogTitle sx={{ 
            pb: 1,
            fontWeight: 600,
            fontSize: '1.2rem',
            color: 'primary.main',
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}>
            Editar nombre
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <TextField
              autoFocus
              fullWidth
              placeholder="Nombre del entrenamiento"
              value={editNameModal.newName}
              onChange={(e) => setEditNameModal(prev => ({ ...prev, newName: e.target.value }))}
              variant="outlined"
              sx={{
                mt: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'primary.main'
                    }
                  }
                }
              }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 1 }}>
            <Button
              onClick={() => setEditNameModal({ show: false, dayId: null, currentName: '', newName: '' })}
              sx={{
                px: 3,
                py: 1,
                borderRadius: 2,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.95rem',
                color: 'text.secondary',
                border: '1px solid',
                borderColor: 'divider',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)'
                }
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveSessionName}
              disabled={!editNameModal.newName.trim() || editNameModal.newName.trim() === editNameModal.currentName}
              variant="contained"
              sx={{
                px: 4,
                py: 1,
                borderRadius: 2,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.95rem',
                backgroundColor: '#1976d2',
                '&:hover': {
                  backgroundColor: '#1565c0'
                }
              }}
            >
              Guardar
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar para mensajes de error */}
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
  )
}
