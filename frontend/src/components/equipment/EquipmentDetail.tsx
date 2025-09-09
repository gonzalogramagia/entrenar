
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Stack,
} from '@mui/material'

type Equipment = {
  id: number
  name: string
  category: string
  observations: string | null
  image_url: string | null
  created_at: string
}

type EquipmentDetailProps = {
  equipment: Equipment
  onClose: () => void
}

export default function EquipmentDetail({ equipment, onClose }: EquipmentDetailProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES')
  }

  return (
    <Dialog open={true} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {equipment.name}
        <Button
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          Cerrar
        </Button>
      </DialogTitle>
      
      <DialogContent>
        <Stack spacing={2}>
          {equipment.image_url && (
            <Box>
              <img
                src={equipment.image_url}
                alt={equipment.name}
                style={{ width: '100%', height: 'auto', maxHeight: 300, objectFit: 'cover' }}
              />
            </Box>
          )}
          
          <Box sx={{ pt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Información del Equipo
            </Typography>
            
            <Stack spacing={1}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Categoría:
                </Typography>
                <Chip label={equipment.category} color="primary" />
              </Box>
              
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Observaciones:
                </Typography>
                <Typography>
                  {equipment.observations || 'Sin observaciones'}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Fecha de creación:
                </Typography>
                <Typography>
                  {formatDate(equipment.created_at)}
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Stack>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  )
}
