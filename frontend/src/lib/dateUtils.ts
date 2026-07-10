/**
 * Utilidades de fecha compartidas para el módulo de entrenamientos
 */

export const normalizeDate = (dateStr: string): string => {
  if (!dateStr) return '';
  return dateStr.split('T')[0].split(' ')[0];
}

export const getDateString = (date: any): string => {
  if (!date) return '';
  // Handle both Date and potentially other objects if MUI Adapter changes
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const parseDate = (dateStr: string): Date => {
  try {
    const normalized = normalizeDate(dateStr);
    const [year, month, day] = normalized.split('-').map(Number);
    return new Date(year, month - 1, day);
  } catch (e) {
    console.error('Error parseando fecha:', dateStr, e);
    return new Date(dateStr);
  }
}

export const formatDate = (dateString: string, language: string): string => {
  try {
    const date = parseDate(dateString);

    const weekday = date.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { weekday: 'long' })
    const day = date.getDate()
    const month = date.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', { month: 'long' })

    const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1)
    const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1)

    return language === 'es'
      ? `${capitalizedWeekday} ${day} de ${capitalizedMonth} del ${date.getFullYear()}`
      : `${capitalizedWeekday}, ${capitalizedMonth} ${day}, ${date.getFullYear()}`
  } catch (error) {
    console.error('Error formateando fecha:', error);
    return dateString;
  }
}

export const formatTimeForSport = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else {
    return `${minutes}m`
  }
}
