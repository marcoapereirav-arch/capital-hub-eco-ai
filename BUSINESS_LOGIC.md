# BUSINESS_LOGIC.md - Capital Hub OS

> Generado por SaaS Factory | Fecha: 2026-04-10

## 1. Problema de Negocio
**Dolor:** La operativa completa de Capital Hub esta dispersa entre multiples herramientas desconectadas (redes sociales, GHL, Meta Ads, editores de landing pages, gestion de contenido, comunicacion). No existe un sistema operativo propio desde el cual se pueda gestionar, construir y escalar todo el negocio de forma centralizada. Cada nueva necesidad implica anadir otra herramienta externa.

**Costo actual:** Fragmentacion operativa constante. Tiempo perdido navegando entre plataformas. Imposibilidad de escalar procesos de forma ordenada. A medida que el equipo crece y se anaden campanas, productos y canales, la falta de un sistema central propio se convierte en un cuello de botella estructural para el crecimiento.

## 2. Solucion
**Propuesta de valor:** Un sistema operativo modular que centraliza todas las operaciones de Capital Hub — desde metricas hasta creacion de assets — y crece con cada nueva necesidad del negocio.

**Flujo principal (Happy Path):**
1. El admin entra al sistema y accede al modulo que necesite desde un sidebar/navegacion central
2. Modulo 1 (MVP): Dashboard de metricas consolidadas (redes sociales, GHL, ads)
3. Modulos futuros se van conectando al mismo ecosistema (pipeline de contenidos, constructor de landing pages, gestor de ads, CRM interno)
4. Toda accion operativa del negocio se ejecuta desde un solo lugar, sin depender de herramientas externas

## 3. Usuario Objetivo
**Rol:** Administradores del equipo core de Capital Hub
**Fase 1:** Marco Antonio y Adrian
**Fase futura:** Roles adicionales segun crezca el equipo, con permisos diferenciados
**Contexto:** Equipo pequeno que necesita operar rapido sin saltar entre 10 herramientas distintas

## 4. Arquitectura de Datos

**Input:**
- APIs de redes sociales: Instagram, YouTube, TikTok
- API de GoHighLevel (CRM, pipeline, leads)
- API de Meta Ads (campanas, metricas, spend)
- Archivos operativos: brandkit, plantillas, copys
- Cualquier input operativo futuro que requiera un nuevo modulo

**Output:**
- Dashboards de metricas consolidadas (redes, ads, CRM)
- Landing pages (modulo futuro)
- Reportes de rendimiento
- Creativos y assets (modulo futuro)
- Cualquier output que se vaya requiriendo modulo a modulo

**Storage (Supabase tables sugeridas):**
- `users`: Administradores del sistema (auth + roles)
- `modules`: Registro de modulos activos y su configuracion
- `api_connections`: Credenciales y estado de cada integracion externa
- `metrics_cache`: Cache de metricas consolidadas de todas las APIs
- `metrics_snapshots`: Historico de metricas para comparativas y tendencias

## 5. KPI de Exito
**Metrica principal:** Primer modulo (dashboard de metricas) funcional y conectado a APIs reales, siendo utilizado como punto de entrada diario al negocio.
**Metrica arquitectonica:** La estructura base permite anadir nuevos modulos sin rehacer lo existente.

## 6. Especificacion Tecnica (Para el Agente)

### Principio Arquitectonico: Modularidad
Cada modulo es una feature independiente con su propia carpeta, componentes, hooks, services y tipos. Se conecta al layout principal via sidebar pero no depende de otros modulos. Nuevos modulos se "enchufan" sin tocar los existentes.

### Features a Implementar (Feature-First)
```
src/features/
├── auth/              # Autenticacion Email/Password (Supabase)
├── shell/             # Layout principal: sidebar, navegacion, modulo switcher
├── integrations/      # Gestion de conexiones a APIs externas
└── dashboard/         # MVP: Metricas consolidadas (redes, GHL, Meta Ads)
```

### Modulos Futuros (Post-MVP)
```
src/features/
├── content-pipeline/  # Pipeline de creacion de contenido
├── landing-builder/   # Constructor de landing pages
├── ads-manager/       # Gestor de campanas publicitarias
├── crm/               # CRM interno
└── [nuevo-modulo]/    # Se anade sin tocar lo existente
```

### Stack Confirmado
- **Frontend:** Next.js 16 + React 19 + TypeScript + Tailwind 3.4 + shadcn/ui
- **Backend:** Supabase (Auth + Database + Storage)
- **Validacion:** Zod
- **State:** Zustand (estado global del shell y modulos)
- **MCPs:** Next.js DevTools + Playwright + Supabase

### Proximos Pasos
1. [ ] Recibir brandkit y configurar design system
2. [ ] Setup proyecto base + layout (shell)
3. [ ] Configurar Supabase (tablas base + auth)
4. [ ] Implementar Auth (Email/Password)
5. [ ] Feature: Integrations (conexion a APIs externas)
6. [ ] Feature: Dashboard de metricas (MVP)
7. [ ] Testing E2E
8. [ ] Deploy Vercel
