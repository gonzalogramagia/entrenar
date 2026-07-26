import { Box, Snackbar, Alert, Backdrop, CircularProgress, Typography } from '@mui/material'
import { useState } from 'react'
import AdminPanel from '../admin/AdminPanel'
import Navigation from '../navigation/Navigation'
import SettingsModal from '../settings/SettingsModal'
import NotificationsModal from '../notifications/NotificationsModal'
import { useLanguage } from '../../contexts/LanguageContext'
import { translations } from '../../i18n/translations'
import { TABS, type TabType } from '../../constants/tabs'
import { UserSettingsProvider } from '../../contexts/UserSettingsContext'
import { AuthProvider, useAuth } from '../../contexts/AuthContext'
import { useTab } from '../../contexts/TabContext'
import FloatingNavButton from '../navigation/FloatingNavButton'
import FloatingNavButtons from '../navigation/FloatingNavButtons'
import ConfettiAnimation from '../animations/ConfettiAnimation'
import AppRouter from './AppRouter'
import { useGlobalData } from '../../hooks/useGlobalData'
import { useActiveRoutine } from '../../hooks/useActiveRoutine'
import { useNotificationsPoller } from '../../hooks/useNotificationsPoller'
import { apiClient } from '../../lib/api'

function AuthenticatedAppContent() {
  const { language } = useLanguage()
  const t = translations[language]
  const { activeTab, setActiveTab } = useTab()
  const { userRole, isAdmin, isSigningIn, isLoggingOut } = useAuth()
  
  const { exercises, isLoading } = useGlobalData()
  const { unreadNotifications, loadUnreadNotificationsCount } = useNotificationsPoller()
  const [showConfetti, setShowConfetti] = useState(false)
  
  const {
    activeRoutine,
    routineProgress,
    isRoutinePaused,
    preloadedExercise,
    handleStopRoutine,
    calculateRoutineProgress,
    getNextExerciseOrSet,
    completeRoutine,
    handleExerciseCompleted
  } = useActiveRoutine(setActiveTab, setShowConfetti)

  const [isSubmittingWorkout, setIsSubmittingWorkout] = useState(false)
  const [deleteMessage, setDeleteMessage] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false)
  const [adminPanelOpen, setAdminPanelOpen] = useState(false)

  const handleTabChange = (newValue: TabType) => setActiveTab(newValue)
  const handleNavigateToRoutines = () => setActiveTab(TABS.ROUTINES)

  const handleWorkoutSubmit = async (data: any): Promise<void> => {
    setIsSubmittingWorkout(true)
    try {
      const selectedDate = data.date || new Date().toISOString().split('T')[0]

      const workoutData: any = {
        exercise_id: data.exercise_id,
        reps: data.reps || 0,
        set: data.set || 1,
        seconds: data.seconds || undefined,
        observations: data.observations || '',
        date: selectedDate
      }

      if (data.weight !== undefined && data.weight !== null && data.weight > 0) {
        workoutData.weight = data.weight
      }

      await apiClient.createWorkout(workoutData)

      if (activeRoutine && preloadedExercise) {
        const nextExercise = getNextExerciseOrSet(preloadedExercise, data.set)

        if (nextExercise) {
          const newProgress = await calculateRoutineProgress()
          await handleExerciseCompleted(nextExercise, newProgress)
        } else {
          completeRoutine()
        }
      }
    } catch (error) {
      console.error('❌ Error guardando workout:', error)
      throw error
    } finally {
      setIsSubmittingWorkout(false)
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Navigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onOpenSettings={() => setSettingsModalOpen(true)}
        onOpenNotifications={async () => {
          await loadUnreadNotificationsCount()
          setNotificationsModalOpen(true)
        }}
        onOpenAdminPanel={() => setAdminPanelOpen(true)}
        unreadNotifications={unreadNotifications}
      />

      <Box sx={{
        flexGrow: 1,
        p: { xs: 1, sm: 2 },
        pb: 0,
        overflow: 'auto',
        '&::-webkit-scrollbar': { display: 'none' },
        '&::-moz-scrollbar': { display: 'none' },
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}>
        <AppRouter
          activeTab={activeTab}
          exercises={exercises}
          handleWorkoutSubmit={handleWorkoutSubmit}
          isSubmittingWorkout={isSubmittingWorkout}
          activeRoutine={activeRoutine}
          isRoutinePaused={isRoutinePaused}
          handleStopRoutine={handleStopRoutine}
          preloadedExercise={preloadedExercise}
          handleNavigateToRoutines={handleNavigateToRoutines}
          userRole={userRole}
          isAdmin={isAdmin}
          routineProgress={routineProgress}
        />
      </Box>

      {/* Notificaciones para eliminación */}
      <Snackbar open={!!deleteMessage} autoHideDuration={3000} onClose={() => setDeleteMessage('')} anchorOrigin={{ vertical: 'top', horizontal: 'center' }} sx={{ mt: 6, zIndex: 99998 }}>
        <Alert severity="success" sx={{ width: '100%', minWidth: '300px', backgroundColor: '#e8f5e8', color: '#2e7d32' }}>✅ {deleteMessage}</Alert>
      </Snackbar>

      <Snackbar open={!!deleteError} autoHideDuration={4000} onClose={() => setDeleteError('')} anchorOrigin={{ vertical: 'top', horizontal: 'center' }} sx={{ mt: 6, zIndex: 99999 }}>
        <Alert severity="error" sx={{ width: '100%', minWidth: '300px', backgroundColor: '#ffebee', color: '#c62828' }}>❌ {deleteError}</Alert>
      </Snackbar>

      {/* Loader completo para carga inicial y logout */}
      <Backdrop sx={{ color: 'white', zIndex: 99999, backgroundColor: 'rgba(25, 118, 210, 0.95)', backdropFilter: 'blur(2px)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} open={isLoading || isLoggingOut || isSigningIn}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, marginTop: '-120px' }}>
          <CircularProgress size={48} thickness={4} sx={{ color: 'white' }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
            {isLoggingOut ? (language === 'es' ? 'Cerrando sesión...' : 'Logging out...') : isSigningIn ? t.login.authenticating : (language === 'es' ? 'Cargando...' : 'Loading...')}
          </Typography>
        </Box>
      </Backdrop>

      <FloatingNavButton currentTab={activeTab} onTabChange={handleTabChange} activeRoutine={activeRoutine} />
      
      <SettingsModal open={settingsModalOpen} onClose={() => setSettingsModalOpen(false)} exercises={exercises} />
      
      <NotificationsModal open={notificationsModalOpen} onClose={() => setNotificationsModalOpen(false)} onMarkAsRead={loadUnreadNotificationsCount} />

      {adminPanelOpen && <AdminPanel open={adminPanelOpen} onClose={() => setAdminPanelOpen(false)} />}

      <FloatingNavButtons />
      <ConfettiAnimation trigger={showConfetti} onComplete={() => setShowConfetti(false)} />
    </Box>
  )
}

export default function AuthenticatedApp() {
  return (
    <UserSettingsProvider>
      <AuthProvider>
        <AuthenticatedAppContent />
      </AuthProvider>
    </UserSettingsProvider>
  )
}
