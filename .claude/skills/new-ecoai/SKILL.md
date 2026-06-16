---
name: new-ecoai
description: "Crear el entorno base de un Ecosistema de IA: sidebar desplegable, pantalla Knowledge con 4 cuadrantes (Marketing/Ventas/Producto/Finanzas), pantalla Configuraciones, tablas Supabase base (profiles + knowledges), BUSINESS_LOGIC.md inicial, ciberseguridad base. Activar cuando el usuario escribe /new-ecoai o dice: crear ecosistema, empezar ecosistema de IA, inicializar el entorno, arrancar proyecto nuevo."
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Crear con NVISION®

Este skill crea el entorno base de un proyecto NVISION®. El dueño puede elegir entre tres caminos según lo que necesite construir.

## ANTES DE EMPEZAR — pregunta una sola cosa al dueño

Muestra exactamente este mensaje y espera respuesta antes de tocar nada:

```
Hola. Vamos a ayudarte a montar tu proyecto usando la metodología NVISION®. Antes de empezar necesito que me digas una sola cosa:

¿Qué quieres construir?

  (A) Solo el ECOSISTEMA DE IA
      El panel de operación de tu negocio digital. Knowledge en 4
      cuadrantes (Marketing, Ventas, Producto, Finanzas),
      Configuraciones, y todo el chasis listo para que vayas
      enchufando plugins (CRM, métricas, automatizaciones, etc.)
      iterando con la IA.

  (B) Solo una APLICACIÓN / SaaS específico
      El producto digital que vas a vender o entregar a tus
      usuarios finales (un tracker de hábitos, un tracker de
      finanzas, una plataforma de cursos, lo que sea). Sin panel
      admin de Ecosistema.

  (C) AMBAS COSAS  ← lo más común
      Panel admin del Ecosistema de IA para tu uso interno
      (operar tu negocio) + zona de aplicación pública donde
      vas a construir tu SaaS para tus usuarios. Todo en el
      mismo proyecto, misma base de datos, mismo deploy.

Importante: independientemente de lo que elijas ahora, en
cualquier momento puedes pedirme que añada lo que no escogiste.
Si eliges solo Ecosistema y mañana quieres una app para tus
usuarios, dímelo y te creo el entorno. Y al revés. No te bloqueas
con esta decisión.

Responde A, B o C.
```

Espera la respuesta. Luego ejecuta el flujo correspondiente:

- **Respuesta A** → ejecuta secciones 1, 2, 3, 4, 5 (BUSINESS_LOGIC + Migration + Knowledges seed + CLAUDE.md + security headers) y secciones 6-12 (shell admin con sidebar, 4 cuadrantes, Configuraciones). NO crea `(app)/`.
- **Respuesta B** → ejecuta secciones 1, 4, 5, 6 adaptados para SaaS puro: `BUSINESS_LOGIC.md` sin la parte de Knowledge en 4 cuadrantes, sin tabla `knowledges`, sin shell admin de Ecosistema. Crea estructura `src/app/(app)/` vacía + `src/app/(auth)/` (heredada). El dueño construye el SaaS con la IA después. NO crea Knowledge ni Configuraciones del Ecosistema.
- **Respuesta C** → ejecuta TODO el flujo: secciones 1-12 + ADEMÁS crea `src/app/(app)/` vacía como zona de aplicación pública para usuarios finales del dueño. El `BUSINESS_LOGIC.md` documenta la arquitectura dual.

**Si el dueño responde algo distinto a A/B/C**, vuelve a mostrar el mensaje. No avances sin una respuesta válida.

---

## Pre-requisitos

1. Proyecto recién clonado con el comando `nvision` desde una carpeta vacía.
2. `npm install` ya ejecutado (o lo ejecutas tú si falta).
3. Acceso a Supabase MCP (debe estar configurado en `.mcp.json`).

---

## Concepto que estás construyendo (lectura interna)

Antes de tocar nada, lee el contenido de la sección **"MANUAL DEL ECOSISTEMA DE IA — TEXTO LITERAL"** al final de este SKILL.md. Ese texto es el manual completo del concepto. Lo usarás como contenido para el knowledge fijo en el cuadrante Producto. **No es opcional leerlo** — toda decisión técnica del entorno base sigue ese manual.

---

## FLUJO OPCIÓN A — Solo Ecosistema de IA

> Esta sección describe qué construir si la persona respondió **A** a la pregunta inicial.
> Para opción B, ver sección "FLUJO OPCIÓN B" más abajo.
> Para opción C (ambas), ejecutar este flujo A + el flujo B + ajustes que se indican en "FLUJO OPCIÓN C".

### Archivos a Crear

#### 1. `BUSINESS_LOGIC.md` (raíz del proyecto)

Ficha técnica del proyecto. Ligera. Se auto-actualiza con cada plugin enchufado.

