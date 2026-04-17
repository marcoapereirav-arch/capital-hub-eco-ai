# Manual GHL Web Execution

## Protocolo para crear y modificar landings, checkouts y thank you pages compatibles con GoHighLevel

---

## Objetivo

Este manual define como debe trabajar el agente para crear y modificar landing pages dinamicas que funcionen sin errores dentro de GoHighLevel (GHL).

La finalidad es garantizar:

- **Compatibilidad total** con GHL
- **Codigo escrito directamente** en el archivo HTML correspondiente
- **Cero cambios no solicitados**
- **Cero decisiones creativas no pedidas**
- **Flujo de trabajo estable, repetible y controlado**
- **Resultados listos para copiar y pegar en GHL sin romperse**

---

## 1. Formato tecnico obligatorio

Toda landing o pagina de funnel generada debe cumplir SIEMPRE:

- **HTML + CSS + JavaScript plano** dentro de un solo archivo `.html`
- Todo debe estar en un **unico archivo**
- El archivo final debe poder copiarse y pegarse en GHL sin romperse

### Prohibido:

- React
- JSX
- TypeScript
- imports / exports
- Frameworks de cualquier tipo
- Crear archivos adicionales (style.css, script.js, etc.)
- Librerias externas (salvo Google Fonts o Font Awesome si el brandkit lo requiere)

### Animaciones y efectos permitidos si:

- Son compatibles con navegador
- No rompen GHL
- Pueden existir dentro del unico archivo HTML

---

## 2. Regla critica: El HTML debe funcionar identico en GHL

**Prioridad absoluta:**

> Si algo se ve diferente entre el archivo HTML local y GHL, esta MAL.

Por tanto:

- GHL es el entorno final. Todo se disena para GHL.
- No se permiten efectos que dependan de frameworks o entornos especificos.
- No se permiten resultados que dependan de JavaScript avanzado no soportado por GHL.
- Siempre usar CSS inline o dentro de `<style>` en el mismo archivo.
- Siempre usar JS dentro de `<script>` en el mismo archivo.

---

## 3. Filosofia de modificacion

Cuando el usuario pide cambios:

- **Solo se modifica lo que el usuario pide, nada mas.**
- No se reordenan elementos.
- No se eliminan cosas a menos que el usuario lo pida.
- No se optimiza por iniciativa propia.
- No se agregan efectos adicionales.
- No se inventan textos nuevos.
- No se toman decisiones creativas sin autorizacion.

---

## 4. Protocolo de respuesta

Existen dos escenarios:

### A) CREACION — Primera vez que se construye la pagina

1. **Confirmacion breve del objetivo**

Formato obligatorio:

> "He entendido. Creare [tipo de pagina] en un unico archivo HTML con el siguiente objetivo:
> - [Descripcion exacta del objetivo entregado por el usuario]
>
> El archivo sera 100% compatible con GoHighLevel y respetara el brandkit de Capital Hub."

2. **Ejecutar** — Escribir el archivo HTML completo en la ruta correspondiente dentro de `src/funnels/[nombre-del-funnel]/`

3. **Resumen corto** — Maximo 2-3 lineas explicando que se creo.

### B) MODIFICACION — Cambios sobre una pagina existente

1. **Confirmacion breve + enumeracion explicita de TODOS los cambios**

Formato obligatorio:

> "He entendido. Aplicare UNICAMENTE los siguientes cambios:
> 1. [Cambio 1]
> 2. [Cambio 2]
> 3. [Cambio 3]
>
> Mantendre todo lo demas exactamente igual."

**No se acepta** confirmacion generica como:
- "Entiendo los cambios."
- "Aplicare las modificaciones."

**Debe enumerar TODO, sin omisiones.**

2. **Ejecutar** — Aplicar los cambios quirurgicamente usando Edit (no reescribir todo el archivo).

3. **Resumen corto** — 2-3 lineas explicando que cambios se aplicaron.

---

## 5. Dinamismo y experiencia visual

Permitido siempre que:

- El codigo viva solo dentro del archivo HTML
- Sea compatible con GHL
- No anada librerias externas no autorizadas

### Permitido:

- Animaciones CSS
- Sticky elements
- Scroll dinamico
- Efectos de entrada (fade, slide, etc.)
- Microinteracciones
- Gradientes y sombras
- Transiciones hover

---

## 6. Reglas de ejecucion

Al crear o modificar paginas:

- Ser **especifico** — cada cambio debe ser preciso
- En modificaciones, **listar todos los cambios** antes de ejecutar
- Respetar **mobile-first** y luego desktop
- Mantener **animaciones y dinamicas existentes** que no se pidio cambiar
- **Nunca** eliminar, mover ni modificar secciones que no se pidieron cambiar
- **Nunca** anadir efectos, textos o estructuras nuevas no solicitadas

---

## 7. Brandkit obligatorio

**Todo diseno debe respetar el Brandkit de Capital Hub** (`docs/Brandkit_Capital_Hub.html`).

- Colores del brandkit
- Tipografia del brandkit
- Espaciado y estilo visual del brandkit
- Componentes y patrones del brandkit

Nada se disena sin consultar el brandkit primero.

---

## 8. Estructura de archivos

```
src/funnels/
└── [nombre-del-funnel]/
    ├── landing.html
    ├── checkout.html
    └── thank-you.html
```

Cada funnel tiene su carpeta. Cada pagina es un archivo HTML independiente.

---

## 9. Resultado esperado al seguir este manual

- Codigo siempre como archivo HTML dentro del proyecto
- Paginas estables sin errores
- Modificaciones limpias y quirurgicas
- Uso repetible sin inconsistencias
- Compatibilidad completa con GHL
- Brandkit respetado al 100%

---

## 10. Que NO cubre este documento

Este documento NO trata de:

- Copywriting (textos de venta)
- Estrategia UX
- Estrategia de marketing
- Psicologia de conversion

Solo establece la **metodologia operativa** para crear y modificar paginas HTML compatibles con GHL.
