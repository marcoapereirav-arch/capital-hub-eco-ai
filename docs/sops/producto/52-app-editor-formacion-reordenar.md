---
title: App · Editor de formación — reordenar módulos y lecciones + cómo probar la App en local
order: 52
area: producto
---

# App · Editor de formación (reordenar) + setup para trabajar la App

> Creado 2026-07-06. Junta dos cosas que Marco no quiere volver a explicar:
> **(1)** cómo se trabaja y se prueba la App en local, y **(2)** la feature de
> reordenar módulos/lecciones del editor de formación.

---

## 0. Contexto recurrente — "trabaja sobre la APP, no el OS"

La **App de alumnos/formadores** es un repo APARTE del OS. No confundirlos.

| Dato | Valor |
|---|---|
| Directorio local | `/Users/marcoantonio/Marco-Codes/App Capital Hub/` (código en `web/`) |
| Repo GitHub | `marcoapereirav-arch/capital-hub-app` (GitHub personal de Marco) |
| Stack | React 19 + **Vite** (NO Next.js) + TypeScript + Tailwind 3.4 |
| Dominio producción | `app.capitalhubapp.com` (Vercel, deploy en `main`) |
| Supabase de la App | `xkuhkkjeuzxutggbnwed` (ver `web/.env`) |

Ver también [`sistemas/07-repos-separados-os-app.md`](../sistemas/07-repos-separados-os-app.md) — regla de no mezclar commits.

### ✅ Supabase: son DOS bases separadas (confirmado por Marco 2026-07-07)
- **OS** → `aglyoyqtzozdnusltjxe`.
- **App** → `xkuhkkjeuzxutggbnwed` (ver `web/.env`).
- **Son distintas por diseño actual.** El SOP `sistemas/07` estaba desactualizado
  (decía que compartían) — ya corregido. Al tocar datos de la App por API/MCP,
  usar SIEMPRE la Supabase de la App (`xkuhkkjeuzxutggbnwed`).
- **Pendiente de decisión (Marco):** consolidar todo a UNA sola base o mantener
  dos. Recomendación: consolidar a una es más limpio a largo plazo (una sola
  fuente de verdad de usuarios/auth/acceso, menos bugs de sync), pero es una
  migración delicada — hacerla como proyecto planificado ANTES de escalar
  (suscripciones/webinar), no mientras se está en fase de lanzamiento.

---

## 1. Cómo correr / probar la App en local

1. **Node 22 obligatorio.** Node 24 rompe el cargador de config de Vite
   (`@vitejs/plugin-react` ↔ `@rolldown/pluginutils`, error `exactRegex`).
   ```bash
   nvm use 22    # instalar con: nvm install 22
   cd "App Capital Hub/web" && npm run dev   # http://localhost:5173
   ```
2. **Login de prueba:** cuenta `test-agent@capitalhubapp.com`; password en el
   `.env.local` del OS bajo `TEST_AGENT_PASSWORD` (nunca por chat). Es App role
   `ADMIN` super-admin → **puede editar TODAS las formaciones**. Ver
   [`sistemas/02-test-agent.md`](../sistemas/02-test-agent.md).
3. Ruta del editor de formador: `/admin/formaciones` → click una formación →
   `/admin/formaciones/:id` (componente `AdminFormacionDetailPage.tsx`).

### ⚠️ Gotcha de máquina (2026-07-06)
En el Mac actual, `require()` de paquetes grandes del `node_modules` de la App
(tailwindcss, postcss…) **se cuelga varios minutos** (patrón de escaneo de
seguridad/antivirus on-access). Eso rompe `npm run dev` en local aunque Node 22
esté bien. **Workaround:** verificar en una **preview de Vercel** (build en la
nube, entorno limpio) en vez de local. No es problema del código.

---

## 2. La feature: reordenar módulos y lecciones (drag & drop)

### Qué había (bug de raíz)
El editor mostraba un icono de "agarrar" (`GripVertical`, `cursor-grab`) que
**parecía** arrastrable pero **no tenía ninguna lógica de arrastre**: no era
`draggable`, no había `onDragStart/onDrop` ni librería DnD. Las lecciones ni
siquiera tenían icono. Y `saveModule`/`saveLesson` **nunca** guardaban el orden
(`display_order`/`position`) — solo se fijaba al crear. Resultado: el formador
intentaba mover y "no funcionaba / daba error".

