---
rama: feature/venta-acceso-alumno
estado: aprobado
---

> OK de Marco en el chat del 2026-08-18: *"Pues arreglalo todo y borra lo que
> tengas que borrar y que todo funcione, por favor. Por favor, empieza ahora
> mismo y vamos a empezar a trabajar."*

# Que el alumno entre y vea SU formacion

## Objetivo

Hoy no se puede vender Clipper y quien compre "Media Buyer Digital" paga, entra
y ve la pantalla vacia sin ningun aviso. Que vender cualquiera de los tres
productos termine con el alumno dentro, viendo lo suyo.

## Que voy a hacer

- El widget de registrar venta deja de tener la lista de productos escrita a mano: la lee del catalogo real.
- Las invitaciones dejan de aceptar cualquier texto como producto.
- Un candado que rompa el despliegue si alguien vuelve a escribir productos a mano.
- El acceso deja de depender del correo del alumno y pasa a depender de la persona.
- Boton para quitarle el acceso a alguien.
- Cerrar la puerta de registro publica de la App.
- Borrar la ficha fantasma y cerrar la lectura de las respuestas de examen.

## Fases

**A · Que se pueda vender Clipper (lo urgente)**
- [ ] El widget y las invitaciones leen los productos del catalogo real
- [ ] Se rechaza vender un producto que no exista en el catalogo
- [ ] Candado `check:productos` enganchado al despliegue

**B · Que el acceso no se rompa solo**
- [ ] El acceso se ata a la persona, no a su correo
- [ ] Boton de quitar acceso en la ficha del contacto

**C · Cerrar puertas**
- [ ] Cerrar el registro publico de la App
- [ ] Borrar la ficha fantasma
- [ ] Cerrar la lectura de las respuestas de examen

**D · Comprobar**
- [ ] Simular los tres productos y verificar que cada alumno ve lo suyo

## Que NO entra

- Juntar los dos repositorios en uno. Va aparte, despues de esto.
- Unificar los dos sistemas de cargos. Va aparte.
- Apagar la base de datos muerta. Va aparte.
- Tocar el contenido de las formaciones.

## Como lo veras

- En el widget de registrar venta aparece **Clipper** y desaparece Media Buyer.
- Vendes cualquiera de los tres y el alumno entra viendo esa formacion.
- En la ficha del contacto hay un boton para quitarle el acceso.
