import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  CircularProgress,
  Alert,
  Stack,
  IconButton
} from '@mui/material'
import {
  ThumbUp as ThumbUpIcon,
  ThumbUpOutlined as ThumbUpOutlinedIcon
} from '@mui/icons-material'
import { apiClient } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { useUserSettings } from '../../contexts/UserSettingsContext'


type SocialWorkout = {
  session_id: number
  user_id: string
  user_name: string
  user_avatar_url?: string
  workout_date: string
  created_at: string
  total_exercises: number
  total_sets: number
  exercises: SocialExercise[]
  kudos_count: number
  has_kudos: boolean
}

type SocialExercise = {
  exercise_name: string
  total_sets: number
  set: number
  weight: number
  reps: number
  seconds?: number
}

export default function SocialList() {
  const { user } = useAuth()
  const { setOnSocialSettingsChange } = useUserSettings()
  const [socialWorkouts, setSocialWorkouts] = useState<SocialWorkout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [loadingKudos, setLoadingKudos] = useState<Set<number>>(new Set())
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const currentOffsetRef = useRef(0)
  const loadingMoreRef = useRef(false)
  const hasMoreRef = useRef(true)

  

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      
      const weekdays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
      const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
      
      const weekday = weekdays[date.getDay()]
      const day = date.getDate()
      const month = months[date.getMonth()]
      
      return `${weekday} ${day} de ${month}`
    } catch (error) {
      console.error('Error formateando fecha:', error)
      return dateString
    }
  }

  const formatRelativeTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
      
      if (diffInMinutes < 1) return 'Hace un momento'
      if (diffInMinutes === 1) return 'Hace 1 minuto'
      if (diffInMinutes < 60) return `Hace ${diffInMinutes} minutos`
      
      const diffInHours = Math.floor(diffInMinutes / 60)
      if (diffInHours === 1) return 'Hace 1 hora'
      if (diffInHours < 24) return `Hace ${diffInHours} horas`
      
      const diffInDays = Math.floor(diffInHours / 24)
      if (diffInDays === 1) return 'Ayer'
      if (diffInDays < 7) return `Hace ${diffInDays} días`
      
      return formatDate(dateString)
    } catch (error) {
      console.error('Error formateando tiempo relativo:', error)
      return dateString
    }
  }

  const loadSocialWorkouts = useCallback(async (reset = false) => {
    try {
      if (reset) {
        setLoading(true)
        currentOffsetRef.current = 0
        setHasMore(true)
        hasMoreRef.current = true
      } else {
        setLoadingMore(true)
        loadingMoreRef.current = true
      }

      const offset = reset ? 0 : currentOffsetRef.current
      const workouts = await apiClient.getSocialWorkouts(10, offset)
      console.log('🔍 Workouts cargados desde API:', workouts)
      console.log('🔍 Tipo de respuesta:', typeof workouts)
      console.log('🔍 Es array?', Array.isArray(workouts))
      console.log('🔍 Offset actual:', offset)
      
      if (Array.isArray(workouts) && workouts.length > 0) {
        console.log('🔍 Primer workout detalle:', {
          sessionId: workouts[0].session_id,
          kudosCount: workouts[0].kudos_count,
          hasKudos: workouts[0].has_kudos,
          totalExercises: workouts[0].total_exercises
        })
      }
      
      if (workouts === null || workouts === undefined) {
        console.log('🔍 API devolvió null/undefined, estableciendo array vacío')
        if (reset) {
          setSocialWorkouts([])
        }
        setHasMore(false)
        hasMoreRef.current = false
      } else if (Array.isArray(workouts)) {
        console.log('🔍 Estableciendo workouts:', workouts.length)
        
        if (reset) {
          setSocialWorkouts(workouts)
        } else {
          setSocialWorkouts(prev => {
            // Evitar duplicados comparando session_id
            const existingIds = new Set(prev.map(w => w.session_id))
            const newWorkouts = workouts.filter(w => !existingIds.has(w.session_id))
            console.log('🔍 Evitando duplicados:', {
              existingCount: prev.length,
              newCount: workouts.length,
              filteredCount: newWorkouts.length
            })
            return [...prev, ...newWorkouts]
          })
        }
        
        // Si recibimos menos de 10 workouts, no hay más datos
        if (workouts.length < 10) {
          setHasMore(false)
          hasMoreRef.current = false
        } else {
          currentOffsetRef.current = currentOffsetRef.current + 10
        }
      } else {
        console.log('🔍 Respuesta no es array, estableciendo array vacío')
        if (reset) {
          setSocialWorkouts([])
        }
        setHasMore(false)
        hasMoreRef.current = false
      }
    } catch (error) {
      console.error('Error cargando entrenamientos sociales:', error)
      setError('Error al cargar el feed social')
    } finally {
      setLoading(false)
      setLoadingMore(false)
      loadingMoreRef.current = false
    }
  }, []) // Sin dependencias para evitar bucles infinitos

  const loadMoreWorkouts = useCallback(() => {
    if (!loadingMoreRef.current && hasMoreRef.current) {
      console.log('🔄 Cargando más entrenamientos...')
      loadSocialWorkouts(false)
    }
  }, []) // Sin dependencias para evitar bucles

  const handleKudos = async (workoutId: number) => {
    if (!user) return
    
    // Solo permitir dar kudos si no se ha dado ya
    const workout = socialWorkouts.find(w => w.session_id === workoutId)
    if (!workout || workout.has_kudos) return
    
    try {
      setLoadingKudos(prev => new Set(prev).add(workoutId))
      
      // Llamada a la API para dar kudos
      await apiClient.giveKudos(workoutId)
      
      // Actualizar estado local
      setSocialWorkouts(prev => prev.map(workout => {
        if (workout.session_id === workoutId) {
          return {
            ...workout,
            has_kudos: true,
            kudos_count: workout.kudos_count + 1
          }
        }
        return workout
      }))
      
    } catch (error) {
      console.error('Error dando kudos:', error)
      // Mostrar error más específico
      const errorMessage = error instanceof Error ? error.message : 'Error al dar kudos'
      setError(`Error al dar kudos: ${errorMessage}`)
    } finally {
      setLoadingKudos(prev => {
        const newSet = new Set(prev)
        newSet.delete(workoutId)
        return newSet
      })
    }
  }

  // Filtrar y agrupar workouts por día
  const groupedWorkouts = useMemo(() => {
    const groups: { [key: string]: SocialWorkout[] } = {}
    
    console.log('🔍 Debug SocialList:', {
      totalWorkouts: socialWorkouts.length,
      workouts: socialWorkouts.map(w => ({ sessionId: w.session_id, userId: w.user_id, userName: w.user_name }))
    })
    
    socialWorkouts.forEach(workout => {
      // Agrupar por fecha de creación (created_at) en zona horaria local
      const workoutDate = new Date(workout.created_at)
      // Agregar un día para corregir el offset de zona horaria
      workoutDate.setDate(workoutDate.getDate() + 1)
      
      const year = workoutDate.getFullYear()
      const month = String(workoutDate.getMonth() + 1).padStart(2, '0')
      const day = String(workoutDate.getDate()).padStart(2, '0')
      const dayKey = `${year}-${month}-${day}` // YYYY-MM-DD con día agregado
      
      console.log('🔍 Debug agrupamiento:', {
        sessionId: workout.session_id,
        userName: workout.user_name,
        created_at: workout.created_at,
        workoutDate: workoutDate.toISOString(),
        dayKey: dayKey
      })
      
      if (!groups[dayKey]) {
        groups[dayKey] = []
      }
      groups[dayKey].push(workout)
    })
    
    return Object.entries(groups)
      .map(([date, workouts]) => ({
        date,
        workouts: workouts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Ordenar grupos por fecha
  }, [socialWorkouts])

  // Cargar datos iniciales cuando se monta el componente
  useEffect(() => {
    console.log('🔄 SocialList montado, cargando datos iniciales')
    loadSocialWorkouts(true)
  }, []) // Solo ejecutar una vez cuando se monta el componente

  // Registrar callback para recargar cuando cambien las configuraciones sociales
  useEffect(() => {
    setOnSocialSettingsChange(() => () => loadSocialWorkouts(true))
    
    // Cleanup: remover callback cuando se desmonte el componente
    return () => {
      setOnSocialSettingsChange(() => {})
    }
  }, [setOnSocialSettingsChange])

  // Escuchar eventos de actualización del feed social
  useEffect(() => {
    const handleSocialRefresh = () => {
      console.log('🔄 Evento de actualización del feed social recibido')
      loadSocialWorkouts(true)
    }

    // Escuchar eventos personalizados para actualizar el feed social
    window.addEventListener('socialFeedRefresh', handleSocialRefresh)
    
    // Cleanup: remover listener cuando se desmonte el componente
    return () => {
      window.removeEventListener('socialFeedRefresh', handleSocialRefresh)
    }
  }, [])

  // Hook para detectar scroll al final usando IntersectionObserver
  useEffect(() => {
    // Solo crear el observer si hay entrenamientos y hay más para cargar
    if (socialWorkouts.length === 0 || !hasMoreRef.current) {
      return
    }

    // Crear un elemento invisible al final del contenido para detectar cuando es visible
    const sentinel = document.createElement('div')
    sentinel.style.height = '1px'
    sentinel.style.width = '100%'
    sentinel.id = 'scroll-sentinel'
    
    // Agregar el sentinel al final del contenido
    const contentContainer = document.querySelector('[data-testid="social-feed-container"]')
    if (!contentContainer) {
      console.log('🔍 No se encontró el contenedor del feed social')
      return
    }
    contentContainer.appendChild(sentinel)
    
    // Crear IntersectionObserver
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        console.log('🔍 IntersectionObserver triggered:', {
          isIntersecting: entry.isIntersecting,
          hasMore: hasMoreRef.current,
          loadingMore: loadingMoreRef.current,
          currentWorkouts: socialWorkouts.length
        })
        
        if (entry.isIntersecting && hasMoreRef.current && !loadingMoreRef.current) {
          console.log('🔄 Activando carga de más entrenamientos por IntersectionObserver')
          loadMoreWorkouts()
        }
      },
      {
        root: null, // Usar viewport como root
        rootMargin: '200px', // Activar 200px antes de que sea visible
        threshold: 0
      }
    )
    
    // Observar el sentinel
    observer.observe(sentinel)
    
    // Cleanup
    return () => {
      observer.disconnect()
      if (sentinel.parentNode) {
        sentinel.parentNode.removeChild(sentinel)
      }
    }
  }, [socialWorkouts.length, hasMoreRef.current]) // Dependencias para recrear cuando cambie el contenido

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
          Cargando feed social...
        </Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  return (
          <Box sx={{ p: 1 }} data-testid="social-feed-container">
        <Typography variant="h4" component="h1" sx={{ mb: 3, fontWeight: 'bold', textAlign: 'center', color: 'primary.main' }}>
          Feed Social
        </Typography>
      
      <Stack spacing={3}>
        {groupedWorkouts.length > 0 ? (
          groupedWorkouts.map(({ date, workouts }) => (
            <Box key={date}>
              {/* Header del día */}
              <Typography variant="h6" sx={{ 
                fontWeight: 600, 
                color: 'text.primary', 
                mb: 2, 
                px: 1,
                textAlign: 'center'
              }}>
                {formatDate(date)}
              </Typography>
              
              {/* Workouts del día */}
              <Stack spacing={2}>
                {workouts.map((workout) => (
                  <Card key={workout.session_id} sx={{ 
                    boxShadow: 2, 
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                      boxShadow: 4,
                      transform: 'translateY(-1px)',
                      transition: 'all 0.2s ease-in-out'
                    }
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      {/* Header del workout */}
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar
                          sx={{ 
                            width: 40, 
                            height: 40, 
                            mr: 2,
                            bgcolor: 'primary.main'
                          }}
                        >
                          {workout.user_name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box sx={{ flex: 1, textAlign: 'left' }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            {workout.user_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {formatRelativeTime(workout.created_at)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right' }}>
                          <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                            {workout.total_exercises}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            {workout.total_exercises === 1 ? 'ejercicio' : 'ejercicios'}
                          </Typography>
                        </Box>
                      </Box>
                      
                      {/* Acciones */}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                  <Typography variant="body2" color="text.secondary">
                            {workout.kudos_count === 0 
                              ? 'Dar el primer kudos' 
                              : `${workout.kudos_count} kudos`
                            }
                          </Typography>
                        
                        <IconButton
                          onClick={() => handleKudos(workout.session_id)}
                          disabled={loadingKudos.has(workout.session_id) || workout.has_kudos}
                          sx={{
                            color: workout.has_kudos ? '#FF9800' : 'text.secondary',
                            mr: -1, // Compensar padding del CardContent
                            '&:hover': {
                              color: workout.has_kudos ? '#FF9800' : 'primary.main'
                            }
                          }}
                        >
                          {loadingKudos.has(workout.session_id) ? (
                            <CircularProgress size={20} />
                          ) : workout.has_kudos ? (
                            <ThumbUpIcon />
                          ) : (
                            <ThumbUpOutlinedIcon />
                          )}
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </Box>
          ))
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              No hay entrenamientos registrados
            </Typography>
          </Box>
        )}

        {/* Indicador de carga para más entrenamientos */}
        {loadingMore && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            py: 3,
            flexDirection: 'column',
            gap: 2
          }}>
            <CircularProgress size={40} thickness={4} sx={{ color: 'primary.main' }} />
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              Cargando más entrenamientos...
            </Typography>
          </Box>
        )}

        {/* Botón para cargar más entrenamientos manualmente */}
        {hasMore && socialWorkouts.length > 0 && !loadingMore && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <button
              onClick={loadMoreWorkouts}
              style={{
                padding: '12px 24px',
                backgroundColor: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Cargar más entrenamientos
            </button>
          </Box>
        )}

        {/* Mensaje cuando no hay más entrenamientos */}
        {!hasMore && socialWorkouts.length > 0 && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              No hay más entrenamientos para mostrar
            </Typography>
          </Box>
        )}
      </Stack>
    </Box>
  )
}