```markdown
# BUSINESS_LOGIC.md — Ecosistema

> Ficha técnica del proyecto. Se actualiza automáticamente cuando se enchufa un plugin o se modifica una decisión técnica.
> El concepto completo del Ecosistema de IA vive como knowledge "Sobre el Ecosistema de IA" en el cuadrante Producto.

---

## 0. Qué es este proyecto

Ecosistema de IA construido con la plantilla NVISION®. El concepto completo está documentado en el knowledge **"Sobre el Ecosistema de IA"** dentro del cuadrante Producto.

---

## 1. Stack técnico

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 16 + React 19 + TypeScript |
| Estilos | Tailwind CSS 3.4 |
| Backend | Supabase (Auth + Database + RLS + Storage) |
| Validación | Zod |
| Estado | Zustand (cuando aplique) |
| Deploy | Vercel |
| AI (cuando se enchufe) | Vercel AI SDK v5 + OpenRouter |

Arquitectura: **Feature-First** (cada plugin tiene carpeta autocontenida en `src/features/`).

---

## 2. Estructura de rutas

- **Rutas protegidas** (requieren auth): dentro de route group `(app)/`. Sidebar + header visibles.
- **Rutas públicas** (sin auth): a nivel raíz, fuera de route groups protegidos.

**Regla anclada:** cuando el dueño solicite crear cualquier sección con cara pública (funnels, lead magnets, presentaciones, recursos, landings), la IA **pregunta** si esa sección estará abierta o requerirá auth/rol específico. La respuesta determina dónde se crea la carpeta.

---

## 3. Auth

- Supabase Auth (Email/Password + Google OAuth opcional).
- Tabla `profiles` con datos del dueño.
- 2FA opcional con TOTP.
- HaveIBeenPwned al signup (rechaza passwords filtrados).

---

## 4. Knowledge

- 4 cuadrantes: **Marketing**, **Ventas**, **Producto**, **Finanzas**.
- Tabla `knowledges` en Supabase.
- Archivos espejo en `.claude/knowledges/[cuadrante]/` (sincronizados desde BD).
- Soporta formato `md` (texto enriquecido) y `html` (vista renderizada, útil para Brandkits).
- **TODAS las IAs leen TODOS los knowledges:** Claude Code vía archivos espejo, IA in-app vía BD directa, futuras IAs vía BD.

---

## 5. Arquitectura de Datos

### Tablas base
- `profiles`: nombre, foto, correo del dueño.
- `knowledges`: cuadrante, título, formato (md/html), contenido.

### Tablas añadidas por plugins
*(Vacío al crear. Cada plugin añade aquí sus tablas.)*

---

## 6. Plugins instalados

*(Vacío al crear. Auto-actualizado por skills enchufables: `/add-login`, `/add-payments`, `/add-emails`, `/add-mobile`, `/ai`, plugins propios.)*

Formato de cada entrada:

### Nombre del plugin
- Activado: [fecha]
- Cuadrante principal: [Marketing/Ventas/Producto/Finanzas]
- Carpeta: `src/features/[plugin]`
- Tablas Supabase: [si aplica]
- Knowledges asociados: [listado]
- Integraciones externas: [si aplica]
- Variables de entorno: [si aplica]
- Qué hace: [una frase]

---

## 7. Decisiones técnicas registradas

*(Vacío al crear. Cada decisión técnica relevante se documenta aquí.)*

---

## 8. Ciberseguridad base

- Security headers (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) en `next.config.ts`.
- HaveIBeenPwned check al signup.
- RLS dura en TODAS las tablas (no negociable).
- Sanitización con Zod en formularios y APIs.
- 2FA opcional con TOTP para admin.
- `.gitignore` excluye `.env.local` y `.mcp.json`.

Capas adicionales (rate limiting, captcha, audit log, CSP granular) → disponibles vía skill `/add-security` (opcional).
```

---

### 2. Migration SQL

Archivo: `supabase/migrations/[timestamp]_init_ecosistema.sql`

Aplicar vía Supabase MCP con `apply_migration`:

```sql
-- ============================================================
-- INIT ECOSISTEMA DE IA
-- Tablas base: profiles + knowledges
-- ============================================================

-- PROFILES: datos del dueño del ecosistema
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Trigger: crear profile automáticamente al signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- KNOWLEDGES: SOPs del negocio en 4 cuadrantes
CREATE TYPE cuadrante_enum AS ENUM ('marketing', 'ventas', 'producto', 'finanzas');
CREATE TYPE knowledge_format AS ENUM ('md', 'html');

CREATE TABLE IF NOT EXISTS public.knowledges (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cuadrante cuadrante_enum NOT NULL,
  title text NOT NULL,
  format knowledge_format NOT NULL DEFAULT 'md',
  content text NOT NULL DEFAULT '',
  is_seed boolean DEFAULT false,
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_knowledges_owner ON public.knowledges(owner_id);
CREATE INDEX IF NOT EXISTS idx_knowledges_cuadrante ON public.knowledges(owner_id, cuadrante);

ALTER TABLE public.knowledges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own knowledges" ON public.knowledges
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users insert own knowledges" ON public.knowledges
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users update own knowledges" ON public.knowledges
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users delete own knowledges" ON public.knowledges
  FOR DELETE USING (auth.uid() = owner_id);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER knowledges_updated_at
  BEFORE UPDATE ON public.knowledges
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
```

---

### 3. Knowledges seed iniciales

Después de la migración, inserta los 3 knowledges seed. **Usa el `owner_id` del primer profile creado** (el dueño que está inicializando el ecosistema). Si no hay aún profile creado (porque `/add-login` no se ejecutó), guarda los seeds en archivos `.claude/knowledges/[cuadrante]/[slug].md` y los inserta a BD el primer skill que cree un profile.

**3.1 — Knowledge "Sobre el Ecosistema de IA" en cuadrante Producto** (formato `md`):

El contenido es el texto literal completo de la sección **"MANUAL DEL ECOSISTEMA DE IA — TEXTO LITERAL"** al final de este SKILL.md.

