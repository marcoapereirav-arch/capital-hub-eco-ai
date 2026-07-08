/**
 * Guarda de transición de stage del pipeline (ver SOP producto/13-contactos-pipeline).
 *
 * Regla: en transiciones AUTOMÁTICAS el stage nunca retrocede, y NUNCA se degrada
 * a un contacto que ya es 'alumno' (won).
 *
 * Ladder lineal de avance: dm(0) → lead(1) → agendado(2) → alumno(3).
 * 'dm' = comentó en el reel (aún no dejó datos). Al hacer opt-in pasa a 'lead'.
 * Las ramas (no_show, perdido) no están en el ladder: desde ellas SÍ se puede
 * re-enganchar hacia adelante (ej.: un 'perdido' que vuelve a agendar → 'agendado').
 *
 * Esto NO aplica a movimientos MANUALES en el kanban (override humano deliberado),
 * solo a las automatizaciones (booking, etc.).
 */
const STAGE_RANK: Record<string, number> = { dm: 0, lead: 1, agendado: 2, alumno: 3 }
const WON_STAGES = new Set(["alumno"])

/**
 * Devuelve el stage resultante de una transición automática respetando el no-retroceso.
 * @param current  stage actual del contacto (puede ser null/undefined si es nuevo)
 * @param proposed stage que la automatización quiere aplicar
 */
export function resolveAutoStage(
  current: string | null | undefined,
  proposed: string,
): string {
  if (!current) return proposed
  if (WON_STAGES.has(current)) return current // nunca degradar a un alumno
  const rc = STAGE_RANK[current]
  const rp = STAGE_RANK[proposed]
  // Ambos en el ladder lineal → solo avanzar o mantener.
  if (rc != null && rp != null) return rp >= rc ? proposed : current
  // Ramas (no_show/perdido) o stages desconocidos → permitir re-enganche hacia adelante.
  return proposed
}
