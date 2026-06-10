---
title: ManyChat → CRM · automatización entrada de leads desde Instagram
order: 20
area: producto
---

# ManyChat → CRM (automatización entrada de leads)

## Qué es esto en una frase
Cuando alguien interactúa con el Instagram de Adrián, **ManyChat** detecta automáticamente al usuario y **dispara un webhook a nuestro OS** que crea/actualiza la oportunidad en el CRM. **Sin que nadie tenga que escribir nada a mano**.

## Por qué necesitamos esto
Hoy el setter (Nagai/quien sea) tendría que escribir manualmente CADA nombre de Instagram que llegue al perfil. Eso es:
- Lento
- Se pierden leads
- No se trackea bien

ManyChat ya recibe esos eventos automáticamente porque Adrián tiene su Instagram conectado a ManyChat. Solo falta que ManyChat **avise** al OS.

## Cómo funciona el flujo completo

```
1. Persona sigue a @adrian en Instagram
        ↓
2. ManyChat detecta "new follower" (ya configurado en su panel)
        ↓
3. ManyChat dispara un External Request HTTP POST hacia:
   https://ecoai.capitalhubapp.com/api/webhooks/manychat
        ↓
4. El OS recibe el webhook, verifica firma (header Authorization:
   Bearer <MANYCHAT_WEBHOOK_SECRET>)
        ↓
5. OS busca si ya existe oportunidad con ese ig_username
        ↓
6. Si NO existe → crea contacto con stage='nuevo_seguidor'
   Si YA existe  → actualiza last_interaction_at + datos nuevos
        ↓
7. La nueva oportunidad aparece en /crm/pipeline columna "Nuevo seguidor"
   sin que nadie haga nada
```

## Eventos que ManyChat puede disparar (no solo "new follower")

| Evento ManyChat | Acción OS |
|-----------------|-----------|
| `new_subscriber` (alguien empieza chat) | Crea contacto stage `nuevo_seguidor` |
| `clicked_link` (clicó link en DM) | Añade event en journey + nota |
| `provided_email` (rellenó email en flow) | Actualiza contact.email |
| `provided_phone` (rellenó tel) | Actualiza contact.phone |
| `tagged_<custom>` | Mueve stage según tag (ej: tag "interesado_ia" → products incluye IA Integrator) |
| `unsubscribed` | No mueve nada, deja journey event |

## Si la persona agenda llamada desde el DM
Cuando alguien dentro del DM clica el link y va a `/agenda`, ya estamos cubiertos:
- ManyChat NO crea otra oportunidad
- `/agenda` busca por email/teléfono y ENCUENTRA la oportunidad existente (creada antes por ManyChat)
- Actualiza esa oportunidad: stage → `agendado`, añade booking
- Una sola oportunidad por persona, no se duplica

## Lo que SÍ está construido hoy
- ✅ Endpoint `/api/webhooks/manychat` (verificación firma, parsing)
- ✅ Tabla `manychat_events` (log de eventos recibidos)
- ✅ Tabla `manychat_subscribers_cache` (sync de subscribers ManyChat)
- ✅ Tabla `manychat_custom_fields_cache`
- ✅ Tabla `manychat_tags_cache`
- ✅ Variables ENV: `MANYCHAT_API_KEY`, `MANYCHAT_WEBHOOK_SECRET`

## Lo que FALTA construir
- 🟡 **Mapeo evento ManyChat → acción CRM**: ahora el endpoint guarda los eventos pero NO los traduce a operaciones en `contacts`. Necesita la lógica de "si new_subscriber → crear contacto stage `nuevo_seguidor`".
- 🟡 **Setup en panel ManyChat**: hay que ir al Flow Builder de ManyChat y añadir el step "External Request" apuntando al webhook.
- 🟡 **UI en /crm para mostrar fuente** (badge "from: Instagram" / "from: ManyChat") en las cards.

## Si esto NO se construye
Si decidimos NO conectarlo:
- Hay que eliminar la sección `/outreach-ig` del OS (no sirve para nada porque no captura nada)
- El setter tendría que entrar a Instagram nativo, ver seguidores, y manualmente añadir cada uno en `/crm/contactos` (lentísimo)

## Si esto SÍ se construye
- ManyChat hace el trabajo de captación
- El OS muestra TODO en `/crm/pipeline` columna "Nuevo seguidor"
- El setter solo tiene que mirar esa columna, hablarles, y mover stages
- 0 trabajo manual de "añadir leads"

## Limitación importante
Meta NO permite a apps externas leer/responder DMs de Instagram cuentas business sin permisos especiales (proceso largo de review). ManyChat SÍ puede porque tiene partnership oficial con Meta. Por eso lo necesitamos como intermediario — no podemos conectarnos directo a Instagram.

## Decisión pendiente
El usuario tiene que decidir:
- (a) Sí, conectar ManyChat → CRM. Yo construyo la lógica del webhook. ManyChat ya está pagado y funcionando para Adrián.
- (b) No, eliminar `/outreach-ig` del OS y el equipo gestionará Instagram directamente desde la app nativa.