**3.2 — Knowledge "Manual del Proyecto" en cuadrante Producto** (formato `md`, placeholder):

```markdown
# Manual del Proyecto

> Documento que la persona dueña del ecosistema rellena con la visión, objetivos, avatar, oferta y estrategia de su negocio.
> Sirve como contexto operativo. Las IAs del ecosistema lo leen cuando responden cualquier consulta del cuadrante Producto.

## 1. Qué hace este negocio
(Rellenar)

## 2. Para quién es
(Rellenar)

## 3. Oferta y propuesta de valor
(Rellenar)

## 4. Objetivos
(Rellenar)
```

**3.3 — Knowledge "Brandkit" en cuadrante Marketing** (formato `html`, placeholder):

```html
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<title>Brandkit</title>
<style>
  body { font-family: system-ui, sans-serif; padding: 32px; background: #fafafa; color: #111; }
  h1 { font-size: 28px; margin-bottom: 24px; }
  .swatch { display: inline-block; width: 60px; height: 60px; border-radius: 8px; margin-right: 12px; vertical-align: middle; }
  .row { margin-bottom: 16px; }
  .label { display: inline-block; vertical-align: middle; font-weight: 600; }
</style>
</head>
<body>
  <h1>Brandkit</h1>
  <p>Identidad visual de la marca. El dueño define colores, tipografía, logos y estilo.</p>
  <h2>Colores</h2>
  <div class="row"><span class="swatch" style="background:#000000"></span><span class="label">Primario</span></div>
  <div class="row"><span class="swatch" style="background:#ffffff;border:1px solid #ccc"></span><span class="label">Secundario</span></div>
  <h2>Tipografía</h2>
  <p>Por definir</p>
  <h2>Logo</h2>
  <p>Por subir</p>
</body>
</html>
```

---

### 4. `CLAUDE.md` (raíz del proyecto) — reglas duras

Sobrescribe el CLAUDE.md heredado con este contenido:

```markdown
# CLAUDE.md — Reglas duras del Ecosistema de IA

> Este archivo se carga automáticamente al inicio de cada sesión de Claude Code.
> Las reglas aquí son **innegociables**.

---

## REGLAS NO NEGOCIABLES

### 1. Diseño como app nativa
Toda UI se construye para sentirse como una app instalada del teléfono: bottom tabs cuando aplique, headers grandes, bottom sheets para modales, transiciones suaves, touch targets ≥44px, respeto a `safe-area-inset`. En desktop, la calidad visual y UX debe ser de producto serio.

### 2. Mobile-first, desktop impecable
Cada cambio de UI se diseña primero pensando en móvil 375px. Después se adapta a desktop sin romper la sensación móvil.

### 3. RLS en TODAS las tablas
Sin excepción. Cada tabla con datos del dueño tiene Row Level Security activado.

### 4. No borrar sin permiso explícito
Prohibido ejecutar `rm`, `mv` sobrescritura, `git clean`, etc. sobre archivos del usuario sin autorización específica en la conversación actual.

### 5. No basura en la raíz
Artefactos temporales (screenshots, logs, dumps) van a `.test-artifacts/` (oculta, gitignored). Nunca en la raíz.

### 6. Single source of truth
`BUSINESS_LOGIC.md` siempre refleja el estado real del proyecto. Si algo se construye sin documentarse aquí, no existe oficialmente.

### 7. Auto-actualización del BUSINESS_LOGIC.md
Cuando se ejecuta cualquier skill que añade capacidad nueva (`/add-login`, `/add-payments`, `/add-emails`, `/add-mobile`, `/ai`, plugins propios), el skill debe escribir una entrada en la sección 6 ("Plugins instalados") de `BUSINESS_LOGIC.md` al final de su ejecución.

### 8. Rutas públicas vs protegidas
Cuando el dueño solicite crear cualquier sección con cara pública (funnel, lead magnet, presentación, recurso, landing), la IA **pregunta** si esa sección estará abierta o requerirá auth antes de elegir dónde crearla.

### 9. Knowledge leído por todas las IAs
Cualquier IA del ecosistema (Claude Code, IA in-app, futuras IAs) lee todos los knowledges relevantes antes de responder. Knowledge vive en Supabase (tabla `knowledges`) + archivos espejo en `.claude/knowledges/`.

### 10. Datos del dueño
Supabase del dueño. Vercel del dueño. Dominio del dueño. Nada vive en infraestructura de terceros que pueda cortarse.

### 11. Lenguaje natural primero
El dueño no escribe código. Describe qué quiere y la IA lo construye.

---

## FILOSOFÍA

El concepto completo del Ecosistema de IA vive como knowledge **"Sobre el Ecosistema de IA"** en el cuadrante Producto. Lectura obligatoria antes de cualquier decisión de arquitectura.

---

## STACK GOLDEN PATH

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS 3.4
- Supabase (Auth + Database + RLS + Storage)
- Zod, Zustand
- Vercel deploy
- MCPs: Supabase, Next.js DevTools, Playwright

No hay decisiones técnicas que tomar — el stack está fijo. Si surge necesidad de cambiar, se discute con el dueño.
```

---

### 5. `next.config.ts` — security headers

Sobrescribe `next.config.ts` con:

```typescript
import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
```

---

### 6. Layout principal con shell

Archivo: `src/app/(app)/layout.tsx`

```tsx
import { Sidebar } from '@/features/shell/components/Sidebar';
import { Header } from '@/features/shell/components/Header';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col bg-white text-black">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
```

