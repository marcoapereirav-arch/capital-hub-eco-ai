---
title: Test Agent · cuenta interna del agente Claude
order: 2
area: sistemas
---

# Test Agent — cuenta interna del agente Claude

## Para qué
Cuenta del sistema que el agente Claude usa para hacer login programático en el OS y la App durante tests (Playwright, smoke tests post-deploy). NUNCA se toca la cuenta real de Marco o Adrián.

## Datos

```
email:    test-agent@capitalhubapp.com
auth_id:  da25ab93-9fa3-4139-80a9-1745145ff8b2
```

La password está guardada en `.env.local` (gitignored) bajo `TEST_AGENT_PASSWORD`. Si el agente necesita rotarla, lo hace via `supabase.auth.admin.updateUserById` y actualiza `.env.local`.

## Roles

| Capa | Tabla | role |
|------|-------|------|
| Auth | `auth.users.raw_user_meta_data.role` | `ADMIN` |
| OS   | `public.profiles.role` | `super_admin` |
| App  | `public.users.role` | `ADMIN` |

Eso le da acceso TOTAL a:
- OS (`ecoai.capitalhubapp.com/*`)
- App (`app.capitalhubapp.com/*`)
- Endpoints `/api/admin/*`

## Cuándo usarla
- Auditoría visual con Playwright (capturar screenshots por página)
- Smoke tests post-deploy (verificar que login + carga inicial funciona)
- Reproducir bugs reportados sin pedir al usuario sus credenciales
- Tests automatizados manuales del flujo end-to-end

## Reglas estrictas
- **JAMÁS** se usa para crear contactos, ventas o data real del negocio
- **JAMÁS** se sustituye por la cuenta de Marco o Adrián
- Si aparece en `email_logs` o `contact_journey_events` es señal de bug — investigar
- Si necesita ser eliminada (auditoría externa, etc): `supabase.auth.admin.deleteUser()` + limpiar filas de `public.profiles` y `public.users`

## Verificación de salud
```sql
select email, raw_user_meta_data->>'role' as role
from auth.users
where email = 'test-agent@capitalhubapp.com';
-- esperado: role = ADMIN

select role, active from public.profiles where email = 'test-agent@capitalhubapp.com';
-- esperado: role = super_admin, active = true
```
