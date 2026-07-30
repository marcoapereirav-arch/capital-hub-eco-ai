# SOP 60 · Clipper entra, Media Buyer Digital sale

**Estado:** código y migración listos 2026-07-30 · pendiente de aplicar a la base
**Repo:** App (`App Capital Hub`)
**Relacionado:** [56 · Estudio, panel del formador](56-estudio-panel-formador.md) ·
[59 · Archivo ordenado en Bunny](59-bunny-archivo-ordenado.md) ·
[16 · Contenido alumnos](16-contenido-alumnos.md)

---

## La decisión

> Marco, 2026-07-30: *"vamos a eliminar completamente la formación de Media Buyer
> y vamos a sustituirla por una de Clipper. Vamos a enseñar a editar a las
> personas."*
>
> Sobre lo que ya había dentro: *"nadie ha comprado todavía esto, bórralo y crea
> una nueva."*

## Las tres formaciones, a partir de hoy

| Ruta | `slug` | `product_key` |
|---|---|---|
| IA Integrator | `ia-integrator` | `ia_integrator` |
| Comercial Closing | `comercial-closing` | `comercial_closing` |
| **Clipper** | `clipper` | `clipper` |

**Siguen siendo tres y nadie puede crear más.** Ni desde el Estudio ni desde el
admin: los botones no existen y la base tampoco lo permite (ver SOP 56). Una
formación nueva es una decisión de negocio y se crea desde una migración.

Marco dijo "Comercial Digital" al hablar. El nombre real en la base y en el
Knowledge es **Comercial Closing**, y es el que se usa.

---

## Qué hace la migración

`supabase/migrations/20260730180000_clipper_sustituye_a_media_buyer.sql`

1. Añade `lessons.bunny_storage_path` (dónde quedó archivado el vídeo, ver SOP 59).
2. Crea la ruta **Clipper** con su formación y su comunidad.
3. Borra la ruta Media Buyer Digital. Sus formaciones, módulos, lecciones y
   comunidad caen solas por las claves foráneas.
4. Deja **sin formación asignada** al formador que la tenía (Juan Pablo). No se
   toca su cuenta ni su acceso. Marco decide luego quién enseña Clipper.

### El freno de seguridad

Borrar una ruta **no** borra las `student_invites`: un alumno con ese producto se
quedaría sin acceso y sin aviso.

Por eso la migración **cuenta las invitaciones aceptadas con `media_buyer_digital`
y se detiene sola** si encuentra alguna:

```sql
raise exception 'Hay % alumno(s) con Media Buyer Digital aceptado. No se borra nada...'
```

Marco confirmó que no hay ninguna. El freno está para que, si eso fuera falso, se
note en vez de perderse gente en silencio.

---

## Dónde estaba escrito a mano "Media Buyer"

Cinco sitios en la App, todos actualizados a Clipper:

| Archivo | Qué era |
|---|---|
| `web/src/api/training.ts` | `PRODUCT_TO_KEY` |
| `web/src/api/communityPosts.ts` | `PRODUCT_TO_COMMUNITY_KEY` |
| `web/src/pages/admin/AdminFormacionesPage.tsx` | `ROUTE_NAME_TO_SLUG` |
| `web/src/pages/admin/AdminFormacionDetailPage.tsx` | `ROUTE_NAME_TO_SLUG` |
| `web/src/utils/session.ts` | comentario con los valores posibles |

**Aprendizaje:** el nombre de las formaciones está repetido a mano en cinco
archivos además de la base. Cambiar una formación obliga a tocarlos todos. Si en
el futuro cambia otra, se busca `grep -ri "<nombre viejo>" web/src` antes de dar
nada por hecho.

---

## Después de aplicar la migración, comprobar

- [ ] `/admin/formaciones` enseña tres: IA Integrator, Comercial Closing, Clipper.
- [ ] La carpeta `Formaciones/Clipper` existe en Bunny (la crea el reloj del SOP 59).
- [ ] Juan Pablo entra y NO ve ninguna formación asignada, pero su cuenta funciona.
- [ ] Ningún alumno perdió acceso (la migración se habría detenido sola).

---

## Historial

**2026-07-30 · Nace Clipper.** Sustituye a Media Buyer Digital, que se borra
entera porque nadie la había comprado. Sale con la columna `bunny_storage_path`
del archivo ordenado.