---

### 7. Header component

Archivo: `src/features/shell/components/Header.tsx`

```tsx
export function Header() {
  const projectName = process.env.NEXT_PUBLIC_PROJECT_NAME || 'Ecosistema';

  return (
    <header className="border-b border-neutral-200 px-6 py-4">
      <h1 className="text-lg font-semibold">{projectName}</h1>
    </header>
  );
}
```

---

### 8. Sidebar desplegable

Archivo: `src/features/shell/components/Sidebar.tsx`

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/knowledge', label: 'Knowledge', position: 'top' as const },
  { href: '/configuraciones', label: 'Configuraciones', position: 'bottom' as const },
];

export function Sidebar() {
  const [open, setOpen] = useState(true);
  const pathname = usePathname();

  return (
    <aside
      className={`flex flex-col justify-between border-r border-neutral-200 bg-neutral-50 transition-all duration-200 ${open ? 'w-56' : 'w-12'}`}
    >
      <div>
        <button
          onClick={() => setOpen(!open)}
          className="m-2 rounded p-2 hover:bg-neutral-200"
          aria-label="Toggle sidebar"
        >
          ☰
        </button>
        <nav className="flex flex-col">
          {items.filter(i => i.position === 'top').map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-4 py-2 text-sm transition-colors hover:bg-neutral-200 ${pathname.startsWith(item.href) ? 'bg-neutral-200 font-medium' : ''}`}
            >
              {open ? item.label : item.label[0]}
            </Link>
          ))}
        </nav>
      </div>
      <nav className="mb-2 flex flex-col">
        {items.filter(i => i.position === 'bottom').map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`px-4 py-2 text-sm transition-colors hover:bg-neutral-200 ${pathname.startsWith(item.href) ? 'bg-neutral-200 font-medium' : ''}`}
          >
            {open ? item.label : item.label[0]}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
```

---

### 9. Página Knowledge (4 cuadrantes)

Archivo: `src/app/(app)/knowledge/page.tsx`

```tsx
import Link from 'next/link';

const cuadrantes = [
  { slug: 'marketing', label: 'Marketing', icon: '📁' },
  { slug: 'ventas', label: 'Ventas', icon: '📁' },
  { slug: 'producto', label: 'Producto', icon: '📁' },
  { slug: 'finanzas', label: 'Finanzas', icon: '📁' },
];

export default function KnowledgePage() {
  return (
    <div className="p-8">
      <h2 className="mb-8 text-2xl font-semibold">Knowledge</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {cuadrantes.map(c => (
          <Link
            key={c.slug}
            href={`/knowledge/${c.slug}`}
            className="flex flex-col items-center justify-center rounded-lg border border-neutral-200 bg-white p-8 transition-all hover:border-neutral-400 hover:shadow-sm"
          >
            <span className="mb-2 text-4xl">{c.icon}</span>
            <span className="text-lg font-medium">{c.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

---

### 10. Página de cuadrante (lista de knowledges)

Archivo: `src/app/(app)/knowledge/[cuadrante]/page.tsx`

```tsx
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const validCuadrantes = ['marketing', 'ventas', 'producto', 'finanzas'];

export default async function CuadrantePage({
  params,
}: {
  params: Promise<{ cuadrante: string }>;
}) {
  const { cuadrante } = await params;
  if (!validCuadrantes.includes(cuadrante)) notFound();

  const supabase = await createClient();
  const { data: knowledges } = await supabase
    .from('knowledges')
    .select('*')
    .eq('cuadrante', cuadrante)
    .order('position', { ascending: true });

  return (
    <div className="p-8">
      <Link href="/knowledge" className="mb-4 inline-block text-sm text-neutral-600 hover:underline">
        ← Knowledge
      </Link>
      <h2 className="mb-8 text-2xl font-semibold capitalize">{cuadrante}</h2>
      <div className="space-y-2">
        {knowledges?.map(k => (
          <Link
            key={k.id}
            href={`/knowledge/${cuadrante}/${k.id}`}
            className="block rounded-md border border-neutral-200 bg-white p-4 transition-colors hover:border-neutral-400"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{k.title}</span>
              <span className="text-xs uppercase tracking-wider text-neutral-400">{k.format}</span>
            </div>
          </Link>
        ))}
        {(!knowledges || knowledges.length === 0) && (
          <p className="text-sm text-neutral-500">
            Aún no hay knowledges en este cuadrante. Crea uno con + Nuevo knowledge.
          </p>
        )}
      </div>
    </div>
  );
}
```

---

### 11. Página Configuraciones

Archivo: `src/app/(app)/configuraciones/page.tsx`

```tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { updateProfile } from '@/actions/profile';

export default async function ConfiguracionesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <div className="p-8 max-w-xl">
      <h2 className="mb-8 text-2xl font-semibold">Configuraciones</h2>
      <form action={updateProfile} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nombre</label>
          <input
            name="full_name"
            defaultValue={profile?.full_name || ''}
            className="w-full rounded-md border border-neutral-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Correo</label>
          <input
            name="email"
            type="email"
            defaultValue={profile?.email || ''}
            disabled
            className="w-full rounded-md border border-neutral-300 bg-neutral-100 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Foto (URL)</label>
          <input
            name="avatar_url"
            defaultValue={profile?.avatar_url || ''}
            className="w-full rounded-md border border-neutral-300 px-3 py-2"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-black px-4 py-2 text-white hover:bg-neutral-800"
        >
          Guardar
        </button>
      </form>
    </div>
  );
}
```

---

### 12. Root page redirect

Archivo: `src/app/page.tsx`

```tsx
import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/knowledge');
}
```

---

### Flujo de Ejecución — Opción A

1. Verifica que el proyecto está recién clonado y `npm install` está hecho.
2. **Aplica la migración SQL** vía Supabase MCP (`apply_migration`) con el SQL de la sección 2.
3. **Inserta los 3 knowledges seed** (sección 3). El knowledge "Sobre el Ecosistema de IA" lleva el contenido literal del MANUAL más abajo.
4. **Sobrescribe `BUSINESS_LOGIC.md`** en raíz con el contenido de la sección 1.
5. **Sobrescribe `CLAUDE.md`** en raíz con el contenido de la sección 4.
6. **Sobrescribe `next.config.ts`** con la sección 5 (security headers).
7. **Crea los componentes** del entorno base (secciones 6-12).
8. **Verifica con Playwright MCP** que el shell se ve correctamente (sidebar desplegable, header, 4 cuadrantes).
9. Muestra el mensaje final al usuario.

---

### Mensaje Final — Opción A

```
Tu Ecosistema de IA está listo.