### Qué se hizo (fix)
Dos formas de reordenar módulos **y** lecciones, ambas persisten el orden en
Supabase (solo las filas que cambian):
1. **Botones ▲▼ (subir/bajar)** en cada módulo y lección → **método principal,
   100% fiable en móvil táctil y escritorio**, deshabilitados en los extremos.
   (`moveModule` / `moveLesson`.)
2. **Arrastrar (drag & drop)** con **`framer-motion`** (`Reorder` +
   `useDragControls`, ya instalada v12.40); arranca solo desde el grip
   (`dragListener={false}` + `touch-none`) para no romper clicks ni scroll.
   Extra sobre todo en escritorio.

⚠️ **Aprendizaje:** el drag de framer-motion con `useDragControls` es **poco
fiable en móvil táctil** (Marco no lograba moverlas en el teléfono). Por eso los
**botones ▲▼ son el método principal** en esta app mobile-first; el drag es un
complemento. No confiar solo en el arrastre para reordenar en móvil.

### Dónde vive
- Código: `web/src/pages/admin/AdminFormacionDetailPage.tsx`
  (handlers `handleReorderModules/Lessons`, `commitModuleOrder/commitLessonOrder`;
  subcomponentes `ModuleReorderItem` / `LessonReorderItem`).
- Solo se editó ese archivo. El resto del editor (crear/editar/borrar) intacto.

### Base de datos
- `modules.display_order` (INT) y `lessons.position` (INT). **Sin** constraint
  UNIQUE → reordenar no choca con nada.
- RLS: INSERT/UPDATE/DELETE para `ADMIN`/`PROFESSOR` ya existe
  (migración `20260626140000_rls_content_admin_write.sql`). El commit del orden
  detecta si RLS lo bloquea en silencio (0 filas) y resincroniza.

### Estado de verificación
- ✅ Compila limpio (`tsc -b`).
- ✅ **Verificado en vivo en producción** (2026-07-06) con `test-agent` sobre la
  formación "Media Buyer Digital": módulos reordenan y **persisten** tras
  recargar; lecciones también (probado con 2 lecciones temporales que luego se
  borraron). Todo restaurado, sin residuos.
- Nota de método: el local y la preview no servían (gotcha de máquina + preview
  sin env de Supabase), así que se verificó desplegando a prod y probando ahí con
  Playwright, con plan de revert. Blast radius mínimo (solo el editor del
  formador; alumnos no lo ven).

### 🐛 Bug encontrado en el test en vivo (aprendizaje)
La 1ª versión **no persistía**: el arrastre se veía pero al recargar volvía al
orden viejo. Causa: el commit (`onDragEnd`) leía `modulesRef`/`lessonsRef`, que se
sincronizaban vía `useEffect` — y `useEffect` corre DESPUÉS del repintado, mientras
`onDragEnd` corre ANTES. Al guardar, el ref tenía el orden viejo → `updates` vacío
→ no escribía (sin error). **Regla:** con framer-motion `Reorder` + persistir en
`onDragEnd`, actualizar el ref de forma **síncrona dentro del handler `onReorder`**,
nunca vía `useEffect`. (Commit `ae2ca2e`.)

---

## Cambios versionados
- **2026-07-06:** Creado. Fix de reordenar (drag & drop real) en el editor de
  formación de la App + doc de setup local (Node 22, test-agent, gotcha de
  máquina) + flag de discrepancia de Supabase.
- **2026-07-06 (2):** Verificado en vivo en producción (módulos + lecciones
  persisten). Documentado el bug del ref síncrono (commit `ae2ca2e`).
- **2026-07-07:** Marco no veía cambios en el móvil → el drag táctil no era
  fiable. Añadidos **botones ▲▼** (commit `4810f08`), verificados en vivo en
  viewport móvil (mueven + persisten). Confirmado que OS y App usan **Supabase
  separadas**. Feature cerrada.
