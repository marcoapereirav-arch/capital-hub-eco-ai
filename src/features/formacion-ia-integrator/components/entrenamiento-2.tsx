"use client"

import {
  BookOpen, MessageSquare, Target, ClipboardCheck, Blocks, Eye, Rocket, CheckCircle2,
  Pause, FileCode, Database, Layers, Wrench, Repeat, Bot, Smartphone,
} from "lucide-react"
import {
  FormacionPage, Hero, SectionHead, Section, Lead, Text, Muted, Cards, Steps, Timeline,
  Rules, Quote, Warn, Code, Mono, Terms, Toc, Closing, Flow,
} from "./formacion-kit"

/**
 * Entrenamiento 2 · Cómo usar el sistema.
 * Fuente: docs/sops/producto/ia-integrator/02-entrenamiento-2-como-usar-el-sistema.md
 */

const INDICE = [
  { id: "e2s1", label: "Abrir sesión" },
  { id: "e2s2", label: "Tu objetivo" },
  { id: "e2s3", label: "El plan" },
  { id: "e2s4", label: "Construcción" },
  { id: "e2s5", label: "Revisarlo" },
  { id: "e2s6", label: "Publicar" },
  { id: "e2s7", label: "Cerrar" },
  { id: "e2s8", label: "Algo urgente" },
  { id: "e2s9", label: "La información" },
  { id: "e2s10", label: "Las skills" },
]