Lo que tienes ahora:
- BUSINESS_LOGIC.md inicial en raíz (ficha técnica del proyecto)
- CLAUDE.md con reglas duras
- Tablas Supabase: profiles + knowledges con RLS
- 3 knowledges seed: "Sobre el Ecosistema de IA" (Producto),
  "Manual del Proyecto" (Producto), "Brandkit" (Marketing)
- Shell completo:
  · Header con nombre del proyecto arriba-izquierda
  · Sidebar desplegable con Knowledge + Configuraciones
  · Pantalla Knowledge con 4 cuadrantes (Marketing, Ventas,
    Producto, Finanzas)
  · Pantalla Configuraciones con nombre/correo/foto
- Security headers configurados en next.config.ts

Tus siguientes pasos están dentro del roadmap NVISION®. Síguelo
ahí.

Recordatorio importante:
Hoy elegiste solo el Ecosistema de IA. Si en cualquier momento
quieres añadir una aplicación / SaaS específico para tus
usuarios finales (un tracker, una plataforma de cursos, lo que
sea), simplemente dímelo y te creo el entorno conectado a este
mismo proyecto. No te bloqueas con esta decisión.
```

---

## FLUJO OPCIÓN B — Solo aplicación / SaaS específico

> Esta sección describe qué construir si la persona respondió **B**.
> NO se construye Knowledge, ni los 4 cuadrantes, ni la tabla `knowledges`, ni los knowledges seed, ni el sidebar admin. Solo el chasis técnico de un SaaS público para usuarios finales.

### Pregunta extra (antes de construir nada)

Muestra exactamente este mensaje y espera respuesta:

```
Vale, vamos a construir el chasis de tu SaaS. Cuéntame en
2-3 frases:

  - ¿Cómo se llama tu producto?
  - ¿Qué hace, en una frase?
  - ¿Para quién es?

Ejemplo: "Mi producto se llama Habitia. Es un tracker de hábitos
con racha diaria y recordatorios. Es para personas que quieren
construir rutinas saludables y medir su progreso."

Con tu descripción, construyo el chasis base. Después tú me vas
pidiendo features iterando.
```

Guarda la respuesta como `<DESCRIPCIÓN_SAAS>`. La usarás como contenido del `BUSINESS_LOGIC.md` y como contexto para el placeholder de la app.

### Archivos a Crear — Opción B

#### B.1 `BUSINESS_LOGIC.md` (raíz)

```markdown
# BUSINESS_LOGIC.md — [Nombre del producto]

> Ficha técnica del proyecto. Se actualiza automáticamente cuando se enchufa un plugin o se modifica una decisión técnica.

---

## 0. Qué es este proyecto

[Pegar literal la <DESCRIPCIÓN_SAAS> del dueño]

Proyecto creado con la plantilla NVISION® en modo "Solo aplicación / SaaS específico". No incluye el panel admin del Ecosistema de IA.

---

## 1. Stack técnico

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 16 + React 19 + TypeScript |
| Estilos | Tailwind CSS 3.4 |
| Backend | Supabase (Auth + Database + RLS + Storage) |
| Validación | Zod |
| Estado | Zustand (cuando aplique) |
| Deploy | Vercel |

Arquitectura: **Feature-First** (cada feature del SaaS vive en `src/features/[feature]/`).

---

## 2. Estructura de rutas

- `src/app/(app)/*` — rutas del SaaS (requieren auth tras `/add-login`).
- `src/app/(auth)/*` — login, signup, password reset (cuando se ejecute `/add-login`).
- Rutas públicas en raíz (`/`, `/landing`, etc.) — accesibles sin auth.

---

## 3. Auth

- Pendiente de ejecutar `/add-login` para activar Supabase Auth.
- Tabla `profiles` ya creada con RLS.

---

## 4. Arquitectura de Datos

### Tablas base
- `profiles` — datos del dueño / usuarios del SaaS.

### Tablas añadidas por features
*(Vacío al crear. Cada feature añade aquí sus tablas.)*

---

## 5. Features instaladas

*(Vacío al crear. Auto-actualizado cuando se construyan features con la IA.)*

---

## 6. Plugins instalados

*(Vacío al crear. Auto-actualizado por skills enchufables: `/add-login`, `/add-payments`, `/add-emails`, `/add-mobile`, `/ai`.)*

