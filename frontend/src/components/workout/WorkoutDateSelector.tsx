import { useState, useEffect, useMemo } from 'react'
import { Box, FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material'
import { useLanguage } from '../../contexts/LanguageContext'
import { translations } from '../../i18n/translations'

type WorkoutDateSelectorProps = {
  isLoading?: boolean
  onChange: (date: string) => void
}

export default function WorkoutDateSelector({ isLoading, onChange }: WorkoutDateSelectorProps) {
  const { language } = useLanguage()
  const t = translations[language].workout

  const now = useMemo(() => new Date(), [])
  const currentDay = now.getDate()
  const currentMonthNum = now.getMonth() + 1
  const currentYearNum = now.getFullYear()

  const [selectedDay, setSelectedDay] = useState<number | string>(currentDay)
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonthNum)
  const [selectedYear, setSelectedYear] = useState<number>(currentYearNum)

  // Calcular días del mes seleccionado
  const daysInMonth = useMemo(() => new Date(selectedYear, selectedMonth, 0).getDate(), [selectedYear, selectedMonth])

  // Límite máximo para el día (no permitir fechas futuras)
  const maxDayAllowed = useMemo(() => {
    if (selectedYear === currentYearNum && selectedMonth === currentMonthNum) {
      return currentDay
    }
    return daysInMonth
  }, [selectedYear, selectedMonth, currentYearNum, currentMonthNum, currentDay, daysInMonth])

  // Ajustar el día si queda fuera de los límites al cambiar mes/año
  useEffect(() => {
    if (typeof selectedDay === 'number' && selectedDay > maxDayAllowed) {
      setSelectedDay(maxDayAllowed)
    }
  }, [maxDayAllowed, selectedDay])

  // Notificar cambios al componente padre
  useEffect(() => {
    if (selectedDay === '') {
      onChange('')
    } else {
      const formattedDate = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${selectedDay.toString().padStart(2, '0')}`
      onChange(formattedDate)
    }
  }, [selectedYear, selectedMonth, selectedDay, onChange])

  // Opciones de mes (actual y anterior)
  const monthOptions = useMemo(() => {
    const options = []
    
    // Mes actual
    const currentLabel = new Date(currentYearNum, currentMonthNum - 1).toLocaleString(language === 'es' ? 'es-ES' : 'en-US', { month: 'long' })
    options.push({
      value: `${currentYearNum}-${currentMonthNum}`,
      label: currentLabel.charAt(0).toUpperCase() + currentLabel.slice(1)
    })
    
    // Mes anterior
    const prevDate = new Date(currentYearNum, currentMonthNum - 2, 1)
    const prevMonth = prevDate.getMonth() + 1
    const prevYear = prevDate.getFullYear()
    const prevLabel = prevDate.toLocaleString(language === 'es' ? 'es-ES' : 'en-US', { month: 'long' })
    options.push({
      value: `${prevYear}-${prevMonth}`,
      label: prevLabel.charAt(0).toUpperCase() + prevLabel.slice(1)
    })
    
    return options
  }, [currentMonthNum, currentYearNum, language])

  return (
    <Box sx={{ display: 'flex', gap: 2 }}>
      <TextField
        label={t.day}
        type="number"
        size="small"
        fullWidth
        value={selectedDay}
        onChange={(e) => {
          const val = parseInt(e.target.value)
          if (e.target.value === '') {
            setSelectedDay('')
            return
          }
          if (!isNaN(val) && val >= 1 && val <= maxDayAllowed) {
            setSelectedDay(val)
          }
        }}
        inputProps={{ 
          min: 1, 
          max: maxDayAllowed,
          inputMode: 'numeric'
        }}
        disabled={isLoading}
      />
      <FormControl fullWidth size="small" disabled={isLoading}>
        <InputLabel id="month-select-label">{t.month}</InputLabel>
        <Select
          labelId="month-select-label"
          label={t.month}
          value={`${selectedYear}-${selectedMonth}`}
          onChange={(e) => {
            const [year, month] = (e.target.value as string).split('-').map(Number)
            setSelectedMonth(month)
            setSelectedYear(year)
          }}
        >
          {monthOptions.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl fullWidth size="small" disabled>
        <InputLabel id="year-select-label">{t.year}</InputLabel>
        <Select
          labelId="year-select-label"
          label={t.year}
          value={selectedYear}
        >
          <MenuItem value={selectedYear}>{selectedYear}</MenuItem>
        </Select>
      </FormControl>
    </Box>
  )
}
