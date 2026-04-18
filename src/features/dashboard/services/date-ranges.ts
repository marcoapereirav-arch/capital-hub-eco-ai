import type { DatePreset, DateRange } from '../types/dashboard'

export const DATE_PRESETS: Array<{ value: DatePreset; label: string }> = [
  { value: 'all_time', label: 'Todo el tiempo' },
  { value: 'today', label: 'Hoy' },
  { value: 'this_week', label: 'Esta semana' },
  { value: 'this_month', label: 'Este mes' },
  { value: 'this_year', label: 'Este ano' },
  { value: 'last_7', label: 'Ultimos 7 dias' },
  { value: 'last_15', label: 'Ultimos 15 dias' },
  { value: 'last_30', label: 'Ultimos 30 dias' },
  { value: 'custom', label: 'Personalizado' },
]

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function endOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

export function resolveDateRange(
  preset: DatePreset,
  customStart?: string | null,
  customEnd?: string | null
): DateRange {
  const now = new Date()
  let start: Date | null = null
  let end: Date | null = endOfDay(now)

  switch (preset) {
    case 'today':
      start = startOfDay(now)
      break
    case 'this_week': {
      const day = now.getDay() // 0 = Sunday
      const diff = day === 0 ? 6 : day - 1 // Make Monday = 0
      const monday = new Date(now)
      monday.setDate(now.getDate() - diff)
      start = startOfDay(monday)
      break
    }
    case 'this_month':
      start = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1))
      break
    case 'this_year':
      start = startOfDay(new Date(now.getFullYear(), 0, 1))
      break
    case 'last_7':
      start = startOfDay(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000))
      break
    case 'last_15':
      start = startOfDay(new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000))
      break
    case 'last_30':
      start = startOfDay(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000))
      break
    case 'custom':
      start = customStart ? startOfDay(new Date(customStart)) : null
      end = customEnd ? endOfDay(new Date(customEnd)) : end
      break
    case 'all_time':
    default:
      start = null
      end = null
  }

  return {
    preset,
    start: start ? start.toISOString() : null,
    end: end ? end.toISOString() : null,
  }
}

export function parseDateRangeFromParams(params: {
  range?: string
  start?: string
  end?: string
}): DateRange {
  const preset = (params.range as DatePreset) || 'all_time'
  return resolveDateRange(preset, params.start, params.end)
}