Mismo formato que en la opción A.

---

## 7. Decisiones técnicas registradas

*(Vacío al crear.)*

---

## 8. Ciberseguridad base

Igual que opción A: security headers, HaveIBeenPwned, RLS, Zod, 2FA opcional.
```

#### B.2 Migration SQL (Supabase MCP `apply_migration`)

```sql
-- Tabla profiles (sin tabla knowledges en opción B)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Trigger (igual que opción A)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (new.id, new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
```

#### B.3 `CLAUDE.md` (raíz)

Igual que la opción A (mismas reglas duras: app nativa, mobile-first, RLS, no borrar sin permiso, single source of truth, etc.) **pero quita la mención del manual del Ecosistema** y añade una línea:

> "Este proyecto es un SaaS específico (modo B). La descripción del producto vive en `BUSINESS_LOGIC.md` sección 0."

#### B.4 `next.config.ts`

Idéntico al de la opción A (security headers).

#### B.5 Estructura `src/app/(app)/`

Crea:
- `src/app/(app)/layout.tsx` — layout simple con header (nombre del producto) + sidebar minimalista (configurable). Sin Knowledge ni cuadrantes.
- `src/app/(app)/page.tsx` — landing del producto autenticado con placeholder:

```tsx
export default function ProductHome() {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-semibold mb-4">[Nombre del producto]</h1>
      <p className="text-neutral-600 mb-8">
        [Descripción breve del producto]
      </p>
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-8 text-center">
        <p className="text-neutral-500">
          Tu producto se construye aquí. Dile a la IA qué feature quieres
          añadir y se construye iterando.
        </p>
      </div>
    </div>
  );
}
```

- `src/app/(app)/configuraciones/page.tsx` — pantalla de configuraciones del dueño (nombre, foto, correo).

#### B.6 `src/app/page.tsx` (raíz)

```tsx
import { redirect } from 'next/navigation';
export default function RootPage() {
  redirect('/app');
}
```

### Flujo de Ejecución — Opción B

1. Verifica proyecto recién clonado y `npm install` hecho.
2. Pregunta extra (descripción del SaaS).
3. Aplica migración SQL (solo `profiles`).
4. Sobrescribe `BUSINESS_LOGIC.md` con el contenido B.1 (rellenando `<DESCRIPCIÓN_SAAS>`).
5. Sobrescribe `CLAUDE.md` con la versión B.3.
6. Sobrescribe `next.config.ts` (security headers).
7. Crea componentes de B.5 y B.6.
8. Muestra mensaje final.

### Mensaje Final — Opción B

```
Tu chasis de SaaS está listo.

Lo que tienes ahora:
- BUSINESS_LOGIC.md con la descripción de tu producto
- CLAUDE.md con reglas duras (diseño app nativa, mobile-first, RLS,
  datos del dueño)
- Tabla Supabase profiles con RLS
- Estructura src/app/(app)/ con landing placeholder + configuraciones
- Security headers en next.config.ts

Tus siguientes pasos están dentro del roadmap NVISION®. Síguelo
ahí.

Recordatorio importante:
Hoy elegiste solo el SaaS específico (sin Ecosistema de IA). Si en
cualquier momento quieres añadir tu propio panel de operación
(tu Ecosistema de IA con Knowledge en 4 cuadrantes, automatizaciones
de marketing/ventas/producto/finanzas, plugins de CRM, métricas, etc.),
simplemente dímelo y te lo creo conectado a este mismo proyecto.
Tu Ecosistema sería tu centro de operaciones interno mientras
tus usuarios siguen accediendo a tu SaaS sin cambios.
```

---

## FLUJO OPCIÓN C — Ambas (Ecosistema + SaaS específico)

> Esta sección describe qué construir si la persona respondió **C**.
> Es la combinación: ejecutas el flujo A completo PARA el panel admin del dueño, y ADEMÁS construyes el chasis del SaaS público para usuarios finales (variante de B). Misma base de datos, mismo proyecto, mismo deploy.

### Pregunta extra (antes de construir nada)

Muestra exactamente este mensaje y espera respuesta:

```
Vale, vamos a construir tu Ecosistema admin + tu SaaS para
usuarios, todo en el mismo proyecto. Cuéntame en 2-3 frases
sobre el producto público:

  - ¿Cómo se llama tu producto (el SaaS para tus usuarios)?
  - ¿Qué hace, en una frase?
  - ¿Para quién es?

Ejemplo: "Mi producto se llama Habitia. Es un tracker de hábitos
con racha diaria. Es para personas que quieren construir rutinas."

Con tu descripción, construyo:
  - El Ecosistema de IA admin (Knowledge en 4 cuadrantes,
    Configuraciones, panel de operación de tu negocio).
  - El chasis del SaaS público (zona donde construirás tu producto
    para tus usuarios iterando con la IA).
```

Guarda la respuesta como `<DESCRIPCIÓN_SAAS>`.

### Archivos a Crear — Opción C

Ejecuta TODO lo de la opción A (secciones 1-12: BUSINESS_LOGIC + Migration con `profiles` + `knowledges` + 3 knowledges seed + CLAUDE.md + next.config.ts + shell admin con sidebar + 4 cuadrantes + Configuraciones).

**ADEMÁS** añade lo siguiente:

#### C.1 `BUSINESS_LOGIC.md` — modificaciones a la versión de A

Después de la sección 0 (Qué es este proyecto) en el BUSINESS_LOGIC.md de la opción A, **inserta esta sección nueva 0.5**:

```markdown
## 0.5 Producto público (SaaS para usuarios finales)

