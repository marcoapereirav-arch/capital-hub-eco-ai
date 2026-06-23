/**
 * Cuenta-bot de pruebas (test-agent). NUNCA debe recibir notificaciones de equipo:
 * es un super_admin técnico para Playwright/smoke tests, no una persona real.
 *
 * Al consultar super_admins para notificar, filtrar siempre con:
 *   .neq("email", TEST_AGENT_EMAIL)
 */
export const TEST_AGENT_EMAIL = "test-agent@capitalhubapp.com"
