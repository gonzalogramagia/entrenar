import { useState, useMemo, useEffect } from 'react'
import {
  Card,
  CardContent,
  Typography,
  Stack,
  Box,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Alert,
  Snackbar,
} from '@mui/material'
import InfoIcon from '@mui/icons-material/Info'
import ImageIcon from '@mui/icons-material/Image'
import ImageNotSupportedIcon from '@mui/icons-material/ImageNotSupported'
import SearchOffIcon from '@mui/icons-material/SearchOff'
import BuildIcon from '@mui/icons-material/Build'

type Equipment = {
  id: number
  name: string
  category: string
  observations: string | null
  image_url: string | null
  created_at: string
}

type EquipmentListProps = {
  equipment: Equipment[]
}

export default function EquipmentList({ equipment }: EquipmentListProps) {
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showTestAlert, setShowTestAlert] = useState(true)

  // Ocultar la alerta después de 5 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTestAlert(false)
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  // Obtener categorías únicas para el filtro
  const categories = useMemo(() => {
    const cats = equipment.map(item => item.category)
    return [...new Set(cats)].sort()
  }, [equipment])

  // Filtrar equipamiento
  const filteredEquipment = useMemo(() => {
    return equipment.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = !categoryFilter || item.category === categoryFilter
      
      return matchesSearch && matchesCategory
    })
  }, [equipment, searchTerm, categoryFilter])

  const handleEquipmentClick = (equipment: Equipment) => {
    setSelectedEquipment(equipment)
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setSelectedEquipment(null)
  }

  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase()
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
        <BuildIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
      ) : (
        <SearchOffIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
      )}
      <Typography variant="h5" color="text.secondary" sx={{ fontWeight: 'bold' }}>
        {isInitialEmpty ? 'No hay equipos disponibles' : 'Sin resultados'}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400 }}>
        {isInitialEmpty 
          ? 'Aún no se han cargado equipos en el sistema.'
          : 'No se encontraron equipos que coincidan con tu búsqueda. Intenta modificar los filtros.'
        }
      </Typography>
    </Box>
  )

  if (equipment.length === 0) {
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
              placeholder="Buscar equipamiento..."
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
            <FormControl>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'white', 
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  mb: 1
                }}
              >
                Categoría
              </Typography>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
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
                {categories.map(category => (
                  <MenuItem key={category} value={category}>
                    {capitalizeFirstLetter(category)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Box>

        {/* Equipamiento o estado vacío */}
        {filteredEquipment.length > 0 ? (
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 2,
            mx: 2
          }}>
            {filteredEquipment.map((item) => (
            <Card 
              key={item.id}
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
              onClick={() => handleEquipmentClick(item)}
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
                    {item.name}
                  </Typography>
                  <IconButton 
                    size="small" 
                    color="primary" 
                    sx={{ 
                      color: item.image_url ? 'primary.main' : 'text.secondary',
                      ml: 0.5,
                      p: 0.5
                    }}
                  >
                    {item.image_url ? <ImageIcon /> : <ImageNotSupportedIcon />}
                  </IconButton>
                </Box>
                
                <Box sx={{ mt: 'auto', textAlign: 'center' }}>
                  <Stack direction="row" spacing={1} flexWrap="wrap" gap={1} sx={{ mb: 2, justifyContent: 'center' }}>
                    <Chip 
                      label={capitalizeFirstLetter(item.category)} 
                      color="primary" 
                      size="small"
                      sx={{ fontWeight: 'bold' }}
                    />
                  </Stack>
                  
                  {item.observations && (
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        mb: 1,
                        textAlign: 'center'
                      }}
                    >
                      {item.observations}
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          ))}
          </Box>
        ) : (
          renderEmptyState()
        )}
      </Stack>

      {/* Dialog para mostrar detalles completos */}
      {selectedEquipment && (
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
                {selectedEquipment.name}
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
            <Stack spacing={0.5}>
              {selectedEquipment.image_url && (
                <Box sx={{ pt: 3 }}>
                  <img
                    src={selectedEquipment.image_url}
                    alt={selectedEquipment.name}
                    style={{ 
                      width: '100%', 
                      height: 'auto', 
                      maxHeight: 300, 
                      objectFit: 'cover',
                      borderRadius: 8
                    }}
                  />
                </Box>
              )}
              
              <Box sx={{ pt: 1, mt: 0.5 }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold', fontSize: { xs: '1rem', sm: '1.125rem' } }}>
                  Información del Equipo
                </Typography>
                
                <Stack spacing={0.5}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Categoría:
                    </Typography>
                    <Chip 
                      label={capitalizeFirstLetter(selectedEquipment.category)} 
                      color="primary" 
                      sx={{ fontWeight: 'bold' }}
                    />
                  </Box>
                  
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Observaciones:
                    </Typography>
                    <Typography>
                      {selectedEquipment.observations || 'Sin observaciones'}
                    </Typography>
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