[Pegar literal la <DESCRIPCIÓN_SAAS> del dueño]

Este proyecto tiene arquitectura DUAL:

- **Zona admin** (`src/app/(admin)/*`) — solo el dueño accede.
  Contiene su Ecosistema de IA (Knowledge en 4 cuadrantes,
  Configuraciones, plugins de operación).
- **Zona pública / SaaS** (`src/app/(app)/*`) — usuarios finales
  acceden tras login. Es el producto del dueño descrito arriba.

Cuando se ejecute `/add-login` después, el `proxy.ts` aplicará
lógica de roles: rol `admin` accede a `(admin)/*`, rol `user`
solo a `(app)/*`.
```

#### C.2 Reorganizar la estructura del shell de A

El layout `src/app/(app)/layout.tsx` de la opción A pasa a ser **`src/app/(admin)/layout.tsx`**. Esto agrupa el panel del Ecosistema bajo el route group `(admin)`.

Toda la lógica de sidebar, header, 4 cuadrantes, Configuraciones se mueve a `(admin)/`:
- `src/app/(admin)/layout.tsx`
- `src/app/(admin)/knowledge/page.tsx`
- `src/app/(admin)/knowledge/[cuadrante]/page.tsx`
- `src/app/(admin)/configuraciones/page.tsx`

#### C.3 Estructura `src/app/(app)/` (zona pública del SaaS)

Crea (igual que en opción B pero con un placeholder específico que diga "tu producto"):
- `src/app/(app)/layout.tsx` — layout simple para usuarios finales (sin sidebar admin, header con nombre del producto).
- `src/app/(app)/page.tsx` — landing del producto autenticado con placeholder + descripción del SaaS pegada literal.

#### C.4 `src/app/page.tsx` (raíz)

```tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function RootPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return redirect('/login');

  // Por default todos van a /app. Cuando se ejecute /add-login,
  // proxy.ts redirigirá rol=admin a /admin/knowledge.
  return redirect('/app');
}
```

### Flujo de Ejecución — Opción C

1. Verifica proyecto recién clonado y `npm install`.
2. Pregunta extra (descripción del SaaS público).
3. Ejecuta TODO el flujo de la opción A (migración con `profiles` + `knowledges`, knowledges seed, CLAUDE.md, BUSINESS_LOGIC.md, next.config.ts, componentes del shell).
4. Aplica las modificaciones C.1 a C.4 (renombrar route group del shell a `(admin)/`, crear estructura `(app)/`, modificar `BUSINESS_LOGIC.md` con sección 0.5, root page con redirect).
5. Verifica con Playwright que ambas zonas se ven bien.
6. Muestra mensaje final.

### Mensaje Final — Opción C

```
Tu Ecosistema de IA + chasis de SaaS público están listos.

Lo que tienes ahora:

PANEL ADMIN (solo tú):
- /admin/knowledge — los 4 cuadrantes (Marketing, Ventas, Producto, Finanzas)
- /admin/configuraciones — tus datos
- Tabla knowledges con 3 seeds y RLS

SaaS PÚBLICO (tus usuarios finales):
- /app — landing del producto con descripción
- Placeholder listo para construir tu producto iterando

COMÚN:
- BUSINESS_LOGIC.md con arquitectura dual documentada
- CLAUDE.md con reglas duras
- Tabla profiles con RLS
- Security headers en next.config.ts

Tus siguientes pasos están dentro del roadmap NVISION®. Síguelo
ahí.
```

---

## MANUAL DEL ECOSISTEMA DE IA — TEXTO LITERAL

> Este texto se inserta como contenido del knowledge "Sobre el Ecosistema de IA" en el cuadrante Producto. Es el manual completo del concepto que toda IA del ecosistema lee como referencia.

```markdown
# Sobre el Ecosistema de IA

## 1. Qué es

Un **Ecosistema de IA** es un entorno de software modular preconstruido al que el dueño le enchufa capacidades (plugins) hasta convertirlo en la operación completa de su negocio digital.

El objetivo es centralizar todas las herramientas del negocio digital en un solo lugar. En lugar de tener varios SaaS distintos que no se hablan entre sí, el dueño opera su negocio desde un único entorno que él mismo construye con la ayuda de una IA, y que es 100% suyo (su código, su base de datos, su dominio, su infraestructura).

La promesa es autosuficiencia: el dueño deja de depender de agencias, freelancers o licencias mensuales acumuladas. Construye, modifica y expande su ecosistema con lenguaje natural, sin tocar código.

## 2. Para quién es

Personas que operan un negocio digital o prestan servicios online y necesitan controlar su propia infraestructura operativa:

- Infoproductores. Los que más necesitan esta herramienta. La usan para su propio negocio y, además, la aplican como servicio en negocios de terceros (clientes suyos).
- Freelancers que prestan servicios online y quieren operar sin depender de SaaS de terceros.
- Dueños de negocios digitales (cursos, membresías, agencias, e-commerce digital).
- Cualquier persona que opere online.

## 3. Qué NO es

- No es un chatbot. Puede haber IA dentro, pero la IA es una herramienta, no el producto.
- No es una plantilla de landing. Es la operación completa del negocio.
- No es un curso. Es software ejecutable que el dueño opera.
- No es una agencia digital. No hay equipo humano de terceros entregando trabajo.
- No es un dashboard de métricas. Las métricas son uno de los posibles plugins, no el núcleo.
- No es un producto vertical. No está casado con ninguna industria.

