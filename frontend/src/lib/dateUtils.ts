/**
 * Utilidades de fecha compartidas para el módulo de entrenamientos
 */

export const normalizeDate = (dateStr: string): string => {
  if (!dateStr) return '';
  return dateStr.split('T')[0].split(' ')[0];
}

export const getDateString = (date: Date): string => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const parseDate = (dateStr: string): Date => {
  if (!dateStr) {
    console.error('Error parseando fecha: string vacío');
    return new Date(NaN);
  }

  try {
    const normalized = normalizeDate(dateStr);
    if (!normalized) return new Date(NaN);

    const parts = normalized.split('-').map(Number);
    if (parts.length !== 3) return new Date(NaN);

    const [year, month, day] = parts;
    if (isNaN(year) || isNaN(month) || isNaN(day)) return new Date(NaN);
    if (month < 1 || month > 12 || day < 1 || day > 31) return new Date(NaN);

    const date = new Date(year, month - 1, day);
    // Validate no overflow (e.g., Feb 30 → Mar 2)
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      return new Date(NaN);
    }

    return date;
  } catch (e) {
    console.error('Error parseando fecha:', dateStr, e);
    return new Date(NaN);
  }
}

export const formatDate = (dateString: string, language: string): string => {
  try {
    const date = parseDate(dateString);
    if (isNaN(date.getTime())) return dateString;

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
