---
title: Protocolo de arreglos → Knowledge siempre actualizado
order: 1
area: operacion
---

# Protocolo · cada arreglo se documenta en docs/sops/

## La regla
Cuando el agente arregla, cambia o crea algo en el sistema, ANTES de cerrar el bloque actualiza el SOP correspondiente. No hay commit aislado sin documentación.

## Triada del cambio
Cada bloque de trabajo está completo cuando hay 3 artefactos:

1. **Código** commiteado y pusheado
2. **SOP del proyecto** (`docs/sops/{area}/`) actualizado con la decisión funcional
3. **Memoria local** (`.claude/memory/`) si es feedback transversal del usuario que afecta a futuras sesiones

## Estructura de `docs/sops/`

| Carpeta | Para qué |
|---------|----------|
| `producto/` | Cómo funcionan las features end-to-end del OS y App |
| `ventas/` | Procesos comerciales, KPIs, scripts de venta |
| `marketing/` | Brand, copy, contenido, branding |
| `finanzas/` | Revenue, cash, reportes, costos |
| `operacion/` | Reglas del agente, protocolos internos, convenciones técnicas |

## Cuándo actualizar
- **Renombro algo** (ej: "Contactos" → "CRM") → actualizar SOP de esa feature
- **Cambio workflow** (ej: stages del pipeline) → actualizar SOP del CRM
- **Resuelvo bug recurrente** → añadir sección "Bugs evitados" al SOP afectado
- **Decido convención técnica** (ej: PageContainer) → SOP de operación
- **Creo sistema nuevo** → crear SOP nuevo numerado en su carpeta correspondiente
- **Borro algo** (ej: `/contenido` del OS) → marcar en el SOP que ya no existe + razón

## Anti-patrón
Hacer commit de código sin actualizar el SOP. Sin SOP el código es opaco para futuras sesiones; CLAUDE.md REGLA #0 obliga a leer `docs/sops/` antes de actuar, así que si la info no está ahí, el siguiente turno del agente actúa con info desactualizada.

## Relación con CLAUDE.md
CLAUDE.md REGLA #0 dice "Antes de actuar lee docs/sops/". Este SOP es el complemento: **el agente también ESCRIBE en docs/sops/, no solo lee**.

## Memoria local vs SOP
- **Memoria local** (`.claude/memory/`): preferencias del usuario, feedback de tono, reglas de NO hacer X
- **SOP** (`docs/sops/`): cómo funciona una feature, decisiones arquitectónicas, workflows operativos

Si dudas → SOP. La memoria es para feedback transversal que no encaja en un SOP.

## Verificación pre-commit
Antes de hacer `git commit`, verifico mentalmente:
1. ¿Toqué algún archivo de código? → ¿Hay un SOP en `docs/sops/` que describa lo que cambié?
2. Si no existe → lo creo
3. Si existe pero está desactualizado → lo actualizo

Si las dos respuestas son "sí", commito.
