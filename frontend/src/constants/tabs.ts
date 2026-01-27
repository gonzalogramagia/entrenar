// Constantes para las pestañas de navegación
export const TABS = {
  WORKOUT: 0,
  HISTORY: 1,
  ROUTINES: 2,
  EXERCISES: 3,
  SOCIAL: 4,
  NOTIFICATIONS: 5,
  ADMIN: 6
} as const

export type TabType = typeof TABS[keyof typeof TABS]
