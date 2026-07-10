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
  CircularProgress
} from '@mui/material'
import {
  Delete as DeleteIcon,
  ModeEdit as ModeEditIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material'
import { translations } from '../../i18n/translations'
import { formatTimeForSport } from '../../lib/dateUtils'
import { getSportEmoji } from '../../lib/exerciseUtils'
import type { ExerciseGroup, WorkoutDay } from '../../types/workout'

interface EditNameModalState {
  show: boolean
  dayId: number | null
  currentName: string
  newName: string
}

interface DeleteConfirmationState {
  show: boolean
  workoutId: number | null
}

interface EditObservationModalState {
  show: boolean
  workoutId: number | null
  currentObservation: string
}

interface EditValueModalState {
  show: boolean
  workoutId: number | null
  field: 'weight' | 'reps' | 'seconds' | null
  currentValue: string
  unit?: string
}

interface ExerciseModalState {
  show: boolean
  exerciseGroup: ExerciseGroup | null
  workoutDay: WorkoutDay | null
}

interface WorkoutHistoryDialogsProps {
  language: 'es' | 'en'
  loadingWorkoutId: number | null
  formatDate: (dateString: string) => string

  // Edit name modal
  editNameModal: EditNameModalState
  setEditNameModal: (state: EditNameModalState) => void
  handleSaveSessionName: () => void

  // Delete confirmation modal
  deleteConfirmation: DeleteConfirmationState
  setDeleteConfirmation: (state: DeleteConfirmationState) => void
  handleConfirmDelete: () => void
  setExpandedDays: (days: Set<string>) => void

  // Edit observation modal
  editObservationModal: EditObservationModalState
  setEditObservationModal: (state: EditObservationModalState) => void
  handleSaveObservation: () => void

  // Edit value modal
  editValueModal: EditValueModalState
  setEditValueModal: (state: EditValueModalState) => void
  handleSaveValue: () => void

  // Exercise detail modal
  exerciseModal: ExerciseModalState
  setExerciseModal: (state: ExerciseModalState) => void
}

export default function WorkoutHistoryDialogs({
  language,
  loadingWorkoutId,
  formatDate,
  editNameModal,
  setEditNameModal,
  handleSaveSessionName,
  deleteConfirmation,
  setDeleteConfirmation,
  handleConfirmDelete,
  setExpandedDays,
  editObservationModal,
  setEditObservationModal,
  handleSaveObservation,
  editValueModal,
  setEditValueModal,
  handleSaveValue,
  exerciseModal,
  setExerciseModal
}: WorkoutHistoryDialogsProps) {
  return (
    <>
      {/* Modal de edición de nombre */}
      <Dialog
        open={editNameModal.show}
        onClose={(_, reason) => {
          if (reason !== 'backdropClick') setEditNameModal({ show: false, dayId: null, currentName: '', newName: '' })
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
            onChange={(e) => setEditNameModal({ ...editNameModal, newName: e.target.value })}
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

      {/* Modal de confirmación de eliminación */}
      <Dialog
        open={deleteConfirmation.show}
        onClose={(_, reason) => {
          if (reason !== 'backdropClick') {
            setDeleteConfirmation({ show: false, workoutId: null });
            setExpandedDays(new Set());
          }
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
          textAlign: 'center',
          fontWeight: 600,
          color: 'error.main'
        }}>
          ⚠️ {language === 'es' ? 'Confirmar eliminación' : 'Confirm deletion'}
        </DialogTitle>
        <DialogContent sx={{ py: 2, px: 3 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary" sx={{ pb: 1 }}>
              {language === 'es' ? 'Esta acción no se puede deshacer. El ejercicio será eliminado permanentemente.' : 'This action cannot be undone. The exercise will be permanently deleted.'}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1, gap: 2, justifyContent: 'center' }}>
          <Button
            onClick={() => {
              setDeleteConfirmation({ show: false, workoutId: null });
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
            {translations[language].common.cancel}
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
                {language === 'es' ? 'Eliminando...' : 'Deleting...'}
              </Box>
            ) : (
              translations[language].common.delete
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de edición de observación */}
      <Dialog
        open={editObservationModal.show}
        onClose={(_, reason) => {
          if (reason !== 'backdropClick') setEditObservationModal({ show: false, workoutId: null, currentObservation: '' })
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
          pb: 1,
          fontWeight: 600,
          fontSize: '1.2rem',
          color: 'primary.main',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          {language === 'es' ? 'Editar observación' : 'Edit observation'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            autoFocus
            fullWidth
            multiline
            rows={4}
            placeholder={language === 'es' ? 'Escribe una observación...' : 'Write an observation...'}
            value={editObservationModal.currentObservation}
            onChange={(e) => setEditObservationModal({ ...editObservationModal, currentObservation: e.target.value })}
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
            onClick={() => setEditObservationModal({ show: false, workoutId: null, currentObservation: '' })}
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
            {language === 'es' ? 'Cancelar' : 'Cancel'}
          </Button>
          <Button
            onClick={handleSaveObservation}
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
            {language === 'es' ? 'Guardar' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de ejercicio individual */}
      <Dialog
        open={exerciseModal.show}
        onClose={(_, reason) => {
          if (reason !== 'backdropClick') setExerciseModal({ show: false, exerciseGroup: null, workoutDay: null })
        }}
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
            borderColor: 'divider',
            width: { xs: '98%', sm: '100%' },
            maxWidth: { xs: '98%', sm: '900px' },
            margin: { xs: '8px', sm: 'auto' }
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

          {/* Observación general de la serie */}
          {(() => {
            const workouts = exerciseModal.exerciseGroup?.workouts || [];
            const sortedWorkouts = [...workouts].sort((a, b) => b.id - a.id);

            const latestWorkout = sortedWorkouts[0];
            const latestObsWorkout = sortedWorkouts.find(w => w.observations);
            const latestObs = latestObsWorkout?.observations;

            return (
              <Box sx={{ mb: 3 }}>
                {latestObs ? (
                  <Box sx={{
                    p: 2,
                    backgroundColor: 'rgba(25, 118, 210, 0.05)',
                    borderRadius: 2,
                    borderLeft: '4px solid',
                    borderColor: 'primary.main',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    position: 'relative'
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="subtitle2" color="primary.main" sx={{ fontWeight: 600, mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                        📝 {language === 'es' ? 'Observación general' : 'General observation'}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setEditObservationModal({
                            show: true,
                            workoutId: latestWorkout?.id || null,
                            currentObservation: latestObs
                          });
                        }}
                        sx={{ mt: -1, mr: -1, color: 'primary.main', opacity: 0.7 }}
                      >
                        <ModeEditIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: '0.95rem' }}>
                      &ldquo;{latestObs}&rdquo;
                    </Typography>
                  </Box>
                ) : (
                  latestWorkout && (
                    <Button
                      startIcon={<ModeEditIcon />}
                      size="small"
                      onClick={() => {
                        setEditObservationModal({
                          show: true,
                          workoutId: latestWorkout.id,
                          currentObservation: ''
                        });
                      }}
                      sx={{
                        textTransform: 'none',
                        color: 'text.secondary',
                        borderColor: 'divider',
                        py: 1.2,
                        borderRadius: 2
                      }}
                      variant="outlined"
                      fullWidth
                    >
                      {language === 'es' ? 'Agregar observación general' : 'Add general observation'}
                    </Button>
                  )
                )}
              </Box>
            );
          })()}

          <Stack spacing={2}>
            {exerciseModal.exerciseGroup?.workouts && [...exerciseModal.exerciseGroup.workouts]
              .sort((a, b) => a.set - b.set)
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
                    p: 2,
                    '&:last-child': { pb: 2 }
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                          {workout.is_sport || workout.exercise_name.toLowerCase().includes('running') || workout.exercise_name.toLowerCase().includes('bici') ?
                            getSportEmoji(workout.exercise_name) || (language === 'es' ? `Serie nº${workout.set}` : `Set #${workout.set}`) :
                            (language === 'es' ? `Serie nº${workout.set}` : `Set #${workout.set}`)
                          }
                        </Typography>

                        <Stack direction="row" spacing={1} alignItems="center">
                          {/* Para deportes, mostrar solo el tiempo formateado */}
                          {workout.is_sport ? (
                            workout.seconds && workout.seconds > 0 && (
                              <Chip
                                label={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                                    {formatTimeForSport(workout.seconds)}
                                    <ModeEditIcon className="edit-icon" sx={{ fontSize: '0.9rem', opacity: 0, transition: 'opacity 0.2s' }} />
                                  </Box>
                                }
                                variant="outlined"
                                size="small"
                                sx={{
                                  fontWeight: 'bold',
                                  borderColor: '#ff9800',
                                  color: '#ff9800',
                                  transition: 'all 0.2s',
                                  '&:hover': {
                                    backgroundColor: 'rgba(255, 152, 0, 0.08)',
                                    cursor: 'pointer',
                                    '& .edit-icon': { opacity: 1, width: 'auto', ml: 0.5 }
                                  },
                                  '& .edit-icon': { width: 0, overflow: 'hidden' }
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditValueModal({
                                    show: true,
                                    workoutId: workout.id,
                                    field: 'seconds',
                                    currentValue: Math.floor((workout.seconds || 0) / 60).toString(),
                                    unit: 'min'
                                  });
                                }}
                              />
                            )
                          ) : (
                            /* Para ejercicios normales, mostrar solo peso y reps */
                            <>
                              <Chip
                                label={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                                    {workout.weight === 0 ? (language === 'es' ? 'Peso corporal' : 'Bodyweight') : `${workout.weight}${workout.exercise_name.toLowerCase().includes('running') || workout.exercise_name.toLowerCase().includes('bici') ? 'km' : 'kg'}`}
                                    <ModeEditIcon className="edit-icon" sx={{ fontSize: '0.9rem', opacity: 0, transition: 'opacity 0.2s' }} />
                                  </Box>
                                }
                                variant="outlined"
                                size="small"
                                sx={{
                                  fontWeight: 'bold',
                                  borderColor: '#2196f3',
                                  color: '#2196f3',
                                  transition: 'all 0.2s',
                                  '&:hover': {
                                    backgroundColor: 'rgba(33, 150, 243, 0.08)',
                                    cursor: 'pointer',
                                    '& .edit-icon': { opacity: 1, width: 'auto', ml: 0.5 }
                                  },
                                  '& .edit-icon': { width: 0, overflow: 'hidden' }
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditValueModal({
                                    show: true,
                                    workoutId: workout.id,
                                    field: 'weight',
                                    currentValue: workout.weight.toString(),
                                    unit: workout.exercise_name.toLowerCase().includes('running') || workout.exercise_name.toLowerCase().includes('bici') ? 'km' : 'kg'
                                  });
                                }}
                              />
                              {!workout.exercise_name.toLowerCase().includes('running') && !workout.exercise_name.toLowerCase().includes('bici') && (
                                <Chip
                                  label={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                                      {`${workout.reps} reps`}
                                      <ModeEditIcon className="edit-icon" sx={{ fontSize: '0.9rem', opacity: 0, transition: 'opacity 0.2s' }} />
                                    </Box>
                                  }
                                  variant="outlined"
                                  size="small"
                                  sx={{
                                    fontWeight: 'bold',
                                    borderColor: '#4caf50',
                                    color: '#4caf50',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                      backgroundColor: 'rgba(76, 175, 80, 0.08)',
                                      cursor: 'pointer',
                                      '& .edit-icon': { opacity: 1, width: 'auto', ml: 0.5 }
                                    },
                                    '& .edit-icon': { width: 0, overflow: 'hidden' }
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditValueModal({
                                      show: true,
                                      workoutId: workout.id,
                                      field: 'reps',
                                      currentValue: workout.reps.toString(),
                                      unit: 'reps'
                                    });
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

      {/* Modal de edición de valor (peso/reps) */}
      <Dialog
        open={editValueModal.show}
        onClose={(_, reason) => {
          if (reason !== 'backdropClick') setEditValueModal({ show: false, workoutId: null, field: null, currentValue: '' })
        }}
        maxWidth="xs"
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
          {language === 'es' ? 'Editar valor' : 'Edit value'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            autoFocus
            fullWidth
            type="number"
            label={editValueModal.unit}
            value={editValueModal.currentValue}
            onChange={(e) => setEditValueModal({ ...editValueModal, currentValue: e.target.value })}
            variant="outlined"
            sx={{
              mt: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2
              }
            }}
            onFocus={(e) => e.target.select()}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={() => setEditValueModal({ show: false, workoutId: null, field: null, currentValue: '' })}
            sx={{
              px: 3,
              py: 1,
              borderRadius: 2,
              color: 'text.secondary'
            }}
          >
            {language === 'es' ? 'Cancelar' : 'Cancel'}
          </Button>
          <Button
            onClick={handleSaveValue}
            variant="contained"
            sx={{
              px: 4,
              py: 1,
              borderRadius: 2,
              backgroundColor: '#1976d2'
            }}
          >
            {language === 'es' ? 'Guardar' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
