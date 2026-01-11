// Constantes para las pestañas de navegación
export const TABS = {
  WORKOUT: 0,
  EXERCISES: 1,
  // EQUIPMENT: 2 removed
  HISTORY: 2,
  SOCIAL: 3,
  ROUTINES: 4,
  NOTIFICATIONS: 5,
  ADMIN: 6
} as const

export type TabType = typeof TABS[keyof typeof TABS]
