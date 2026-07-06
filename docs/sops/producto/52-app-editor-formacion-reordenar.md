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
| Directorio local | `/Users/marcoantonio/Desktop/Marco-Codes/App Capital Hub/` (código en `web/`) |
| Repo GitHub | `marcoapereirav-arch/capital-hub-app` (GitHub personal de Marco) |
| Stack | React 19 + **Vite** (NO Next.js) + TypeScript + Tailwind 3.4 |
| Dominio producción | `app.capitalhubapp.com` (Vercel, deploy en `main`) |
| Supabase de la App | `xkuhkkjeuzxutggbnwed` (ver `web/.env`) |

Ver también [`sistemas/07-repos-separados-os-app.md`](../sistemas/07-repos-separados-os-app.md) — regla de no mezclar commits.

### ⚠️ Discrepancia de Supabase (a confirmar con Marco)
- `web/.env` de la App apunta a la Supabase **`xkuhkkjeuzxutggbnwed`**.
- El OS usa **`aglyoyqtzozdnusltjxe`**.
- Pero `sistemas/07` dice que **comparten** `aglyoyqtzozdnusltjxe`.
- **Están en conflicto.** Antes de tocar datos de la App por API/MCP, confirmar CUÁL Supabase es la real de la App. No asumir.

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
Drag & drop **real** para módulos **y** lecciones con **`framer-motion`**
(`Reorder.Group` + `Reorder.Item` + `useDragControls`; ya estaba instalada,
v12.40). El arrastre arranca **solo desde el grip** (`dragListener={false}`) para
no romper el click de editar/expandir ni el scroll en móvil (`touch-none`). Al
soltar (`onDragEnd`) se persiste el nuevo orden en Supabase (solo las filas que
cambian). Numeración visual por índice, feedback inmediato, resync si algo falla.

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
- ⏳ Verificación en vivo (click-test) **pendiente**: bloqueada por el gotcha de
  máquina de arriba. Plan: probar en preview de Vercel con `test-agent`
  (reordenar y **restaurar** el orden, o usar módulos temporales, para no dejar
  datos reales alterados).

---

## Cambios versionados
- **2026-07-06:** Creado. Fix de reordenar (drag & drop real) en el editor de
  formación de la App + doc de setup local (Node 22, test-agent, gotcha de
  máquina) + flag de discrepancia de Supabase.
