import { useState, useMemo, useEffect } from 'react'
import {
  Card,
  CardContent,
  Typography,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Chip,
  Box,
  Stack,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Snackbar,
} from '@mui/material'
import InfoIcon from '@mui/icons-material/Info'
import PlayCircleIcon from '@mui/icons-material/PlayCircle'
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline'
import SearchOffIcon from '@mui/icons-material/SearchOff'
import FitnessCenter from '@mui/icons-material/FitnessCenter'

type Exercise = {
  id: number
  name: string
  muscle_group: string
  primary_muscles: string[]
  secondary_muscles: string[]
  equipment: string
  video_url?: string
}

type ExerciseListProps = {
  exercises: Exercise[]
  onSelectExercise: (exercise: Exercise) => void
}

export default function ExerciseList({ exercises }: ExerciseListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [muscleGroupFilter, setMuscleGroupFilter] = useState('')
  const [equipmentFilter, setEquipmentFilter] = useState('')
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [showTestAlert, setShowTestAlert] = useState(true)

  // Ocultar la alerta después de 5 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTestAlert(false)
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  // Obtener valores únicos para los filtros
  const muscleGroups = useMemo(() => {
    const groups = exercises.map(ex => ex.muscle_group)
    return [...new Set(groups)].sort()
  }, [exercises])

  const equipmentTypes = useMemo(() => {
    const types = exercises.map(ex => ex.equipment)
    return [...new Set(types)].sort()
  }, [exercises])

  // Filtrar ejercicios
  const filteredExercises = useMemo(() => {
    return exercises.filter(exercise => {
      const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesMuscleGroup = !muscleGroupFilter || exercise.muscle_group === muscleGroupFilter
      const matchesEquipment = !equipmentFilter || exercise.equipment === equipmentFilter
      
      return matchesSearch && matchesMuscleGroup && matchesEquipment
    })
  }, [exercises, searchTerm, muscleGroupFilter, equipmentFilter])

  const handleExerciseClick = (exercise: Exercise) => {
    setSelectedExercise(exercise)
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setSelectedExercise(null)
  }

  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase()
  }

  const getYouTubeEmbedUrl = (url: string): string => {
    // Extraer el ID del video de YouTube
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`
    }
    return url
  }

  // Función para renderizar el estado vacío con mejor estilo
  const renderEmptyState = (isInitialEmpty: boolean = false) => (
    <Box 
      sx={{ 
        textAlign: 'center', 
        py: 8,
        px: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2
      }}
    >
      {isInitialEmpty ? (
        <FitnessCenter sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
      ) : (
        <SearchOffIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
      )}
      <Typography variant="h5" color="text.secondary" sx={{ fontWeight: 'bold' }}>
        {isInitialEmpty ? 'No hay ejercicios disponibles' : 'Sin resultados'}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400 }}>
        {isInitialEmpty 
          ? 'Aún no se han cargado ejercicios en el sistema.'
          : 'No se encontraron ejercicios que coincidan con tu búsqueda. Intenta modificar los filtros.'
        }
      </Typography>
    </Box>
  )

  if (exercises.length === 0) {
    return (
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 3, textAlign: 'center', color: 'primary.main', fontWeight: 'bold' }}>
          Hacer consulta
        </Typography>
        {renderEmptyState(true)}
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, textAlign: 'center', color: 'primary.main', fontWeight: 'bold' }}>
        Hacer consulta
      </Typography>
      
      <Stack spacing={3}>
        {/* Filtros */}
        <Box sx={{ 
          p: 3, 
          mx: 2,
          bgcolor: 'primary.main', 
          borderRadius: 3, 
          boxShadow: 3,
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: 'white',
          mb: 3
        }}>
          <Stack spacing={3}>
            <TextField
              placeholder="Buscar ejercicios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ 
                width: '100%',
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'rgba(255, 255, 255, 0.95)',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 1)'
                  },
                  '&.Mui-focused': {
                    bgcolor: 'white'
                  }
                },
                '& .MuiInputBase-input': {
                  color: '#333',
                  fontSize: '1rem'
                },
                '& .MuiInputBase-input::placeholder': {
                  color: '#666',
                  opacity: 1
                }
              }}
            />
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 3
            }}>
              <FormControl sx={{ flex: 1 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'white', 
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    mb: 1
                  }}
                >
                  Grupo muscular
                </Typography>
                <Select
                  value={muscleGroupFilter}
                  onChange={(e) => setMuscleGroupFilter(e.target.value)}
                  displayEmpty
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.95)',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 1)'
                    },
                    '&.Mui-focused': {
                      bgcolor: 'white'
                    },
                    '& .MuiSelect-select': {
                      color: '#333',
                      fontSize: '1rem'
                    }
                  }}
                >
                  <MenuItem value="">Elegir</MenuItem>
                  {muscleGroups.map(group => (
                    <MenuItem key={group} value={group}>
                      {capitalizeFirstLetter(group)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl sx={{ flex: 1 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'white', 
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    mb: 1
                  }}
                >
                  Equipamiento
                </Typography>
                <Select
                  value={equipmentFilter}
                  onChange={(e) => setEquipmentFilter(e.target.value)}
                  displayEmpty
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.95)',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 1)'
                    },
                    '&.Mui-focused': {
                      bgcolor: 'white'
                    },
                    '& .MuiSelect-select': {
                      color: '#333',
                      fontSize: '1rem'
                    }
                  }}
                >
                  <MenuItem value="">Elegir</MenuItem>
                  {equipmentTypes.map(equipment => (
                    <MenuItem key={equipment} value={equipment}>
                      {capitalizeFirstLetter(equipment)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Stack>
        </Box>

        {/* Ejercicios o estado vacío */}
        {filteredExercises.length > 0 ? (
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 2,
            mx: 2
          }}>
            {filteredExercises.map((exercise) => (
            <Card 
              key={exercise.id}
              sx={{ 
                cursor: 'pointer', 
                height: '100%',
                '&:hover': { 
                  boxShadow: 4,
                  transform: 'translateY(-2px)',
                  transition: 'all 0.2s ease'
                },
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider'
              }}
              onClick={() => handleExerciseClick(exercise)}
            >
              <CardContent sx={{ 
                p: 3, 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                textAlign: 'center'
              }}>
                <Box display="flex" justifyContent="center" alignItems="center" sx={{ mb: 2 }}>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 'bold', 
                      color: 'primary.main',
                      textAlign: 'center'
                    }}
                  >
                    {exercise.name}
                  </Typography>
                  <IconButton 
                    size="small" 
                    color="primary" 
                    sx={{ 
                      color: exercise.video_url ? 'primary.main' : 'text.secondary',
                      ml: 0.5,
                      p: 0.5
                    }}
                  >
                    {exercise.video_url ? <PlayCircleIcon /> : <PlayCircleOutlineIcon />}
                  </IconButton>
                </Box>
                <Box sx={{ mt: 'auto', textAlign: 'center' }}>
                  <Stack direction="row" spacing={1} flexWrap="wrap" gap={1} sx={{ justifyContent: 'center' }}>
                    <Chip 
                      label={capitalizeFirstLetter(exercise.muscle_group)} 
                      size="small" 
                      color="primary" 
                      sx={{ fontWeight: 'bold' }}
                    />
                    <Chip 
                      label={capitalizeFirstLetter(exercise.equipment)} 
                      size="small" 
                      variant="outlined" 
                      sx={{ borderColor: 'primary.main' }}
                    />
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          ))}
          </Box>
        ) : (
          renderEmptyState()
        )}
      </Stack>

      {/* Modal informativo mejorado */}
      {selectedExercise && (
        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: { xs: '12px', sm: 3 },
              maxWidth: { xs: '85vw', sm: '90vw', md: '500px' },
              maxHeight: { xs: '75vh', sm: '80vh', md: '70vh' },
              m: { xs: '22vh 3vw'},
              width: { xs: '85vw', sm: '90vw', md: '500px' },
              height: { xs: '70vh', sm: 'auto', md: 'auto' },
              position: { xs: 'fixed', sm: 'relative' },
              bottom: { xs: '2.5vh', sm: 'auto' },
              left: { xs: '5vw', sm: 'auto' },
              right: { xs: '5vw', sm: 'auto' },
              boxShadow: { xs: '0 -4px 20px rgba(0,0,0,0.3)', sm: 3 },
              pb: {xs: 2}
            }
          }}
          BackdropProps={{
            sx: {
              backgroundColor: { xs: 'rgba(0,0,0,0.8)', sm: 'rgba(0,0,0,0.5)' }
            }
          }}
        >
          <DialogTitle sx={{ 
            background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
            color: 'white',
            borderRadius: '12px 12px 0 0',
            pb: 2,
            px: { xs: 2, sm: 3 },
            position: 'relative'
          }}>
            {/* Handle para móviles */}
            <Box sx={{ 
              position: 'absolute', 
              top: { xs: 8, sm: 12 }, 
              left: '50%', 
              transform: 'translateX(-50%)',
              width: 40,
              height: 4,
              backgroundColor: 'rgba(255,255,255,0.3)',
              borderRadius: 2,
              display: { xs: 'block', sm: 'none' }
            }} />
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mt: { xs: 2, sm: 0 } }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                {selectedExercise.name}
              </Typography>
              <IconButton 
                onClick={handleCloseDialog}
                sx={{ 
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                <InfoIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          
          <DialogContent sx={{ p: { xs: 2 }, maxHeight: { xs: '60vh', sm: '70vh' }, overflow: 'auto' }}>
            <Stack spacing={1}>
              {/* Video del ejercicio */}
              {selectedExercise.video_url && (
                <Box sx={{ pt: 1 }}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold', fontSize: { xs: '1rem', sm: '1.125rem' }, mb: 1 }}>
                    Video del Ejercicio
                  </Typography>
                  <Box sx={{ 
                    position: 'relative', 
                    width: '100%', 
                    height: 0, 
                    paddingBottom: '56.25%', // Aspect ratio 16:9
                    borderRadius: 2,
                    overflow: 'hidden'
                  }}>
                    <iframe
                      src={getYouTubeEmbedUrl(selectedExercise.video_url)}
                      title={`Video de ${selectedExercise.name}`}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        borderRadius: '8px'
                      }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </Box>
                </Box>
              )}

              <Box sx={{ pt: 0, mt: 0.5 }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold', fontSize: { xs: '1rem', sm: '1.125rem' } }}>
                  Información del Ejercicio
                </Typography>
                
                <Stack spacing={0.5}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Grupo Muscular Principal:
                    </Typography>
                    <Chip 
                      label={capitalizeFirstLetter(selectedExercise.muscle_group)} 
                      color="primary" 
                      sx={{ fontWeight: 'bold' }}
                    />
                  </Box>
                  
                  {selectedExercise.primary_muscles && selectedExercise.primary_muscles.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Músculos Primarios:
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                        {selectedExercise.primary_muscles.map((muscle, index) => (
                          <Chip 
                            key={index}
                            label={capitalizeFirstLetter(muscle)} 
                            color="primary" 
                            size="small"
                            sx={{ fontWeight: 'bold' }}
                          />
                        ))}
                      </Stack>
                    </Box>
                  )}
                  
                  {selectedExercise.secondary_muscles && selectedExercise.secondary_muscles.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Músculos Secundarios:
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                        {selectedExercise.secondary_muscles.map((muscle, index) => (
                          <Chip 
                            key={index}
                            label={capitalizeFirstLetter(muscle)} 
                            variant="outlined" 
                            size="small"
                            sx={{ borderColor: 'primary.main' }}
                          />
                        ))}
                      </Stack>
                    </Box>
                  )}
                  
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Equipamiento:
                    </Typography>
                    <Chip 
                      label={capitalizeFirstLetter(selectedExercise.equipment)} 
                      variant="outlined" 
                      sx={{ borderColor: 'primary.main' }}
                    />
                  </Box>
                </Stack>
              </Box>
            </Stack>
          </DialogContent>
          
          <DialogActions sx={{ 
            p: { xs: 1, sm: 3 }, 
            pt: { xs: 0.5, sm: 0 },
            pb: { xs: 0.5, sm: 1 },
            justifyContent: 'center'
          }}>
            <Button 
              onClick={handleCloseDialog}
              variant="contained"
              sx={{ 
                borderRadius: 2,
                px: { xs: 3, sm: 4 },
                py: { xs: 1, sm: 1.5 },
                minWidth: { xs: 120, sm: 140 }
              }}
            >
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Alerta de información de prueba */}
      <Snackbar
        open={showTestAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ 
          mt: 6,
          width: { xs: '95%', sm: '90%', md: '70%' },
          left: '50%',
          transform: 'translateX(-50%)'
        }}
      >
        <Alert 
          severity="warning" 
          sx={{ 
            width: '100%',
            minWidth: '300px',
            fontSize: '0.95rem',
            fontWeight: 500,
            backgroundColor: '#fff3cd',
            color: '#856404',
            border: '1px solid #ffeaa7',
            '& .MuiAlert-icon': {
              color: '#856404'
            }
          }}
        >
          ⚠️ Información de prueba: Los datos mostrados no son reales.
        </Alert>
      </Snackbar>
    </Box>
  )
}
