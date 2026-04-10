# PRP-001: MVP Capital Hub OS

> **Estado**: PENDIENTE
> **Fecha**: 2026-04-10
> **Proyecto**: Capital Hub OS

---

## Objetivo

Construir el MVP funcional de Capital Hub OS: un sistema operativo interno con autenticacion, shell de navegacion modular (sidebar), y dashboard de metricas consolidadas — todo alineado al brandkit monocromatico de Capital Hub.

## Por Que

| Problema | Solucion |
|----------|----------|
| Operaciones dispersas en 10+ herramientas | Un solo punto de entrada para todo |
| Tiempo perdido navegando entre plataformas | Dashboard centralizado con metricas clave |
| Imposibilidad de escalar sin sistema propio | Arquitectura modular que crece con el negocio |

**Valor de negocio**: Capital Hub OS se convierte en el punto de entrada diario del equipo. Toda metrica operativa visible en un solo lugar. Arquitectura lista para enchufar modulos futuros sin rehacer nada.

## Que

### Criterios de Exito
- [ ] Admin puede hacer login con email/password
- [ ] Shell con sidebar funcional que permite navegar entre modulos
- [ ] Dashboard muestra metricas placeholder con estructura lista para APIs reales
- [ ] Diseno 100% alineado al brandkit (monocromatico, Inter Tight/Inter, sin gradientes)
- [ ] Arquitectura modular: agregar un modulo nuevo = crear carpeta + registrar en sidebar
- [ ] `npm run build` exitoso sin errores
- [ ] `npm run typecheck` pasa limpio

### Comportamiento Esperado (Happy Path)
1. Admin abre Capital Hub OS → ve pantalla de login
2. Ingresa email/password → Supabase autentica
3. Entra al shell → sidebar izquierdo con modulos disponibles
4. Click en "Dashboard" → ve metricas consolidadas (cards, graficas)
5. Puede cerrar sesion desde el sidebar

---

## Contexto

### Referencias de Diseno (Brandkit)
- **Fondo primario**: #0F0F12 (Negro Carbon) — 60%
- **Contenedores**: #2A2D34 (Gris Grafito) — 25%
- **Texto principal**: #F5F6F7 (Blanco Roto) — 10%
- **Acento/Estado**: #FFFFFF (Blanco Puro) — 5%
- **Texto secundario**: #6B7280, #9CA3AF
- **Headlines**: Inter Tight (500/600)
- **Body/UI**: Inter (400/500)
- **Mono/Codigo**: JetBrains Mono (400)
- **Motifs**: Bloques rectangulares, bordes finos (#2A2D34), sin gradientes, border-radius 2-4px max, iconografia lineal (Lucide), badges discretos, espaciado limpio

### Arquitectura Propuesta (Feature-First)
```
src/features/
├── auth/              # Login, Signup, proteccion de rutas
│   ├── components/    # LoginForm, SignupForm
│   ├── hooks/         # useAuth, useSession
│   ├── services/      # authService (Supabase calls)
│   └── types/         # AuthUser, LoginCredentials
│
├── shell/             # Layout principal, sidebar, navegacion
│   ├── components/    # Sidebar, ModuleSwitcher, UserMenu
│   ├── hooks/         # useNavigation, useActiveModule
│   ├── services/      # moduleRegistry
│   └── types/         # Module, NavItem
│
└── dashboard/         # MVP: Metricas consolidadas
    ├── components/    # MetricCard, MetricGrid, StatWidget
    ├── hooks/         # useMetrics
    ├── services/      # metricsService (placeholder → APIs reales despues)
    └── types/         # Metric, MetricSource
```

### Modelo de Datos
```sql
-- Tabla de perfiles (extiende auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT DEFAULT 'admin',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

---

## Blueprint (Assembly Line)

> Solo FASES. Las subtareas se generan al entrar a cada fase.

### Fase 1: Cimientos y Design System
**Objetivo**: Proyecto corriendo con dependencias instaladas, Tailwind configurado con brandkit, componentes base de shadcn/ui instalados y tematizados.
**Validacion**:
- `npm run dev` arranca sin errores
- Colores del brandkit aplicados en globals.css y tailwind.config.ts
- Componentes shadcn (Button, Input, Card, etc.) instalados y tematizados al brandkit

### Fase 2: Shell (Layout + Sidebar)
**Objetivo**: Layout principal con sidebar monocromatico, navegacion entre modulos, user menu con logout. El shell es el "frame" donde se renderizan todos los modulos.
**Validacion**:
- Sidebar visible con items de navegacion
- Click en modulo cambia el contenido principal
- Responsive: sidebar colapsable en mobile
- Estetica 100% brandkit

### Fase 3: Auth (Login + Signup + Proteccion)
**Objetivo**: Sistema de autenticacion completo con Supabase. Login/Signup funcional, rutas protegidas, middleware de sesion.
**Validacion**:
- Login con email/password funciona
- Signup crea usuario en Supabase
- Rutas /dashboard protegidas (redirect a /login si no autenticado)
- Sesion persiste en refresh
- Tabla profiles creada con RLS

### Fase 4: Dashboard MVP
**Objetivo**: Dashboard con metricas visuales (cards, stats, graficas placeholder). Estructura lista para conectar APIs reales despues. Datos mock por ahora.
**Validacion**:
- Grid de MetricCards con datos mock
- Al menos 4 widgets: followers totales, engagement, leads, ad spend
- Layout responsive
- Estructura de services lista para swappear mock → API real

### Fase 5: Validacion Final
**Objetivo**: Sistema funcionando end-to-end
**Validacion**:
- [ ] `npm run typecheck` pasa
- [ ] `npm run build` exitoso
- [ ] Flujo completo: login → dashboard → logout funciona
- [ ] Diseno alineado al brandkit en todas las pantallas
- [ ] Criterios de exito cumplidos

---

## Gotchas

- [ ] shadcn/ui usa CSS variables — mapear exacto a los colores del brandkit
- [ ] Supabase auth necesita .env.local con URL y ANON_KEY reales
- [ ] Next.js 16 Server Components: formularios de auth necesitan "use client"
- [ ] Charts/graficas necesitan dynamic import (no SSR compatible)
- [ ] Inter Tight no viene en shadcn default — importar desde Google Fonts

## Anti-Patrones

- NO crear nuevos patrones si los existentes funcionan
- NO ignorar errores de TypeScript
- NO hardcodear valores (usar constantes y CSS variables)
- NO omitir validacion Zod en inputs de usuario
- NO usar gradientes ni bordes redondeados grandes (brandkit dice NO)
- NO usar colores fuera de la paleta del brandkit

---

*PRP pendiente aprobacion. No se ha modificado codigo.*
