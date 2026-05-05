---
title: Vercel - deploy y colaboracion
order: 11
---

# Vercel — deploy y colaboración (CRÍTICO)

> Producción de Capital Hub Eco AI vive en el **team Vercel Pro de Adrian** desde 2026-05-05. NO existe ni debe crearse el proyecto en otro Vercel personal.

## Dónde vive producción

| Cosa | Valor |
|---|---|
| Vercel Team | `adrianvillanuevarios-cmd's projects` (slug: `adrianvillanuevarios-cmds-projects`) |
| Plan | Vercel Pro |
| Project Name | `capital-hub-eco-ai` |
| Project ID | `prj_hVU242RC7DqTFhHG2IXXjy85w7G9` |
| Org/Team ID | `team_OCUInwCbENX6QMySAqxsjuJN` |
| Dominio público | `ecoai.capitalhubapp.com` (subdominio asignado al proyecto) |
| Apex `capitalhubapp.com` | RESERVADO. No lo asignamos a este proyecto. Marco lo reserva para uso futuro. |
| Repo GitHub | `marcoapereirav-arch/capital-hub-eco-ai` rama `main` |

Dashboard: `https://vercel.com/adrianvillanuevarios-cmds-projects/capital-hub-eco-ai`

## Quién deploya

**Marco y Adrian son miembros del team Pro con GitHub vinculado.** Esto significa que cualquiera de los dos puede pushear a `main` y Vercel auto-despliega automáticamente, sin distinción.

- Marco GitHub: `marcoapereirav-arch` → vinculado a Vercel `marcoapereirav-7979`
- Adrian GitHub: `adrianvillanuevarios-cmd` → vinculado a Vercel del team Pro

**No se debe crear el proyecto en cuentas personales de ninguno de los dos.** Eso fue el origen del incidente del 2026-05-05.

## Workflow diario obligatorio

### Antes de empezar a trabajar
```
git pull origin main
```
Sin excepción. Cada vez que abres el laptop, vuelves de comer, o sabes que el otro ha estado activo.

### Mientras trabajas
Commits locales constantes (5–20 al día). No hay que pushear cada uno.

### Al terminar un bloque de trabajo
```
git push origin main
```
Después de pushear, esperar 60–90 segundos y verificar:
```
curl https://ecoai.capitalhubapp.com/api/version
```
El SHA debe coincidir con el último commit pusheado.

### Si push es rechazado (porque el otro pusheó antes)
```
git pull --rebase origin main
git push
```

### Reglas duras
- **NUNCA** `git push --force` a `main`.
- **NUNCA** crear el proyecto en otro Vercel "para probar".
- **NUNCA** commits con secrets (`.env*` siempre en `.gitignore`).
- **SIEMPRE** verificar el SHA en producción tras un push importante.
- **SIEMPRE** avisar al otro si vas a tocar archivos de la misma feature al mismo tiempo.

## Variables de entorno (env vars)

Vercel mantiene 34+ env vars cifradas en producción. La fuente de verdad es siempre el dashboard del team (Settings → Environment Variables del proyecto).

