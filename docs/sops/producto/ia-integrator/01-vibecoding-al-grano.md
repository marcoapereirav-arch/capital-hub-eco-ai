---
title: Vibe Coding — Al grano (visión en 1 página)
order: 1
formacion: IA Integrator
---

# Vibe Coding — Manual al grano

> Construir tu software hablando con una IA. Para empezar de cero y hacerlo bien.

## Qué es esto (si no tienes ni idea)
Vas a crear tu software **hablándole a una IA**, como quien escribe por chat. **Tú no programas**: le dices lo que quieres y ella escribe el código, lo prueba y lo deja funcionando. Tu trabajo es **decir qué quieres y aprobar**. No necesitas saber programar; necesitas saber **qué decir y en qué orden**. Te lo explico aquí.

## Por dónde empiezas (lo primero de todo)
1. Abres un **chat con la IA** dentro de tu proyecto. Es escribir, sin más.
2. Lo primerísimo que escribes: **`/primer`** (esto es una skill creada por nosotros). Con eso la IA lee tu proyecto entero y sabe dónde está cada cosa. *(Cada chat empieza en blanco: `primer` es lo que le da la memoria de tu proyecto.)*
3. Ya está lista. A partir de aquí le hablas normal.

## Ubícate: los 4 sitios donde vive tu trabajo
- **Localhost** → tu web dentro de **tu ordenador**, solo la ves tú. Es el ensayo. *Por qué aquí: puedes crear, romper y rehacer sin consecuencias, sin usuarios delante.*
- **Rama** → una copia aparte para algo grande, sin tocar lo que ya funciona. *Por qué: si sale mal, tu web oficial sigue intacta.*
- **main** → la versión **oficial**, en la nube. *Por qué una sola: es la fuente de la verdad y la copia de seguridad; solo entra lo que ya está bien, porque es lo que se publica.*
- **Producción** → tu web **pública** (live). Se publica sola al llegar a `main`. *Por qué automático: para que no se olvide ningún paso.*

**La lógica de fondo:** todo se construye y prueba primero en tu ordenador (localhost) → solo cuando está bien sube a lo oficial (`main`) → y eso se publica solo. Así **nunca tocas la web real hasta estar seguro**.

## El flujo de una sesión (lo que haces siempre, en orden)
1. **`/primer`** → la IA coge contexto. *(Sin esto trabaja a ciegas.)*
2. **Dices tu idea**: *"quiero que…"*.
3. **La IA propone un plan** y decide sola si va **directo o en una rama** → **tú apruebas**. *(Se acuerda antes de construir para no gastar trabajo en algo que no querías.)*
4. **La IA lo construye** en localhost.
5. **Lo ves** en tu navegador (`localhost:…`) y lo pruebas. *(Eres el último filtro)*
6. **Le pides cambios** hasta que esté bien.
7. **Dices "publícalo"** → llega a `main` → **live** para todos.

## ¿Directo o en una rama? (lo decide la IA por ti)
- **Pequeño y seguro** (un texto, un color, un bug simple) → **directo a `main`**.
- **Grande, nuevo o delicado** (una función nueva, un rediseño, algo de pagos) → **en una `rama`**, para probarlo aislado sin romper lo bueno.

*Por qué la diferencia: para un cambio minúsculo, aislarlo sobra; para uno grande, ir directo a lo oficial es arriesgado.* Tú no eliges esto ni se lo dices: con tu idea, la IA ya sabe dónde hacerlo.

## Guardar y publicar (no necesitas decir estas palabras)
- **commit** = guardar una versión de tu trabajo (en tu ordenador).
- **push** = subir esa versión a la nube.
- **merge** = unir una rama a `main` *(solo si hubo rama)*.

*Por qué van separados: una cosa es guardar una versión (commit) y otra subirla (push); y solo hay merge si trabajaste aparte en una rama.* Tú dices **"publícalo"** y la IA hace la secuencia correcta sola.

## Todo tu vocabulario (esto es lo único que dices)
`/primer` · *"quiero que…"* · *"cambia esto"* · **"publícalo"** · *"tíralo"* (descartar) · *"ciérralo"*.

## 3 reglas que no se saltan
1. **`primer` siempre, al empezar.** Sin contexto, la IA se inventa cosas.
2. **No des nada por bueno hasta verlo tú en local.** Tú eres el último control.
3. **No está terminado hasta que está live.** Tu ordenador no es tu web real.

---