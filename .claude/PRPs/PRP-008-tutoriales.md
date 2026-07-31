# PRP-008: Tutoriales (formación interna del equipo)

> **Estado**: PENDIENTE DE APROBACION
> **Fecha**: 2026-07-31
> **Proyecto**: Capital Hub OS
> **Rama**: `feature/tutoriales`

---

## Objetivo

Una sección nueva del OS, `/tutoriales`, donde Marco pone vídeos organizados en carpetas y todo el equipo interno los ve y los reproduce. Cada tutorial entra de dos maneras, a elección de Marco: **subiendo el archivo** (va a Bunny) o **pegando un link de Loom**. En los dos casos queda reproduciéndose dentro de la ficha, sin salir del OS. Arranca con los dos vídeos que ya tiene grabados (cómo subir una formación y cómo pasar de texto a visual) y crece sin que nadie vuelva a tocar código.

## Por Qué

| Problema | Solución |
|---|---|
| Cada vez que Marco añade algo al sistema, tiene que explicárselo a cada persona por separado, en vivo y otra vez desde cero. | Lo graba una vez y queda ahí para siempre, ordenado y a mano. |
| El formador no sabe usar el panel donde crea sus formaciones, y hoy no hay dónde consultarlo. | Los dos primeros vídeos cubren justo eso. |
| El conocimiento de cómo se opera Capital Hub vive en la cabeza de Marco. | Queda grabado y accesible al equipo entero, no solo al formador. |

**Valor de negocio:** cada persona nueva que entra al equipo se forma sola. El tiempo de Marco deja de ser el cuello de botella para incorporar gente.

## Qué

### Criterios de Éxito

- [ ] Marco crea una carpeta, sube un vídeo y aparece publicado, sin tocar código ni pedir nada a nadie.
- [ ] Marco pega un link de Loom y el vídeo queda reproduciéndose dentro de la ficha, sin salir del OS y sin pasos extra.
- [ ] Todo lo que Marco sube como archivo aparece en Bunny dentro de "Tutoriales OS", nunca suelto.
- [ ] Un miembro del equipo (marketing, closer, setter, formador) ve `/tutoriales` en su menú, entra y reproduce.
- [ ] Ese mismo miembro no ve ni un botón de crear, subir, editar o borrar.
- [ ] Un tutorial en borrador solo lo ve Marco y Adrián. El resto del equipo no sabe que existe.
- [ ] Un alumno de la App no puede leer nada de esta sección, ni siquiera pidiéndolo a mano desde el navegador.
- [ ] Los dos vídeos de Marco quedan cargados, publicados y reproduciéndose.
- [ ] La puerta de subida de vídeo deja de aceptar llamadas anónimas y las subidas de lecciones de la App siguen funcionando.

### Comportamiento Esperado

**Marco entra a `/tutoriales`:** ve sus carpetas. Crea una nueva con un nombre. Dentro añade un tutorial, y ahí elige una de dos:

- **Subir el archivo.** Lo arrastra. El vídeo se va a Bunny, dentro de "Tutoriales OS". Mientras Bunny lo procesa, la ficha lo dice, y en cuanto está listo se puede publicar.
- **Pegar un link de Loom.** Pega la dirección y ya está: la ficha lo reconoce sola, saca el título y la miniatura si Loom los da, y queda listo para publicar al instante, sin esperas.

Le pone título y una línea de descripción, publica, y ya lo ve el equipo. Puede reordenar carpetas y vídeos arrastrando, y borrar.

**Un closer entra a `/tutoriales`:** ve las carpetas publicadas, entra en una, ve las fichas con su miniatura y su duración, hace clic y se reproduce. Nada más.

**Un alumno:** la sección no existe para él. Y si intentara pedir los datos a mano, la base le devuelve cero filas.

---

## Contexto

### Lo que se verificó antes de escribir esto (2026-07-31)

1. **Va en el OS, no en la App.** El Knowledge (SOP `producto/41`) dice que el formador tiene cuenta en el OS con acceso a panel, operaciones y CRM, y que desde ahí salta a la App con "Ir a App". Confirmado en base de datos: `nagaigobantesq@gmail.com` tiene `profiles.role = 'formador'`. Añadir una sección al OS y decidir quién la ve es el procedimiento documentado en ese mismo SOP. Una versión anterior de este plan concluía que iba en la App: es incorrecto y queda descartado.