export function Entrenamiento2() {
  return (
    <FormacionPage label="Entrenamiento 2 · Cómo usar el sistema">
      <Toc items={INDICE} />

      <Hero
        eyebrow="Entrenamiento 2"
        eyebrowIcon={BookOpen}
        lines={["Cómo usar", "el sistema."]}
        lead="Lo que haces tú cada día, desde que se te ocurre algo hasta que está funcionando en tu web."
        sub={
          <>
            Antes de esto, el Entrenamiento 1. Aquí se dan por sabidos: IDE, terminal, MCP, skill, PRP, bucle agéntico,
            localhost, rama, main, commit, merge y push.
          </>
        }
      />

      <SectionHead label="El ciclo completo, de un vistazo" />
      <Section>
        <Timeline
          items={[
            { t: "Abres el chat y escribes /primer", d: "Primero esto. Sin contexto de tu proyecto, lo que construya no va a encajar." },
            { t: "Dices tu objetivo", d: "Qué quieres lograr, con tus palabras." },
            { t: "La IA te da el plan y tú apruebas", d: "Sin tu OK no se construye nada." },
            { t: "Construye y tú lo miras", d: "Pides cambios hasta que esté bien." },
            { t: "Publicas y cierras", d: "Dos skills, en ese orden." },
          ]}
        />
      </Section>

      {/* ───────── 1 · ABRIR UNA SESIÓN ───────── */}
      <SectionHead id="e2s1" n="01" label="Abrir una sesión" />
      <Section>
        <Steps
          items={[
            { t: "Abre tu IDE en la carpeta de tu proyecto", d: "Nunca la carpeta madre." },
            { t: "Abre tu chat de IA", d: "El de la extensión, no el que trae el IDE de fábrica." },
            { t: <>Escribe <Mono>/primer</Mono></>, d: "La IA lee tu proyecto entero: qué hay construido, cómo está hecho, qué reglas tiene y qué se hizo últimamente." },
          ]}
        />
        <Quote>
          Cada chat empieza en blanco. Sin <Mono>/primer</Mono> la IA no sabe nada de tu proyecto y se inventa cosas.
        </Quote>
        <Muted>Un solo chat en esa ventana. Nunca dos.</Muted>
      </Section>

      {/* ───────── 2 · DECIR TU OBJETIVO ───────── */}
      <SectionHead id="e2s2" n="02" label="Decir tu objetivo" />
      <Section>
        <Lead>Le dices qué quieres lograr. El cómo es su trabajo.</Lead>
        <Code label="Así de simple">{`"Quiero que mis clientes puedan reservar una cita desde mi web
 y que me llegue un aviso cuando alguien reserve."`}</Code>
        <Text>
          Eso es suficiente. No necesitas saber qué archivos hay que tocar ni qué tecnología usar.
        </Text>
        <Cards
          cols={2}
          items={[
            { icon: Target, t: "Lo que sí ayuda decir", d: "Para quién es, y si hay algo que no debe cambiar." },
            { icon: Bot, t: "Lo que no hace falta", d: "Qué archivos tocar, qué tecnología usar, en qué orden hacerlo." },
          ]}
        />
        <Quote>Si tu objetivo no está claro para ti, tampoco va a estarlo para ella.</Quote>
      </Section>

      {/* ───────── 3 · EL PLAN ───────── */}
      <SectionHead id="e2s3" n="03" label="El plan (PRP)" />
      <Section>
        <Lead>Antes de tocar nada, la IA te devuelve el plan.</Lead>
        <Text>Qué entendió, qué va a construir, en qué fases, y qué decidió por su cuenta.</Text>
        <Cards
          items={[
            { icon: CheckCircle2, t: "Está bien", d: "Adelante, que construya." },
            { icon: ClipboardCheck, t: "Cambia esto", d: "Te rehace el plan y vuelve a preguntar." },
            { icon: Pause, t: "No es eso", d: "Vuelve a empezar desde el objetivo." },
          ]}
        />
        <Warn title="Sin tu aprobación no se construye nada">
          Si empieza a escribir código sin haberte presentado el plan, párala.
        </Warn>
      </Section>

      {/* ───────── 4 · LA CONSTRUCCIÓN ───────── */}
      <SectionHead id="e2s4" n="04" label="La construcción" />
      <Section>
        <Lead>Con tu OK, la IA construye por fases.</Lead>
        <Text>Puedes irte mientras trabaja. Cuando vuelvas te dice qué hizo.</Text>
        <Cards
          cols={2}
          items={[
            { icon: Rocket, t: "Publicar", d: "No lo hace sin ti. Es tu decisión y tu momento." },
            { icon: Database, t: "Borrar o cambiar datos que ya existen", d: "Tampoco lo hace sin ti. Es lo único sin marcha atrás." },
          ]}
        />
      </Section>

      {/* ───────── 5 · REVISARLO ───────── */}
      <SectionHead id="e2s5" n="05" label="Revisarlo" />
      <Section>
        <Lead>Abres tu navegador en la dirección de localhost y lo pruebas tú.</Lead>
        <Quote>
          Tú eres el último filtro. La IA comprueba que el código no falla, pero no si el resultado es lo que tenías en
          la cabeza.
        </Quote>
        <Cards
          items={[
            { icon: Eye, t: "¿Hace lo que pediste?", d: "No lo parecido: lo que pediste." },
            { icon: Smartphone, t: "¿Se ve bien en el móvil?", d: "Además de en el ordenador." },
            { icon: Blocks, t: "¿Se rompió algo?", d: "Algo que antes funcionaba y ahora no." },
          ]}
        />
        <Muted>Si algo no está bien, se lo dices con tus palabras y lo corrige. Las veces que haga falta.</Muted>
      </Section>

      {/* ───────── 6 · PUBLICAR ───────── */}
      <SectionHead id="e2s6" n="06" label="Publicar" />
      <Section>
        <Lead>
          Escribes <Mono>/publicar</Mono>. Es una skill, no una petición.
        </Lead>
        <Text>
          Publicar son cuatro cosas y las cuatro tienen que pasar en orden. Con la skill pasan siempre; pidiéndolo con
          tus palabras, no.
        </Text>
        <Steps
          items={[
            { t: "Guarda tu trabajo y lo une a main", d: "Commit y merge, en tu ordenador." },
            { t: "Lo sube a GitHub", d: "El push, que es el que dispara todo lo demás." },
            { t: "Espera a que tu web se monte", d: "Entre 2 y 4 minutos." },
            { t: "Comprueba que tu web sirve tu código nuevo", d: "Entra y lo verifica de verdad." },
          ]}
        />
        <Warn title="El paso 4 es el que existe la skill para garantizar">
          Es el que se salta cualquiera que publique a mano, y es el que hace que te quedes creyendo que publicaste algo
          que nunca llegó.
        </Warn>
        <Cards
          cols={2}
          items={[
            { icon: Layers, t: "Si la compilación falla", d: "Tu web no se toca, sigue funcionando como antes. Se arregla y se vuelve a publicar." },
            { icon: CheckCircle2, t: "Cuándo está publicado de verdad", d: "Cuando entras en tu web y lo ves." },
          ]}
        />
      </Section>

      {/* ───────── 7 · CERRAR ───────── */}
      <SectionHead id="e2s7" n="07" label="Cerrar" />
      <Section>
        <Lead>
          Escribes <Mono>/cerrar</Mono>. También es una skill.
        </Lead>
        <Text>Hace tres comprobaciones y te dice qué quedó pendiente.</Text>
        <Steps
          items={[
            { t: "Que no queda nada tuyo sin publicar", d: "Ni un cambio suelto en tu ordenador." },
            { t: "Que no quedan ramas abiertas olvidadas", d: "Las ramas se acumulan si nadie las cierra." },
            { t: "Que lo aprendido queda guardado en tu Knowledge", d: "Para que el siguiente chat no empiece de cero." },
          ]}
        />
        <div className="pt-8">
          <Cards
            cols={2}
            items={[
              { icon: Repeat, t: "Las ramas se acumulan", d: "Cada trabajo sin cerrar deja una rama abierta. Al mes tienes quince y no sabes qué hay en cada una." },
              { icon: Eye, t: "Crees que algo está publicado y no lo está", d: "Cierras convencido de que sí, y semanas después descubres que tu web nunca lo recibió." },
            ]}
          />
          <Quote>Aunque el trabajo haya sido corto, se cierra.</Quote>
        </div>
      </Section>

      {/* ───────── 8 · ALGO URGENTE A MITAD ───────── */}
      <SectionHead id="e2s8" n="08" label="Si surge algo urgente a mitad" />
      <Section>
        <Lead>Estás construyendo A y ves que B está roto. Apúntalo y sigue.</Lead>
        <Text>
          Le dices que lo guarde para después, terminas A, y entonces lo retomas. Un chat tiene un contexto limitado: si
          a mitad de un trabajo lo desvías a otra cosa, ese contexto se llena de dos temas mezclados y la calidad baja en
          los dos.
        </Text>
        <Quote>
          Terminar una cosa antes de empezar otra no es una preferencia: es lo que hace que salga bien.
        </Quote>
      </Section>

      {/* ───────── 9 · DÓNDE VIVE LA INFORMACIÓN ───────── */}
      <SectionHead id="e2s9" n="09" label="Dónde vive la información de tu proyecto" />
      <Section>
        <Lead>Tres sitios. Cada uno responde a una pregunta distinta.</Lead>
        <Cards
          items={[
            {
              icon: FileCode,
              t: "AGENTS.md",
              d: "Las reglas que obedece la IA. Se carga entero en cada chat, por eso es corto: los comandos de tu proyecto, cómo se escribe el código aquí, y las reglas duras que la IA no puede adivinar sola.",
            },
            {
              icon: Wrench,
              t: "BUSINESS_LOGIC.md",
              d: "Cómo está hecho tu proyecto: qué tecnologías usa, cómo está organizado, qué tablas tiene, con qué servicios se conecta.",
            },
            {
              icon: Database,
              t: "El Knowledge",
              d: "La memoria de tu negocio: procesos, decisiones, aprendizajes. Vive en tu base de datos, así que lo ves y lo editas desde tu propia web.",
            },
          ]}
        />
        <Muted>
          <span className="text-[#C7CBD1]">Por qué se llama AGENTS.md y no reglas.md:</span> porque es un estándar
          abierto que leen muchas herramientas de IA distintas, no solo una. Si mañana cambias de IA, lee el mismo
          archivo. No dependes de ninguna marca. Y si ves también un <Mono>CLAUDE.md</Mono>, no es un archivo aparte: es
          un acceso directo al mismo, para no escribir las reglas dos veces.
        </Muted>

        <div className="pt-10">
          <Terms
            head={["Si es...", "Va a..."]}
            rows={[
              ["Una orden corta que la IA debe obedecer siempre", <Mono key="a">AGENTS.md</Mono>],
              ["Un proceso, una decisión, un aprendizaje", "El Knowledge"],
              ["Cómo está construido el proyecto", <Mono key="b">BUSINESS_LOGIC.md</Mono>],
            ]}
          />
        </div>
      </Section>

      {/* ───────── 10 · LAS SKILLS ───────── */}
      <SectionHead id="e2s10" n="10" label="Las skills" />
      <Section>
        <Lead>Escribes una palabra y se ejecuta un procedimiento entero, siempre igual.</Lead>
        <Text>
          Cuando pones <Mono>/</Mono> en el chat no estás escribiendo una frase: estás ejecutando un procedimiento
          guardado, sin saltarse pasos.
        </Text>
        <Terms
          head={["Skill", "Qué hace"]}
          rows={[
            [<Mono key="a">/primer</Mono>, "Lee tu proyecto entero y se pone al día"],
            [<Mono key="b">/new-ecoai</Mono>, "Monta la base de tu sistema"],
            [<Mono key="c">/visual-knowledge</Mono>, "Construye tu Knowledge navegable en 3D"],
            [<Mono key="d">/add-login</Mono>, "Monta el registro y la entrada de usuarios, con su seguridad"],
            [<Mono key="e">/prp</Mono>, "Escribe el plan de lo que vas a construir"],
          ]}
        />
        <Muted>
          Tu sistema trae más guardadas (correos, notificaciones, trabajo con la base de datos, pruebas en el navegador,
          generación de imágenes). No vienen puestas: se activan con una orden cuando te hacen falta. Para ver todas las
          que tienes, se lo preguntas.
        </Muted>

        <div className="pt-10">
          <Lead>Las que más valor te van a dar son las tuyas.</Lead>
          <Cards
            cols={2}
            items={[
              {
                icon: Repeat,
                t: "Cualquier cosa que repitas",
                d: "Hacer una factura, publicar contenido, preparar un informe mensual, procesar la grabación de una reunión.",
              },
              {
                icon: MessageSquare,
                t: "Cómo se crea",
                d: "Se lo pides. Le explicas el proceso una vez, con detalle: qué pasos tiene, qué reglas hay que respetar, qué no se puede olvidar.",
              },
            ]}
          />
          <Quote>
            Las skills que trae el sistema montan software. Las tuyas ejecutan los procesos de tu negocio.
          </Quote>
        </div>
      </Section>

      {/* ───────── EL CICLO COMPLETO ───────── */}
      <SectionHead label="El ciclo completo" />
      <Section>
        <Flow steps={["/primer", "objetivo", "plan", "apruebas", "construye", "lo miras", "/publicar"]} last="/cerrar" />
        <div className="pt-6">
          <Timeline
            items={[
              { t: "IDE en la carpeta del proyecto, un chat dentro", d: "Nunca dos." },
              { t: <><Mono>/primer</Mono></>, d: "Siempre lo primero." },
              { t: "Dices tu objetivo", d: "Qué quieres lograr." },
              { t: "La IA te presenta el plan", d: "Y tú lo apruebas o lo corriges." },
              { t: "Construye por fases", d: "Puedes irte mientras trabaja." },
              { t: "Tú lo miras en el navegador", d: "Y pides cambios hasta que esté bien." },
              { t: <>Publicas con <Mono>/publicar</Mono></>, d: "Y se comprueba que llegó de verdad." },
              { t: <>Cierras con <Mono>/cerrar</Mono></>, d: "Siempre, aunque haya sido corto." },
            ]}
          />
        </div>
      </Section>

      {/* ───────── LAS 5 QUE NO SE SALTAN ───────── */}
      <SectionHead label="Las 5 que no se saltan" />
      <Section>
        <Rules
          items={[
            { t: <><Mono>/primer</Mono> al empezar cada chat</>, d: "Sin contexto, la IA se inventa cosas." },
            { t: "Un solo chat por carpeta", d: "Dos chats mezclan código sin que nadie lo note." },
            { t: "Nada se construye sin que apruebes el plan", d: "Si empieza a editar sin explicarte, párala." },
            { t: "Nada se da por bueno sin que lo veas tú en el navegador" },
            { t: "Se cierra siempre", d: "Aunque el trabajo haya sido corto." },
          ]}
        />
      </Section>

      <Closing
        kicker="Si en tu proyecto va a trabajar más de una persona"
        title={<>Entrenamiento 3 · Trabajar en equipo</>}
        sub="Si trabajas solo, no lo necesitas. Si sois varios, es lo que evita que os piséis."
        cta={{ href: "/formacion/ia-integrator/entrenamiento-3", label: "Abrir el Entrenamiento 3" }}
      />
    </FormacionPage>
  )
}
