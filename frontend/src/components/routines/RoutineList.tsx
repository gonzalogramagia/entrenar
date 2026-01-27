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
  Autorenew as AutorenewIcon
} from '@mui/icons-material'
import { apiClient } from '../../lib/api'
import type { RoutineWithExercises, CreateRoutineRequest, UpdateRoutineRequest } from '../../types/routine'
import RoutineForm from './RoutineForm'
import RoutineDetail from './RoutineDetail'
import { useUserSettings } from '../../contexts/UserSettingsContext'
import { useLanguage } from '../../contexts/LanguageContext'
import { translations } from '../../i18n/translations'

interface RoutineListProps {
  activeRoutine?: any
  routineProgress?: number
}

const RoutineList: React.FC<RoutineListProps> = ({ activeRoutine, routineProgress = 0 }) => {
  const { language } = useLanguage()
  const t = translations[language].routines
  const { getRoutineProgress, resetCompletedExercisesForDate } = useUserSettings()
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
      const data = await apiClient.getUserRoutines()

      // Validar que data sea un array
      if (Array.isArray(data)) {

        // Cargar las rutinas completas con ejercicios
        const fullRoutines = await Promise.all(
          data.map(async (routine: any) => {
            try {
              return await apiClient.getUserRoutine(routine.id) as RoutineWithExercises
            } catch (error) {
              console.error(`Error cargando rutina ${routine.id}:`, error)
              return routine // Devolver la rutina básica si falla
            }
          })
        )

        setRoutines(fullRoutines)
      } else if (data === null || data === undefined) {
        // Si no hay rutinas, establecer array vacío
        setRoutines([])
      } else {
        console.warn('⚠️ RoutineList - API devolvió datos no válidos:', data)
        setRoutines([])
      }
    } catch (err) {
      console.error('❌ RoutineList - Error cargando rutinas:', err)
      setError('Error al cargar las rutinas')
      setRoutines([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRoutines()
  }, [loadRoutines])

  const handleCreateRoutine = async (routineData: CreateRoutineRequest | UpdateRoutineRequest) => {
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
      p: 1,
      height: (!routines || routines.length === 0) ? 'auto' : '100%',
      overflow: (!routines || routines.length === 0) ? 'visible' : 'hidden'
    }}>

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
              onClick={() => setOpenCreateDialog(true)}
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
            display: 'grid',
            gap: 2,
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(auto-fill, minmax(250px, 1fr))',
              md: 'repeat(auto-fill, minmax(280px, 1fr))'
            },
            width: '100%',
            maxWidth: '100%',
            overflow: 'hidden'
          }}>
            A            {sortedRoutines?.map((routine) => (
              <Card
                key={routine.id}
                elevation={2}
                onClick={() => handleViewRoutine(routine)}
                sx={{
                  height: 'fit-content',
                  width: '100%',
                  border: '1px solid',
                  borderColor: isRoutineComplete(routine) ? 'success.main' : (activeRoutine?.id === routine.id ? '#FFB732' : 'grey.300'),
                  borderRadius: '16px',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  cursor: 'pointer',
                  backgroundColor: isRoutineComplete(routine)
                    ? '#f0f8f0'  // Verde muy claro para completadas
                    : (activeRoutine?.id === routine.id
                      ? '#fff3e0'  // Amarillo muy claro para activas (siempre visible)
                      : 'transparent'  // Transparente para inactivas
                    ),
                  '&:hover': {
                    backgroundColor: isRoutineComplete(routine)
                      ? '#f0f8f0'  // Verde muy claro para completadas
                      : (activeRoutine?.id === routine.id
                        ? '#fff3e0'  // Amarillo muy claro para activas
                        : '#f0f8ff'  // Azul muy claro para inactivas
                      ),
                    borderColor: isRoutineComplete(routine) ? 'success.dark' : (activeRoutine?.id === routine.id ? '#FFA000' : 'grey.400'),
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }
                }}
              >
                {/* Porcentaje de progreso en esquina superior derecha */}
                {activeRoutine?.id === routine.id && (
                  <Box sx={{
                    position: 'absolute',
                    top: 20,
                    right: 16,
                    backgroundColor: 'transparent',
                    border: '2px solid',
                    borderColor: isRoutineComplete(routine) ? 'success.main' : (activeRoutine?.id === routine.id ? '#FFB732' : 'primary.main'),
                    color: isRoutineComplete(routine) ? 'success.main' : (activeRoutine?.id === routine.id ? '#FFB732' : 'primary.main'),
                    borderRadius: '12px',
                    px: 1.5,
                    py: 0.5,
                    zIndex: 1,
                    mr: 1
                  }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                      {(() => {
                        const today = new Date().toISOString().split('T')[0]
                        return getRoutineProgress(today, routine.id, routine)
                      })()}%
                    </Typography>
                  </Box>
                )}

                <CardContent sx={{ p: 3, pb: 1, pr: 6 }}>
                  {/* Layout para desktop */}
                  <Box sx={{
                    display: { xs: 'none', sm: 'flex' },
                    alignItems: 'center',
                    gap: 1,
                    mb: 2,
                    justifyContent: 'flex-start'
                  }}>
                    <Typography
                      variant="h5"
                      component="h2"
                      sx={{
                        fontWeight: 700,
                        color: isRoutineComplete(routine) ? 'success.main' : (activeRoutine?.id === routine.id ? '#FFB732' : 'primary.main'),
                        textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                        cursor: 'default',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        textAlign: 'left'
                      }}
                    >
                      🏋️ {routine.name.length > 12 ? `${routine.name.substring(0, 12)}...` : routine.name}
                    </Typography>
                  </Box>

                  {/* Layout para mobile */}
                  <Box sx={{
                    display: { xs: 'flex', sm: 'none' },
                    flexDirection: 'column',
                    gap: 2,
                    mb: 2
                  }}>
                    {/* Nombre de la rutina */}
                    <Typography
                      variant="h5"
                      component="h2"
                      sx={{
                        fontWeight: 700,
                        color: isRoutineComplete(routine) ? 'success.main' : (activeRoutine?.id === routine.id ? '#FFB732' : 'primary.main'),
                        textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                        cursor: 'default',
                        textAlign: 'left'
                      }}
                    >
                      🏋️ {routine.name.length > 12 ? `${routine.name.substring(0, 12)}...` : routine.name}
                    </Typography>


                  </Box>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      display: 'block',
                      fontStyle: 'italic',
                      opacity: 0.8,
                      mb: 0.5,
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
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  px: 3,
                  pb: 3,
                  pt: 1
                }}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleViewRoutine(routine)
                    }}
                    sx={{
                      fontWeight: 600,
                      borderRadius: '8px',
                      textTransform: 'none',
                      backgroundColor: isRoutineComplete(routine) ? 'success.main' : (activeRoutine?.id === routine.id ? '#FFB732' : 'primary.main'),
                      color: 'white',
                      '&:hover': {
                        backgroundColor: isRoutineComplete(routine) ? 'success.dark' : (activeRoutine?.id === routine.id ? '#FFA000' : 'primary.dark')
                      },
                      '&:focus': {
                        outline: 'none'
                      }
                    }}
                  >
                    {t.details}
                  </Button>

                  {/* Botón play/stop para rutinas no completadas */}
                  {!isRoutineComplete(routine) && (
                    <IconButton
                      size="small"
                      onClick={async (e) => {
                        e.stopPropagation()
                        if (activeRoutine?.id === routine.id) {
                          // Detener la rutina activa
                          const event = new CustomEvent('stopRoutine', {
                            detail: { routine: routine }
                          })
                          window.dispatchEvent(event)
                        } else {
                          // Obtener la rutina completa, abrir el modal E iniciar la rutina
                          try {
                            const fullRoutine = await apiClient.getUserRoutine(routine.id) as RoutineWithExercises
                            setSelectedRoutine(fullRoutine)
                            setOpenDetailDialog(true)

                            // Iniciar la rutina automáticamente sin cambiar de tab
                            const event = new CustomEvent('startRoutineFromModal', {
                              detail: { routine: fullRoutine }
                            })
                            window.dispatchEvent(event)

                            // Navegar al registro con la rutina activa
                            const navigateEvent = new CustomEvent('navigateToWorkout', {})
                            window.dispatchEvent(navigateEvent)
                          } catch (error) {
                            console.error('Error obteniendo detalles de la rutina:', error)
                            setError(language === 'es' ? 'Error al cargar los detalles de la rutina' : 'Error loading routine details')
                          }
                        }
                      }}
                      sx={{
                        color: 'white',
                        backgroundColor: activeRoutine?.id === routine.id ? '#FFB732' : 'primary.main',
                        '&:hover': {
                          backgroundColor: activeRoutine?.id === routine.id ? '#FFA000' : 'primary.light',
                          color: 'white'
                        },
                        '&:focus': {
                          outline: 'none'
                        },
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}
                    >
                      {activeRoutine?.id === routine.id ? <StopIcon /> : <PlayIcon />}
                    </IconButton>
                  )}

                  {/* Botón resetear para rutinas completadas */}
                  {isRoutineComplete(routine) && (
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation()
                        // Resetear el progreso de la rutina para hoy
                        const today = new Date().toISOString().split('T')[0]
                        resetCompletedExercisesForDate(today)
                      }}
                      sx={{
                        color: 'white',
                        backgroundColor: 'success.main',
                        '&:hover': {
                          backgroundColor: 'success.dark',
                          color: 'white'
                        },
                        '&:focus': {
                          outline: 'none'
                        },
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}
                      title="Resetear rutina"
                    >
                      <AutorenewIcon />
                    </IconButton>
                  )}
                </CardActions>
              </Card>
            ))}

            {/* Card para agregar nueva rutina - al final */}
            {sortedRoutines && sortedRoutines.length > 0 && (
              <Card
                elevation={2}
                onClick={() => setOpenCreateDialog(true)}
                sx={{
                  height: 'fit-content',
                  width: '100%',
                  border: '2px solid',
                  borderColor: 'primary.main',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  backgroundColor: 'transparent',
                  '&:hover': {
                    backgroundColor: '#f0f8ff',
                    borderColor: 'primary.dark'
                  }
                }}
              >
                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                  <Typography
                    variant="h6"
                    component="h2"
                    sx={{
                      fontWeight: 700,
                      color: 'primary.main',
                      mb: 1
                    }}
                  >
                    ➕ {language === 'es' ? 'Agregar Nueva Rutina' : 'Add New Routine'}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontStyle: 'italic' }}
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
