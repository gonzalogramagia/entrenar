import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Fab,
  TextField
} from '@mui/material'
import {
  Add as AddIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  FitnessCenter as FitnessCenterIcon,
  Close as CloseIcon,
  Autorenew as AutorenewIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material'
import { apiClient } from '../../lib/api'
import type { RoutineWithExercises, CreateRoutineRequest, UpdateRoutineRequest } from '../../types/routine'
import RoutineForm from './RoutineForm'
import RoutineDetail from './RoutineDetail'
import { useUserSettings } from '../../contexts/UserSettingsContext'
import { useLanguage } from '../../contexts/LanguageContext'
import { translations } from '../../i18n/translations'
import { useAuth } from '../../contexts/AuthContext'

interface RoutineListProps {
  activeRoutine?: any
  routineProgress?: number
}

const RoutineList: React.FC<RoutineListProps> = ({ activeRoutine, routineProgress = 0 }) => {
  const { language } = useLanguage()
  const t = translations[language].routines
  const { getRoutineProgress, resetCompletedExercisesForDate } = useUserSettings()
  const { isGuest, signInWithGoogle } = useAuth()
  const [routines, setRoutines] = useState<RoutineWithExercises[]>([])

  // Función para detectar si una rutina está completa
  const isRoutineComplete = (routine: any) => {
    const today = new Date().toISOString().split('T')[0]
    return getRoutineProgress(today, routine.id, routine) === 100
  }
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openCreateDialog, setOpenCreateDialog] = useState(false)
  const [openEditDialog, setOpenEditDialog] = useState(false)
  const [openDetailDialog, setOpenDetailDialog] = useState(false)
  const [selectedRoutine, setSelectedRoutine] = useState<RoutineWithExercises | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingRoutineId, setDeletingRoutineId] = useState<number | null>(null)
  const [editNameModal, setEditNameModal] = useState<{
    show: boolean
    routineId: number | null
    currentName: string
    newName: string
  }>({
    show: false,
    routineId: null,
    currentName: '',
    newName: ''
  })

  const loadRoutines = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      if (isGuest) {
        // Rutina de prueba para modo invitado
        const mockRoutine: RoutineWithExercises = {
          id: 9999,
          user_id: 'guest',
          name: 'Rutina de Test',
          is_active: true,
          total_exercises: 3,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          exercises: [
            {
              id: 9995,
              routine_id: 9999,
              exercise_id: 100,
              exercise_name: language === 'es' ? 'Calentamiento Dinámico' : 'Dynamic Warm Up',
              sets: 1,
              reps: 1,
              weight: 0,
              order_index: 0,
              rest_time_seconds: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: 9996,
              routine_id: 9999,
              exercise_id: 1,
              exercise_name: 'Press de Banca',
              sets: 1,
              reps: 10,
              weight: 60,
              order_index: 1,
              rest_time_seconds: 60,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: 9997,
              routine_id: 9999,
              exercise_id: 2,
              exercise_name: 'Sentadilla',
              sets: 1,
              reps: 12,
              weight: 80,
              order_index: 2,
              rest_time_seconds: 90,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: 9998,
              routine_id: 9999,
              exercise_id: 3,
              exercise_name: 'Peso Muerto',
              sets: 1,
              reps: 8,
              weight: 100,
              order_index: 3,
              rest_time_seconds: 120,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: 9999,
              routine_id: 9999,
              exercise_id: 101,
              exercise_name: language === 'es' ? 'Estiramiento' : 'Stretching',
              sets: 1,
              reps: 1,
              weight: 0,
              order_index: 4,
              rest_time_seconds: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ]
        }
        setRoutines([mockRoutine])
        setLoading(false)
        return
      }

      const data = await apiClient.getUserRoutines()

      if (Array.isArray(data)) {
        const fullRoutines = await Promise.all(
          data.map(async (routine: any) => {
            try {
              return await apiClient.getUserRoutine(routine.id) as RoutineWithExercises
            } catch (error) {
              console.error(`Error cargando rutina ${routine.id}:`, error)
              return routine
            }
          })
        )
        setRoutines(fullRoutines)
      } else {
        setRoutines([])
      }
    } catch (err) {
      console.error('❌ RoutineList - Error cargando rutinas:', err)
      setError('Error al cargar las rutinas')
      setRoutines([])
    } finally {
      setLoading(false)
    }
  }, [isGuest])

  useEffect(() => {
    loadRoutines()
  }, [loadRoutines])

  const handleCreateRoutine = async (routineData: CreateRoutineRequest | UpdateRoutineRequest) => {
    if (isGuest) {
      signInWithGoogle()
      return
    }
    try {
      await apiClient.createUserRoutine(routineData as CreateRoutineRequest)
      setOpenCreateDialog(false)
      loadRoutines()
    } catch (err) {
      console.error('Error creando rutina:', err)
      setError('Error al crear la rutina')
    }
  }

  const handleEditRoutine = async (id: number, routineData: UpdateRoutineRequest): Promise<void> => {
    try {
      await apiClient.updateUserRoutine(id, routineData)

      // Recargar todas las rutinas para obtener los datos actualizados del servidor
      await loadRoutines()

      setOpenEditDialog(false)
      setSelectedRoutine(null)
    } catch (err) {
      console.error('❌ Error actualizando rutina:', err)
      setError('Error al actualizar la rutina')
    }
  }

  // Ordenar rutinas (sin filtrado)
  const sortedRoutines = routines.sort((a, b) => {
    // La rutina activa siempre va primero
    if (activeRoutine?.id === a.id) return -1
    if (activeRoutine?.id === b.id) return 1

    // Luego ordenar por fecha de creación (más recientes primero)
    const dateA = new Date(a.created_at).getTime()
    const dateB = new Date(b.created_at).getTime()
    return dateB - dateA
  })

  const handleDeleteRoutine = async (id: number) => {
    try {
      setDeletingRoutineId(id)
      await apiClient.deleteUserRoutine(id)
      setDeleteDialogOpen(false)
      setDeletingRoutineId(null)
      loadRoutines()
    } catch (err) {
      console.error('Error eliminando rutina:', err)
      setError('Error al eliminar la rutina')
      setDeletingRoutineId(null)
    }
  }

  const handleViewRoutine = (routine: RoutineWithExercises) => {
    try {
      // Usar la rutina que ya tenemos cargada
      setSelectedRoutine(routine)
      setOpenDetailDialog(true)
    } catch (error) {
      console.error('Error abriendo detalles de la rutina:', error)
      setError('Error al abrir los detalles de la rutina')
    }
  }






  const handleSaveRoutineName = async () => {
    if (!editNameModal.routineId || !editNameModal.newName.trim()) {
      return
    }

    try {
      await apiClient.updateUserRoutine(editNameModal.routineId, { name: editNameModal.newName.trim() })

      // Actualizar el estado local
      setRoutines(prevRoutines =>
        prevRoutines.map(routine =>
          routine.id === editNameModal.routineId
            ? { ...routine, name: editNameModal.newName.trim() }
            : routine
        )
      )

      setEditNameModal({ show: false, routineId: null, currentName: '', newName: '' })
    } catch (error) {
      console.error('Error actualizando nombre de la rutina:', error)
      setError('Error al actualizar el nombre de la rutina')
    }
  }



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
    )
  }

  return (
    <Box sx={{
      p: { xs: 0.5, sm: 1.5 },
      height: (!routines || routines.length === 0) ? 'auto' : '100%',
      overflow: (!routines || routines.length === 0) ? 'visible' : 'visible'
    }}>

      <Box sx={{ mb: 4, mt: 1.5, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ 
          fontWeight: 1000, 
          color: 'primary.main', 
          mb: 1,
          letterSpacing: '-0.5px',
          textTransform: 'uppercase',
          fontSize: { xs: '1.25rem', sm: '1.5rem' }
        }}>
          {t.title}
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
          {t.subtitle}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {(!routines || routines.length === 0) ? (
        <Card
          elevation={3}
          sx={{
            textAlign: 'center',
            py: 6,
            mx: { xs: 1, sm: 0 },
            border: '2px solid',
            borderColor: 'grey.300',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
          }}
        >
          <CardContent>
            <FitnessCenterIcon sx={{
              fontSize: 80,
              color: 'primary.main',
              mb: 3,
              opacity: 0.7
            }} />
            <Typography
              variant="h4"
              color="primary.main"
              gutterBottom
              sx={{ fontWeight: 700, mb: 2 }}
            >
              {t.noRoutines}
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{
                mb: 3,
                maxWidth: '400px',
                mx: 'auto',
                lineHeight: 1.6
              }}
            >
              {t.createFirst}
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon sx={{ color: '#fff' }} />}
              onClick={() => {
                if (isGuest) {
                  signInWithGoogle()
                  return
                }
                setOpenCreateDialog(true)
              }}
              sx={{
                fontWeight: 600,
                borderRadius: '12px',
                px: 4,
                py: 1.5,
                textTransform: 'none',
                fontSize: '1.1rem',
                backgroundColor: '#ffc107',
                color: '#fff',
                '&:hover': {
                  backgroundColor: '#ffb300'
                }
              }}
            >
              {t.create}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{
          height: '100%',
          overflow: 'auto',
          '&::-webkit-scrollbar': {
            display: 'none'
          },
          '&::-moz-scrollbar': {
            display: 'none'
          },
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>

          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            width: '100%',
            px: 0.5,
            py: 1,
            overflow: 'visible'
          }}>
            {sortedRoutines?.map((routine) => (
              <Card
                key={routine.id}
                elevation={0}
                onClick={() => handleViewRoutine(routine)}
                sx={{
                  width: '100%',
                  minWidth: 0,
                  maxWidth: '100%',
                  border: '1px solid',
                  borderColor: isRoutineComplete(routine) ? 'success.main' : (activeRoutine?.id === routine.id ? '#FFB732' : 'rgba(0,0,0,0.08)'),
                  borderRadius: '20px',
                  overflow: 'visible',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  cursor: 'pointer',
                  backgroundColor: isRoutineComplete(routine)
                    ? 'rgba(76, 175, 80, 0.03)'
                    : (activeRoutine?.id === routine.id
                      ? 'rgba(255, 183, 50, 0.05)'
                      : 'white'
                    ),
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 24px rgba(0,0,0,0.06)',
                    borderColor: isRoutineComplete(routine) ? 'success.main' : (activeRoutine?.id === routine.id ? '#FFB732' : 'primary.main'),
                  }
                }}
              >
                {/* Porcentaje de progreso en esquina superior derecha */}
                {activeRoutine?.id === routine.id && (
                  <Box sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    backgroundColor: isRoutineComplete(routine) ? 'success.main' : '#FFB732',
                    color: 'white',
                    borderRadius: '10px',
                    px: 1.2,
                    py: 0.4,
                    zIndex: 1,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>
                      {(() => {
                        const today = new Date().toISOString().split('T')[0]
                        return getRoutineProgress(today, routine.id, routine)
                      })()}%
                    </Typography>
                  </Box>
                )}

                <CardContent sx={{ p: 3, pb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <Typography
                      variant="h6"
                      component="h2"
                      sx={{
                        fontWeight: 700,
                        color: isRoutineComplete(routine) ? 'success.main' : (activeRoutine?.id === routine.id ? '#FFB732' : 'text.primary'),
                        fontSize: '1.25rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      🏋️ {routine.name.length > 18 ? `${routine.name.substring(0, 18)}...` : routine.name}
                    </Typography>
                  </Box>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      opacity: 0.6,
                      fontWeight: 500,
                      mb: 1,
                      textAlign: 'left'
                    }}
                  >
                    {routine.updated_at && routine.updated_at !== routine.created_at ? t.updated : t.created} {new Date(routine.updated_at || routine.created_at).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Typography>
                </CardContent>

                <CardActions sx={{
                  flexDirection: 'column',
                  gap: 1.5,
                  px: { xs: 2, sm: 3 },
                  pb: 3,
                  pt: 0
                }}>
                  <Box sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: 1.5,
                    width: '100%',
                    justifyContent: 'center'
                  }}>
                    <Button
                      variant="outlined"
                      size="medium"
                      startIcon={<VisibilityIcon />}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleViewRoutine(routine)
                      }}
                      sx={{
                        fontWeight: 700,
                        borderRadius: '12px',
                        px: 1.5,
                        py: 1,
                        whiteSpace: 'pre-line',
                        lineHeight: 1.1,
                        fontSize: '0.8rem',
                        textTransform: 'none',
                        letterSpacing: 0,
                        minWidth: '0',
                        borderColor: isRoutineComplete(routine) ? 'success.main' : (activeRoutine?.id === routine.id ? '#FFB732' : 'primary.main'),
                        color: isRoutineComplete(routine) ? 'success.main' : (activeRoutine?.id === routine.id ? '#FFDA91' : 'primary.main'),
                        flex: 1,
                        '&:hover': {
                          borderColor: isRoutineComplete(routine) ? 'success.dark' : (activeRoutine?.id === routine.id ? '#FFA000' : 'primary.dark'),
                          backgroundColor: 'rgba(0,0,0,0.02)'
                        }
                      }}
                    >
                      {language === 'es' ? 'Ver /\nEditar' : 'View /\nEdit'}
                    </Button>

                    {!isRoutineComplete(routine) && (
                      <Button
                        variant="contained"
                        size="medium"
                        startIcon={activeRoutine?.id === routine.id ? <StopIcon /> : <PlayIcon />}
                        onClick={async (e) => {
                          e.stopPropagation()
                          if (activeRoutine?.id === routine.id) {
                            const event = new CustomEvent('stopRoutine', { detail: { routine } })
                            window.dispatchEvent(event)
                          } else {
                            try {
                              const fullRoutine = await apiClient.getUserRoutine(routine.id) as RoutineWithExercises
                              setSelectedRoutine(fullRoutine)
                              setOpenDetailDialog(true)
                              const event = new CustomEvent('startRoutineFromModal', { detail: { routine: fullRoutine } })
                              window.dispatchEvent(event)
                              window.dispatchEvent(new CustomEvent('navigateToWorkout', {}))
                            } catch (error) {
                              console.error('Error starting routine:', error)
                            }
                          }
                        }}
                         sx={{
                           fontWeight: 700,
                           borderRadius: '12px',
                           px: 1.5,
                           py: 1,
                           whiteSpace: 'pre-line',
                           lineHeight: 1.1,
                           fontSize: '0.8rem',
                           textTransform: 'none',
                           letterSpacing: 0,
                           minWidth: '0',
                           backgroundColor: activeRoutine?.id === routine.id ? '#FFB732' : 'primary.main',
                           color: 'white',
                           flex: 1,
                           '&:hover': {
                             backgroundColor: activeRoutine?.id === routine.id ? '#FFA000' : 'primary.dark',
                           }
                         }}
                      >
                        {activeRoutine?.id === routine.id
                          ? (language === 'es' ? 'Detener\nRutina' : 'Stop\nRoutine')
                          : (language === 'es' ? 'Iniciar\nRutina' : 'Start\nRoutine')}
                      </Button>
                    )}

                    {isRoutineComplete(routine) && (
                      <Button
                        variant="contained"
                        size="medium"
                        startIcon={<AutorenewIcon />}
                        onClick={(e) => {
                          e.stopPropagation()
                          const today = new Date().toISOString().split('T')[0]
                          resetCompletedExercisesForDate(today)
                        }}
                        sx={{
                          fontWeight: 700,
                          borderRadius: '12px',
                          px: 3,
                          textTransform: 'none',
                          backgroundColor: 'success.main',
                          color: 'white',
                          flex: 1,
                          '&:hover': {
                            backgroundColor: 'success.dark',
                          }
                        }}
                      >
                        {language === 'es' ? 'Reiniciar' : 'Restart'}
                      </Button>
                    )}
                  </Box>
                </CardActions>
              </Card>
            ))}

            {/* Card para agregar nueva rutina - al final */}
            {sortedRoutines && sortedRoutines.length > 0 && (
              <Card
                elevation={0}
                onClick={() => {
                  if (isGuest) {
                    signInWithGoogle()
                    return
                  }
                  setOpenCreateDialog(true)
                }}
                sx={{
                  height: '100%',
                  minHeight: '140px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px dashed',
                  borderColor: 'rgba(25, 118, 210, 0.3)',
                  borderRadius: '20px',
                  backgroundColor: 'rgba(25, 118, 210, 0.02)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  width: '100%',
                  '&:hover': {
                    backgroundColor: 'rgba(25, 118, 210, 0.06)',
                    borderColor: 'primary.main',
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.05)'
                  }
                }}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  <Box sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '12px',
                    backgroundColor: 'rgba(25, 118, 210, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2
                  }}>
                    <AddIcon sx={{ color: 'primary.main', fontSize: '1.8rem' }} />
                  </Box>
                  <Typography
                    variant="h6"
                    component="h2"
                    sx={{
                      fontWeight: 700,
                      color: 'primary.main',
                      mb: 0.5,
                      fontSize: '1.1rem'
                    }}
                  >
                    {language === 'es' ? 'Agregar Nueva Rutina' : 'Add New Routine'}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ opacity: 0.7, fontWeight: 500 }}
                  >
                    {language === 'es' ? 'Crear una nueva rutina personalizada' : 'Create a new personalized routine'}
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Box>
        </Box>
      )}

      {/* Dialog para crear rutina */}
      <Dialog
        open={openCreateDialog}
        onClose={(_, reason) => {
          if (reason !== 'backdropClick') setOpenCreateDialog(false)
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Crear Nueva Rutina</DialogTitle>
        <DialogContent>
          <RoutineForm
            onSubmit={handleCreateRoutine}
            onCancel={() => setOpenCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog para editar rutina */}
      <Dialog
        open={openEditDialog}
        onClose={(_, reason) => {
          if (reason !== 'backdropClick') setOpenEditDialog(false)
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Editar Rutina</DialogTitle>
        <DialogContent>
          {selectedRoutine && (
            <RoutineForm
              routine={selectedRoutine}
              onSubmit={(data) => handleEditRoutine(selectedRoutine.id, data)}
              onCancel={() => setOpenEditDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para ver detalles de rutina */}
      <Dialog
        open={openDetailDialog}
        onClose={(_, reason) => {
          if (reason !== 'backdropClick') setOpenDetailDialog(false)
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            width: { xs: '98%', sm: '100%' },
            maxWidth: { xs: '98%', sm: '900px' },
            margin: { xs: '8px', sm: 'auto' }
          }
        }}
      >
        <DialogTitle sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1
        }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Detalles
          </Typography>
          <IconButton
            onClick={() => setOpenDetailDialog(false)}
            sx={{
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: 'rgba(0,0,0,0.04)',
                color: 'text.primary'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedRoutine && (
            <RoutineDetail
              routine={selectedRoutine}
              onClose={() => setOpenDetailDialog(false)}
              onEdit={() => {
                setOpenDetailDialog(false)
                setOpenEditDialog(true)
              }}
              onStart={() => {
                if (activeRoutine?.id === selectedRoutine?.id) {
                  // Detener la rutina activa
                  const event = new CustomEvent('stopRoutine', {
                    detail: { routine: selectedRoutine }
                  })
                  window.dispatchEvent(event)
                } else {
                  // Solo iniciar la rutina sin cerrar el modal ni cambiar de tab
                  const event = new CustomEvent('startRoutineFromModal', {
                    detail: { routine: selectedRoutine }
                  })
                  window.dispatchEvent(event)
                }
              }}
              onDelete={() => {
                setOpenDetailDialog(false)
                setDeleteDialogOpen(true)
              }}
              isActiveRoutine={activeRoutine?.id === selectedRoutine?.id}
              routineProgress={routineProgress}
              onExerciseClick={(exercise) => {
                // Navegar al registro y autocompletar con el ejercicio clickeado
                const event = new CustomEvent('startRoutineWithExercise', {
                  detail: { routine: selectedRoutine, exercise: exercise }
                })
                window.dispatchEvent(event)
                setOpenDetailDialog(false)
              }}
              onNavigateToWorkout={() => {
                setOpenDetailDialog(false)
                // Navegar al registro
                const event = new CustomEvent('navigateToWorkout', {})
                window.dispatchEvent(event)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación para eliminar */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que quieres eliminar la rutina "{selectedRoutine?.name}"?
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => selectedRoutine && handleDeleteRoutine(selectedRoutine.id)}
            color="error"
            disabled={deletingRoutineId === selectedRoutine?.id}
          >
            {deletingRoutineId === selectedRoutine?.id ? (
              <CircularProgress size={20} />
            ) : (
              'Eliminar'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de edición de nombre */}
      <Dialog
        open={editNameModal.show}
        onClose={(_, reason) => {
          if (reason !== 'backdropClick') setEditNameModal({ show: false, routineId: null, currentName: '', newName: '' })
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
          Editar nombre de la rutina
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            autoFocus
            fullWidth
            placeholder="Nombre de la rutina"
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
            onClick={() => setEditNameModal({ show: false, routineId: null, currentName: '', newName: '' })}
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
            {translations[language].common.cancel}
          </Button>
          <Button
            onClick={handleSaveRoutineName}
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
            {translations[language].common.save}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Botón flotante para crear rutina */}
      <Fab
        aria-label={language === 'es' ? 'crear rutina' : 'create routine'}
        onClick={() => setOpenCreateDialog(true)}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
          backgroundColor: '#ffc107',
          color: '#fff',
          boxShadow: '0 4px 12px rgba(255, 193, 7, 0.3)',
          '&:hover': {
            backgroundColor: '#ffb300',
            boxShadow: '0 6px 16px rgba(255, 193, 7, 0.4)',
            transform: 'scale(1.05)'
          },
          transition: 'all 0.2s ease-in-out'
        }}
      >
        <AddIcon sx={{ color: '#fff' }} />
      </Fab>
    </Box>
  )
}

export default RoutineList
