/**
 * Utilidades de ejercicios para el módulo de entrenamientos
 */

// Función para obtener el emoji del deporte
export const getSportEmoji = (exerciseName: string): string | null => {
  const name = exerciseName.toLowerCase()
  if (name.includes('fútbol')) return '⚽'
  if (name.includes('básquet') || name.includes('baloncesto')) return '🏀'
  if (name.includes('pádel')) return '🎾'
  if (name.includes('voley')) return '🏐'
  if (name.includes('bici')) return '🚴'
  if (name.includes('handball')) return '🤾‍♂️'
  if (name.includes('hockey')) return '🏑'
  if (name.includes('natación')) return '🏊‍♂️'
  if (name.includes('running')) return '🏃‍♂️'
  return null
}

// Función para limpiar el nombre del ejercicio (quitar emojis)
export const cleanExerciseName = (exerciseName: string): string => {
  return exerciseName
    .replace(/🚴\s*/g, '') // Bici
    .replace(/🏃‍♂️\s*/g, '') // Running
    .replace(/⚽\s*/g, '') // Fútbol
    .replace(/🏀\s*/g, '') // Básquet
    .replace(/🎾\s*/g, '') // Pádel
    .replace(/🏐\s*/g, '') // Voley
    .replace(/🤾‍♂️\s*/g, '') // Handball
    .replace(/🏑\s*/g, '') // Hockey
    .replace(/🏊‍♂️\s*/g, '') // Natación
    .trim()
}
