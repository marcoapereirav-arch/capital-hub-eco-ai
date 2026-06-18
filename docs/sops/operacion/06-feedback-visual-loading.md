---
title: Feedback visual — toda acción >1s muestra spinner/overlay
order: 6
area: operacion
---

# Regla fundamental — feedback visual en acciones lentas

> Decisión Marco 2026-06-18 tras incidente login Patric.

## El principio

**Cada vez que una acción tome más de ~1 segundo en completarse, debe mostrar un indicador visual de carga (spinner, overlay, skeleton) ANTES de cualquier otra cosa.** Si el usuario clica un botón y no ve nada, asume que la app está dañada.

Esta regla no es opcional ni para "los formularios importantes". Aplica a TODOS los componentes interactivos del OS y de la App.

## Por qué (incidente que originó la regla)

2026-06-18: Patric activó su cuenta, fue a login, escribió credenciales, dio Sign In. El botón no mostraba feedback. El redirect tardó varios segundos. Patric pensó que la app estaba rota. Resultado: experiencia pésima en el primer contacto con el OS.

## Qué cuenta como "acción lenta"

- Cualquier fetch/server action que toque BD o API externa
- Login, logout, registro, reset password
- Submit de cualquier formulario que persiste datos
- Subir archivos
- Generar / exportar / sincronizar
- Cualquier acción que dispare un redirect (incluso si la action es rápida — el redirect puede tardar)

## Patrón estándar a aplicar

### Botones submit
```tsx
<Button type="submit" disabled={loading}>
  {loading ? (
    <span className="inline-flex items-center gap-2">
      <Loader2 className="h-4 w-4 animate-spin" />
      Procesando…
    </span>
  ) : (
    'Acción'
  )}
</Button>
```

### Overlay para acciones críticas (login, pagos, sincros)
```tsx
{loading && (
  <div className="absolute inset-0 z-10 flex items-center justify-center backdrop-blur-[2px]"
       style={{ background: 'rgba(15,15,18,0.6)' }}>
    <div className="flex flex-col items-center gap-2">
      <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#F5F6F7' }} />
      <span className="text-xs font-mono uppercase tracking-wider" style={{ color: '#F5F6F7' }}>
        Texto descriptivo de qué pasa…
      </span>
    </div>
  </div>
)}
```

### Inputs durante loading
```tsx
<Input disabled={loading} />
```
Para que el usuario no pueda modificar campos a mitad de submit.

### Listas / tablas mientras cargan
Usar skeleton o un `<Loader2 className="animate-spin" />` centrado, NUNCA una pantalla en blanco.

## Brandkit aplicable (ver SOP brandkit)

- Color spinner: `#F5F6F7` (texto principal del brandkit)
- Overlay: `rgba(15,15,18,0.6)` (semi-transparente del fondo dark)
- Tipografía label: `font-mono uppercase tracking-wider`

## Antípatrones

- ❌ Botón submit que no cambia visualmente al clicarlo
- ❌ Mostrar "..." o spinner DESPUÉS del fetch (cuando ya terminó)
- ❌ Página en blanco durante carga inicial
- ❌ No deshabilitar inputs durante el submit (puede triggear doble submit)
- ❌ Mensajes de error sin reset del loading state

## Checklist al añadir un form nuevo

1. ¿Tiene `loading` state? ✅
2. ¿El botón submit muestra spinner cuando loading? ✅
3. ¿Los inputs están disabled cuando loading? ✅
4. ¿Si hay error, loading se resetea? ✅
5. ¿Si hay success con redirect, loading se mantiene hasta navegar? ✅

## Histórico

- **2026-06-18:** regla creada tras incidente login Patric. Aplicada inmediatamente a `LoginForm.tsx` con overlay + spinner en botón + inputs disabled. Pendiente revisión de forms restantes en barrido siguiente.