### Categorías presentes
- **Supabase:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_SERVICE_KEY`, `SUPABASE_PAT`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_PROJECT_REF`
- **Resend (emails):** `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_FROM_NAME`
- **Whop (checkout):** `WHOP_API_KEY`, `WHOP_COMPANY_ID`, `WHOP_WEBHOOK_SECRET`, `WHOP_PRODUCT_ID_*`, `WHOP_PLAN_ID_*`, `NEXT_PUBLIC_WHOP_CHECKOUT_URL_*`
- **Meta (Pixel + CAPI):** `META_PIXEL_ID`, `NEXT_PUBLIC_META_PIXEL_ID`, `META_CAPI_TOKEN`, `META_AD_ACCOUNT_ID`, `META_TEST_EVENT_CODE`
- **Push (PWA):** `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
- **Generales:** `NEXT_PUBLIC_SITE_URL`, `CRON_SECRET`, `INTERNAL_NOTIF_EMAIL_MARCO`, `INTERNAL_NOTIF_EMAIL_ADRIAN`

### Cómo añadir una env var nueva
1. Dashboard del proyecto → Settings → Environment Variables → Add
2. Avisar al otro colaborador inmediatamente (Telegram/WhatsApp): "añadí `X_API_KEY` a Vercel".
3. Si el código local la usa, también añadirla a `.env.local` para desarrollo.

**Si uno commitea código que requiere una env var nueva pero olvida ponerla en Vercel, el deploy puede fallar o el endpoint romperá en producción.** Cuidado.

## Si necesitas usar Vercel CLI desde tu máquina

El repo local de Marco está linkeado al proyecto en el team de Adrian. Si Vercel CLI dice "Project not linked" o similar (por ejemplo si clonas el repo en otra máquina), correr:

```
npx vercel link --yes --project capital-hub-eco-ai --scope adrianvillanuevarios-cmds-projects
```

Esto solo modifica `.vercel/project.json` (que está gitignored). No toca código ni producción.

Comandos útiles tras el link:
- `npx vercel env ls production` → listar env vars
- `npx vercel env pull .env.local` → bajar env vars de producción a local
- `npx vercel logs <url>` → ver logs de un deploy

## DNS y dominio

- Registrar del dominio `capitalhubapp.com`: cuenta de Adrian, Third Party (no Vercel).
- Subdominio `ecoai.capitalhubapp.com` configurado como CNAME apuntando a Vercel:
  - `dig +short ecoai.capitalhubapp.com CNAME` → `*.vercel-dns-017.com`
- Apex `capitalhubapp.com`: NO asignado a este proyecto. Marco lo reserva para futuro uso (otra landing, etc.).

## Cambios versionados

### 2026-05-05 — Migración desde Vercel personal de Marco a Vercel Pro de Adrian

**Origen del incidente:**
El proyecto vivía originalmente en el Vercel personal Hobby de Marco (`marco-antonios-projects-65b6a537`). Solo Marco era miembro. Cuando Adrian (autor distinto en Git, sin vínculo con esa cuenta Vercel) hacía `git push`, los commits llegaban a GitHub pero Vercel **NO auto-deployaba** porque el autor del commit no era miembro del team Vercel destino. Adrian acumuló 3 commits sin desplegar (`a174da8`, `e6ac6d6`, `808b1d1`) que añadían rutas `/manychat`, `/instagram`, `/api/webhooks/manychat`. Producción quedó atascada en `7c2a777`.

**Causa raíz:**
Vercel solo dispara auto-deploy cuando el autor del commit en Git tiene su cuenta GitHub vinculada como miembro del team Vercel donde vive el proyecto. El plan Hobby de Vercel **no permite añadir miembros** — solo el dueño puede deployar.

**Solución implementada:**
1. Adrian compró Vercel Pro en su cuenta personal (cuenta convertida automáticamente en team Pro).
2. Adrian invitó a Marco como miembro Owner.
3. Marco aceptó y vinculó su GitHub `marcoapereirav-arch`.
4. Adrian creó por error un proyecto duplicado en su nuevo team. Lo borró antes de la migración.
5. Marco quitó el dominio `capitalhubapp.com` de su Vercel personal.
6. Marco hizo Transfer Project del proyecto `capital-hub-eco-ai` desde su Vercel personal al team Pro de Adrian (Settings → General → Transfer Project). Las 34 env vars y el historial de deploys viajaron automáticamente.
7. Adrian añadió `ecoai.capitalhubapp.com` como dominio del proyecto en su team. NO añadió el apex `capitalhubapp.com` (Marco lo reserva).
8. Marco re-linkó su repo local con `vercel link --yes --project capital-hub-eco-ai --scope adrianvillanuevarios-cmds-projects`.

**Resultado:**
- Ambos pueden pushear a `main` y auto-deploy funciona para los dos.
- Producción sigue funcional en `ecoai.capitalhubapp.com`.
- Apex `capitalhubapp.com` libre para futuro uso.

**Aprendizaje (regla a futuro):**
- Para cualquier proyecto en producción donde haya 2+ colaboradores, el Vercel **debe ser un team Pro** desde el inicio, no Hobby personal. Hobby colapsa cuando entra un segundo dev.
- Si un proyecto fue creado en Hobby personal y entra un segundo dev: o se transfiere a un team Pro, o el segundo dev está condenado a no desplegar.
- Cuando se haga Transfer Project entre cuentas, el orden importa: primero borrar duplicados en el destino, después ajustar dominios, después transferir.

### 2026-05-05 — Fix bug ffprobe pre-existente que bloqueaba builds

**Síntoma:** después de migrar a Vercel Pro, el primer auto-deploy de Marco falló con `Module not found: Can't resolve 'ffprobe-static'`. Los 2 deploys anteriores (de hace 17h y 19h, antes de la migración) habían fallado por la misma razón.

**Causa raíz:**
El archivo [src/features/video-edit/services/video-metadata.ts](../../src/features/video-edit/services/video-metadata.ts) importaba `ffprobe-static`, paquete que no estaba en `package.json`. El paquete instalado era `@ffprobe-installer/ffprobe` (con `.path` similar). Probable refactor incompleto.

**Fix aplicado en 2 commits:**

1. `1de70e5` — Cambio del import en `video-metadata.ts`:
   ```ts
   // antes
   import ffprobeStatic from 'ffprobe-static'
   // después
   import ffprobeInstaller from '@ffprobe-installer/ffprobe'
   ```
   También removí el `@ts-expect-error` porque el paquete nuevo trae tipos.

2. `c7002e6` — Actualización de [next.config.ts](../../next.config.ts):
   - Añadido `@ffprobe-installer/ffprobe` y `fluent-ffmpeg` a `serverExternalPackages`. Sin esto, Turbopack intenta empaquetar el binario nativo de ffprobe (linux-x64) en los Server Functions y falla con "Unknown module type".
   - Eliminadas entries muertas de `ffprobe-static` y `ffmpeg-static` (no están instaladas).

**Resultado:**
Build pasa verde en 90s. Producción avanza al SHA `c7002e6`. Los endpoints nuevos de Adrian (`/manychat` 307, `/instagram` 307, `/api/webhooks/manychat` 405 a GET) responden correctamente.

**Pendiente (no urgente):**
Adrian debe añadir env vars en Vercel cuando active ManyChat/Instagram en producción:
- `MANYCHAT_API_KEY`, `MANYCHAT_WEBHOOK_SECRET`
- `IG_ACCESS_TOKEN`, `IG_APP_ID`, `IG_APP_SECRET`, `IG_USER_ID`
- `META_APP_ID`, `META_APP_SECRET`

Sin estas las rutas nuevas fallarán en runtime cuando ManyChat las llame, pero el resto del sitio funciona perfectamente.

**Aprendizaje:**
- Cuando un paquete tiene binarios nativos (ffmpeg, ffprobe, sharp, etc.) **siempre** añadirlo a `serverExternalPackages` en `next.config.ts`. Turbopack no sabe procesar binarios.
- Si se cambia un import de paquete a otro equivalente (`ffprobe-static` → `@ffprobe-installer/ffprobe`), revisar también `next.config.ts` por si la entry vieja sigue ahí.
- Antes de declarar "auto-deploy roto" investigar si el build falla por otra razón previa (env vars, packages, etc.).