## 4. Anatomía del entorno base

Cuando el dueño ejecuta /new-ecoai, queda listo:

- Esquina superior izquierda: nombre del ecosistema (default "Ecosistema").
- Sidebar izquierdo desplegable con dos items fijos: Knowledge (arriba) y Configuraciones (abajo).
- Pantalla Knowledge: 4 cuadrantes en grilla (Marketing, Ventas, Producto, Finanzas) en formato de carpetas.
- Pantalla Configuraciones: nombre, foto, correo del dueño.

No existe menú de usuario, ni sistema de invitaciones, ni dashboard de métricas, ni plugins instalados. El entorno base es el chasis vacío sobre el que el dueño construye.

## 5. Los 4 cuadrantes

### Marketing
Branding, copy, contenidos, captación, posicionamiento, identidad visual. Seed inicial: Brandkit (HTML).

### Ventas
Oferta, pipeline, scripts, objeciones, métricas de conversión. Seed inicial: vacío.

### Producto
Arquitectura, plugins instalados, decisiones técnicas, stack. Seed inicial: Manual del Proyecto + este knowledge ("Sobre el Ecosistema de IA").

### Finanzas
Ingresos, costos, suscripciones, gastos, proyecciones. Seed inicial: vacío.

### Naturaleza de un Knowledge

No es solo una nota. Es una instrucción operativa que las IAs del ecosistema leen como contexto cuando se les pide algo. Funcionan como SOPs personales que entrenan progresivamente a las IAs. Cuantos más knowledges escriba el dueño, mejor responden las IAs.

### Quién lee los knowledges

Todos los canales de IA del ecosistema leen el mismo cuerpo:
- Claude Code lee vía archivos espejo sincronizados desde la BD.
- IA in-app lee directamente la tabla `knowledges` en cada consulta.
- Cualquier IA futura se conecta a la misma tabla.

Una fuente, múltiples canales.

## 6. Cómo se trabaja con el Ecosistema

**Setup (una sola vez):** seguir el roadmap publicado. Termina escribiendo `nvision` en la terminal de Antigravity dentro de una carpeta vacía. La plantilla se clona.

**Crear el entorno (una sola vez):** `/new-ecoai`. El agente genera todo automáticamente sin preguntar.

**Identidad visual:** el dueño define su Brandkit. La IA aplica esa identidad a todo el entorno.

**Iterar y enchufar plugins (continuo):** el dueño habla con la IA en lenguaje natural. Ejemplos: "quiero un CRM con pipeline", "necesito un panel con métricas de Instagram", "añade dictado por voz". La IA construye el plugin, lo enchufa al sidebar, crea las tablas necesarias y actualiza BUSINESS_LOGIC.md.

**Despliegue:** Vercel + dominio propio.

## 7. Qué es un Plugin

Cualquier capacidad enchufable: CRM, dashboard, calendario, herramienta de contenido, integración con redes, auditor, motor de ideas, lo que sea.

Anatomía:
- Entrada nueva en el sidebar.
- Carpeta src/features/[plugin]/ con la lógica.
- Tablas Supabase con RLS.
- Knowledges asociados en los cuadrantes.
- Entrada en sección 6 de BUSINESS_LOGIC.md.

No hay catálogo cerrado. Cada idea del dueño es un plugin potencial.

## 8. Principios duros

1. Autosuficiencia: el dueño construye sin depender de terceros.
2. Modularidad: cada capacidad nueva es un plugin enchufable.
3. Single source of truth: BUSINESS_LOGIC.md siempre refleja el estado real.
4. Lenguaje natural primero: el dueño no escribe código.
5. Crecimiento por idea: cada idea del dueño puede convertirse en plugin.
6. Knowledge entrenable: cada cuadrante mejora con uso.
7. Todas las IAs leen todo el Knowledge.
8. Datos del dueño: nada vive en infraestructura de terceros.
9. RLS en todas las tablas, sin excepción.
10. Diseño como app nativa, mobile-first.
11. Sin techo de funcionalidad: si el dueño puede describirlo, la IA puede construirlo.

## 9. Glosario

- **Ecosistema**: el proyecto entero (entorno base + plugins + knowledges + datos del dueño).
- **Entorno base**: lo que /new-ecoai deja listo antes de cualquier plugin.
- **Hub**: la pantalla principal de Knowledge con los 4 cuadrantes.
- **Cuadrante**: una de las 4 áreas (Marketing, Ventas, Producto, Finanzas).
- **Knowledge**: instrucción operativa dentro de un cuadrante. SOP que entrena a las IAs.
- **Plugin**: capacidad enchufable al ecosistema.
- **Dueño**: la persona que opera el ecosistema.
- **`nvision`**: comando shell que clona la plantilla en una carpeta vacía.
- **`/new-ecoai`**: comando que crea el entorno base sin preguntas.
```

---

## Notas

- Este skill **no** ejecuta `/add-login` automáticamente. La persona lo activa después con `/add-login` para tener auth Email/Password + Google OAuth.
- Si Supabase no tiene credenciales configuradas (`.env.local` vacío), se muestra al final mensaje pidiendo configurarlas antes de aplicar la migración.
- Los knowledges seed son `is_seed=true` para que la persona sepa que son del chasis base.

*El Ecosistema de IA es de quien lo opera.*
