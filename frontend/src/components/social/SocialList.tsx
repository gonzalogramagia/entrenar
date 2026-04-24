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
  IconButton,
  Button
} from '@mui/material'
import {
  ThumbUp as ThumbUpIcon,
  ThumbUpOutlined as ThumbUpOutlinedIcon
} from '@mui/icons-material'
import { apiClient } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { useUserSettings } from '../../contexts/UserSettingsContext'
import { useLanguage } from '../../contexts/LanguageContext'
import { translations } from '../../i18n/translations'


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
  const { language } = useLanguage()
  const t = translations[language].social
  const { user, isGuest, signInWithGoogle } = useAuth()
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

      const weekday = date.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { weekday: 'long' })
      const day = date.getDate()
      const month = date.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { month: 'long' })

      const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1)
      const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1)

      return language === 'es'
        ? `${capitalizedWeekday} ${day} de ${capitalizedMonth}`
        : `${capitalizedWeekday}, ${capitalizedMonth} ${day}`
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

      if (diffInMinutes < 1) return t.moment
      if (diffInMinutes === 1) return language === 'es' ? 'Hace 1 minuto' : '1 minute ago'
      if (diffInMinutes < 60) return language === 'es' ? `Hace ${diffInMinutes} minutos` : `${diffInMinutes} minutes ago`

      const diffInHours = Math.floor(diffInMinutes / 60)
      if (diffInHours === 1) return language === 'es' ? 'Hace 1 hora' : '1 hour ago'
      if (diffInHours < 24) return language === 'es' ? `Hace ${diffInHours} horas` : `${diffInHours} hours ago`

      const diffInDays = Math.floor(diffInHours / 24)
      if (diffInDays === 1) return t.yesterday
      if (diffInDays < 7) return language === 'es' ? `Hace ${diffInDays} días` : `${diffInDays} days ago`

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

      if (isGuest) {
        // Datos Mock para Modo Invitado
        const mockSocialWorkouts: SocialWorkout[] = [
          {
            session_id: 10001,
            user_id: 'guest1',
            user_name: 'Carlos Ruiz',
            workout_date: new Date().toISOString(),
            created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // Hace 30 min
            total_exercises: 3,
            total_sets: 9,
            exercises: [],
            kudos_count: 3,
            has_kudos: false
          },
          {
            session_id: 10002,
            user_id: 'guest2',
            user_name: 'Marta García',
            workout_date: new Date().toISOString(),
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // Hace 2 horas
            total_exercises: 4,
            total_sets: 12,
            exercises: [],
            kudos_count: 5,
            has_kudos: true
          },
          {
            session_id: 10003,
            user_id: 'guest3',
            user_name: 'Juan Pérez',
            workout_date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // Ayer
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
            total_exercises: 5,
            total_sets: 15,
            exercises: [],
            kudos_count: 8,
            has_kudos: false
          },
          {
            session_id: 10004,
            user_id: 'guest4',
            user_name: 'Sofía López',
            workout_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // Hace 2 días
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 - 1000 * 60 * 60).toISOString(),
            total_exercises: 4,
            total_sets: 12,
            exercises: [],
            kudos_count: 12,
            has_kudos: false
          }
        ]

        if (reset) {
          setSocialWorkouts(mockSocialWorkouts)
        } else {
          // No cargamos más en modo invitado para simplificar
          setHasMore(false)
          hasMoreRef.current = false
        }
        setLoading(false)
        setLoadingMore(false)
        loadingMoreRef.current = false
        return
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
    if (isGuest) {
      signInWithGoogle()
      return
    }
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
      setOnSocialSettingsChange(() => { })
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
          {translations[language].common.loading}
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
      <Box sx={{ mb: 4, mt: 2, textAlign: 'center' }}>
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
                            {workout.total_exercises === 1 ? (language === 'es' ? 'ejercicio' : 'exercise') : (language === 'es' ? 'ejercicios' : 'exercises')}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Acciones */}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          {workout.kudos_count === 0
                            ? t.firstKudos
                            : `${workout.kudos_count} ${t.kudos}`
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
              {t.noWorkouts}
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
              {translations[language].common.loading}
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
              {t.loadMore}
            </button>
          </Box>
        )}

        {/* Mensaje cuando no hay más entrenamientos */}
        {!hasMore && socialWorkouts.length > 0 && (
          <Box sx={{ textAlign: 'center', py: 4, px: 2 }}>
            {isGuest ? (
              <Box sx={{ 
                bgcolor: 'rgba(25, 118, 210, 0.05)', 
                p: 3, 
                borderRadius: 4, 
                border: '1px dashed', 
                borderColor: 'primary.main' 
              }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 2 }}>
                  {language === 'es' 
                    ? 'Estos son datos de prueba para el modo invitado. Para ver actividad real de otros usuarios, inicia sesión.'
                    : 'This is mock data for guest mode. To see real activity from other users, please sign in.'}
                </Typography>
                <Button 
                  variant="contained" 
                  onClick={signInWithGoogle}
                  sx={{ 
                    borderRadius: '20px', 
                    textTransform: 'none',
                    fontWeight: 700,
                    px: 3
                  }}
                >
                  {language === 'es' ? 'Iniciar sesión con Google' : 'Sign in with Google'}
                </Button>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                {t.noMore}
              </Typography>
            )}
          </Box>
        )}
      </Stack>
    </Box>
  )
}
