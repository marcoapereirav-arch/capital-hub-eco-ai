/**
 * Curva de atenuación para tasks `done`:
 * - hoy            -> 0.90
 * - hace ~7 días   -> 0.70
 * - hace ~30 días  -> 0.50
 * - hace 90+ días  -> 0.25 (mínimo)
 *
 * Interpola linealmente entre puntos de control.
 */
export function doneOpacity(completedAtIso: string | null): number {
  if (!completedAtIso) return 1
  const completed = new Date(completedAtIso).getTime()
  if (Number.isNaN(completed)) return 1
  const days = (Date.now() - completed) / (1000 * 60 * 60 * 24)

  if (days < 0) return 0.9
  if (days <= 7) {
    // 0..7 -> 0.90..0.70
    return 0.9 + ((0.7 - 0.9) * days) / 7
  }
  if (days <= 30) {
    // 7..30 -> 0.70..0.50
    return 0.7 + ((0.5 - 0.7) * (days - 7)) / 23
  }
  if (days <= 90) {
    // 30..90 -> 0.50..0.25
    return 0.5 + ((0.25 - 0.5) * (days - 30)) / 60
  }
  return 0.25
}
