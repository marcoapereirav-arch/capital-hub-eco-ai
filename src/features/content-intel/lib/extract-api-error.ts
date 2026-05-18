/**
 * Helper para extraer mensaje de error legible desde respuestas del API.
 *
 * El endpoint puede devolver:
 *   { ok: false, error: 'invalid_input', issues: { fieldErrors, formErrors } }
 *   { ok: false, error: 'message_legible' }
 *   { ok: false, error: 'code', detail: 'mensaje' }
 *
 * Esta función SIEMPRE devuelve un string descriptivo apto para mostrar.
 */
export function extractApiError(
  json: unknown,
  fallbackStatus?: number,
): string {
  if (!json || typeof json !== 'object') {
    return fallbackStatus ? `HTTP ${fallbackStatus}` : 'Error desconocido'
  }

  const obj = json as {
    error?: string
    detail?: string
    issues?: {
      fieldErrors?: Record<string, string[]>
      formErrors?: string[]
    }
  }

  // Si hay issues de Zod, los priorizamos porque son lo más útil
  if (obj.error === 'invalid_input' && obj.issues) {
    const fieldErrors = obj.issues.fieldErrors ?? {}
    const formErrors = obj.issues.formErrors ?? []
    const messages: string[] = []
    for (const [field, errors] of Object.entries(fieldErrors)) {
      if (errors && errors.length > 0) {
        messages.push(`${field}: ${errors[0]}`)
      }
    }
    if (formErrors.length > 0) {
      messages.push(...formErrors)
    }
    if (messages.length > 0) {
      return `Validación: ${messages.join('; ')}`
    }
    return 'Entrada inválida (revisa los campos del formulario)'
  }

  if (obj.detail) return String(obj.detail)
  if (obj.error) return String(obj.error)
  return fallbackStatus ? `HTTP ${fallbackStatus}` : 'Error desconocido'
}