2. **Los vídeos todavía no están en Bunny.** La biblioteca (`686883`) tiene 3 vídeos y ninguno es de los tutoriales. Marco los tiene en su máquina. Por eso la sección nace con su propio botón de subir.

3. **El OS ya sabe reproducir Bunny.** `src/features/public-pages/kit/funnel-kit.tsx` monta el reproductor con el iframe de `iframe.mediadelivery.net` y tapa el buffering con `LoadingScreen`. Se reutiliza ese patrón, no se instala ninguna librería de vídeo.

4. **Agujero de seguridad confirmado leyendo el código.** `src/app/api/admin/lessons/bunny-create-video/route.ts` no comprueba absolutamente nada: sin sesión, sin rol, sin secreto compartido, y su CORS devuelve como permitido el origen que le llegue. Cualquiera que conozca la dirección obtiene una firma de subida a Bunny válida 24 horas. El SOP 59 daba por cerrados estos accesos y este se quedó fuera.

5. **El otro chat abierto trabaja en la landing del webinar** (`src/features/funnel-webinar/`, `funnel-kit.tsx`, `CookieConsent.tsx`). Único punto de roce posible: `funnel-kit.tsx`, del que aquí solo se copia el patrón, no se modifica.

### Referencias

- `src/lib/auth/role-access.ts` y tabla `role_permissions` (la BD manda en runtime, el archivo es el respaldo).
- `src/features/shell/components/nav-config.ts` para la entrada del menú.
- `src/app/api/admin/bunny/*` para el patrón de llamadas a Bunny ya existente.
- SOP `producto/41` (roles), `producto/59` (archivo ordenado en Bunny), `producto/47` (contraste), `producto/49` (efecto de carga).

### Arquitectura Propuesta

```
src/features/tutoriales/
├── components/    tarjeta, rejilla de carpetas, reproductor, panel de subida
├── services/      lecturas y escrituras contra Supabase y Bunny
└── types/
src/app/(main)/tutoriales/page.tsx
src/app/(main)/tutoriales/[carpeta]/page.tsx
```

### Modelo de Datos

```sql
create table public.tutorial_folders (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,
  descripcion   text,
  display_order int  not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table public.tutorials (
  id             uuid primary key default gen_random_uuid(),
  folder_id      uuid not null references public.tutorial_folders(id) on delete cascade,
  titulo         text not null,
  descripcion    text,
  -- de donde sale el video: archivo subido a Bunny, o link de Loom
  fuente         text not null default 'bunny' check (fuente in ('bunny','loom')),
  bunny_video_id text,
  loom_url       text,
  duracion_seg   int,
  -- cada fuente exige su propio dato, y solo el suyo
  constraint tutorials_fuente_coherente check (
    (fuente = 'bunny' and loom_url is null)
    or (fuente = 'loom' and loom_url is not null and bunny_video_id is null)
  ),
  status         text not null default 'draft' check (status in ('draft','published')),
  display_order  int  not null default 0,
  created_by     uuid references auth.users(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
```

**El candado.** El equipo interno es exactamente "quien tiene fila activa en `profiles`". Los alumnos viven en `users`, no en `profiles`, así que la misma condición los deja fuera sin tener que enumerarlos:

```sql
-- leer: equipo interno ve lo publicado; admins ven tambien los borradores
create policy tutoriales_lectura on public.tutorials for select
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.active)
    and (status = 'published'
         or exists (select 1 from public.profiles p
                    where p.id = auth.uid() and p.role in ('super_admin','admin')))
  );

-- escribir: solo super_admin y admin
create policy tutoriales_escritura on public.tutorials for all
  using (exists (select 1 from public.profiles p
                 where p.id = auth.uid() and p.active and p.role in ('super_admin','admin')));
```

Y el acceso a la ruta, para los cinco roles internos:

```sql
insert into public.role_permissions (role, route_href) values
  ('marketing','/tutoriales'), ('formador','/tutoriales'),
  ('closer','/tutoriales'),    ('setter','/tutoriales');
```

---

## Blueprint

### Fase 1: Base de datos y candados
**Objetivo:** las dos tablas creadas con su RLS, las filas de `role_permissions`, y `/tutoriales` añadido a `ROLE_ROUTES` para los cuatro roles no admin.
**Validación:** consultando como un rol no admin salen 0 filas de borradores; consultando sin sesión salen 0 filas de todo.

### Fase 2: Cerrar la puerta de subida de vídeo
**Objetivo:** `bunny-create-video` exige identidad, y la App sigue subiendo lecciones sin romperse.
**Validación:** llamada sin credenciales devuelve 401; subida de una lección desde la App sigue funcionando de principio a fin.
**Cuidado:** este es el paso con riesgo real. La App llama a este endpoint desde otro dominio. Si se cierra sin darle la llave, se rompen las subidas de lecciones de los formadores. Se cierra y se prueba la App en el mismo paso, nunca por separado.

### Fase 3: La pantalla de ver, con los dos reproductores
**Objetivo:** `/tutoriales` con las carpetas, y dentro las fichas con miniatura, duración y reproductor. Una ficha de Bunny y una de Loom se ven igual de bien: el visitante no tiene por qué notar de dónde sale cada vídeo.
**Validación:** en pantalla de teléfono (390 de ancho) se lee y se reproduce, con los dos orígenes.
**A confirmar aquí:** la forma exacta del enlace de Loom que se puede incrustar se comprueba contra un link real de Marco, no de memoria. Si Loom no permitiera incrustar alguno de sus links, se dice y se resuelve, no se disimula.

### Fase 4: El panel de administración
**Objetivo:** crear carpeta, añadir tutorial (subiendo archivo o pegando link de Loom), editar título y descripción, publicar, reordenar arrastrando y borrar. Todo desde la misma pantalla.
**Validación:** Marco crea una carpeta, sube un archivo y pega un Loom, los dos sin ayuda; un rol no admin entra y no ve ninguno de esos botones.

### Fase 5: Cargar los dos vídeos reales
**Objetivo:** carpeta "Montar tu formación" con los dos vídeos de Marco publicados.
**Validación:** los dos reproducen desde la cuenta del formador.

### Fase 6: Validación final
**Objetivo:** funcionando de punta a punta en producción.
**Validación:**
- [ ] `npm run build` pasa (el comando de verdad, no `tsc --noEmit`, REGLA #16)
- [ ] Comprobado con el rol más restringido, nunca como admin
- [ ] Un alumno pidiendo los datos a mano recibe cero
- [ ] SOP nuevo escrito y en el índice del Knowledge

---

## Gotchas

- [ ] **La página empieza sí o sí con `ShellHeader` y `PageContainer`.** Sin eso pierde el botón del menú lateral y los márgenes del OS. Error recurrente.
- [ ] **Cerrar una RLS es un fallo mudo.** No lanza error: devuelve cero filas con `error = null`. Si al cerrar el candado algún sitio que leía filas ajenas empieza a ver vacío, parecerá "no hay datos". Barrer en el mismo paso.
- [ ] **Verificar siempre como el rol más restringido.** Siendo admin todo funciona y el fallo es invisible.
- [ ] **Brandkit obligatorio:** carbón `#0F0F12`, verde `#22C55E`, Inter Tight, esquinas de 4 y 8. Reproductores en verde. Prohibido inventar otros colores.
- [ ] **Efecto de carga de marca** (`LoadingScreen`) en cualquier espera. Nunca pantalla en blanco ni spinner genérico.
- [ ] **Visual, no lista de texto** (REGLA #15): fichas con miniatura y duración a la vista, no una lista de enlaces.
- [ ] **Prohibido el icono estrellita**, el guion largo y los emojis.
- [ ] Bunny tarda en procesar. Un vídeo recién subido no reproduce todavía: la ficha tiene que decirlo, no quedarse rota.
- [ ] **Todo lo que se sube como archivo va a "Tutoriales OS" en Bunny**, tanto en la biblioteca de vídeo como en el archivo ordenado de carpetas, siguiendo el patrón del SOP 59. La carpeta se crea sola la primera vez; nunca se deja un vídeo suelto en la raíz.
- [ ] Un Loom no ocupa nada en Bunny y no se descarga: se guarda el link y se incrusta. Contrapartida honesta: si Marco borra ese Loom o lo pone en privado, la ficha se queda sin vídeo. Por eso el archivo subido es la opción segura para lo que deba durar.
- [ ] Loom es un servicio externo: nada de dar por hecho cómo se comporta su incrustado sin probarlo con un link real (REGLA #5).

## Fuera de alcance (a propósito)

Marcar como visto, buscador, comentarios, y que alguien que no sea Marco o Adrián suba tutoriales. Con dos vídeos serían botones que no sirven. Se añaden cuando la sección tenga volumen para pedirlos.

---

*PRP pendiente de aprobación. No se ha modificado código.*
