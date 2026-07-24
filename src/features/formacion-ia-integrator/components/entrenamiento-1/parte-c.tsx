"use client"

import {
  History, Database, Boxes, Sparkles, Brain, ListChecks, Repeat, Wrench,
  ShieldCheck, Blocks, Eye, Layers, FileText, Gauge,
} from "lucide-react"
import {
  SectionHead, Section, Lead, Text, Muted, Cards, Steps, Timeline, Rules, Quote, Warn, Code, Mono, Split, Terms,
} from "../formacion-kit"

/** Entrenamiento 1 · secciones 7 a 12 y el mapa completo. */
export function ParteC() {
  return (
    <>
      {/* ───────── 7 · LA BASE DE DATOS ───────── */}
      <SectionHead id="s7" n="07" label="La base de datos" />
      <Section>
        <Lead>Tu código tiene marcha atrás. Tu base de datos no.</Lead>
        <Text>
          Ya la viste en el punto 00: es donde vive la información de tus usuarios, organizada en tablas y campos. Esto
          es lo que la hace distinta de todo lo demás, y es lo más delicado del entrenamiento.
        </Text>
        <Split
          left={{
            t: "Base de datos",
            body: (
              <>
                <p>No hay versiones. Si borras una fila, no hay una de ayer a la que volver desde tu proyecto.</p>
                <p className="text-[#E5B567]">Lo borrado, borrado.</p>
              </>
            ),
          }}
          right={{
            t: "Código",
            body: (
              <>
                <p>
                  Cada vez que la IA guarda un punto de control queda una versión más, y ninguna se borra. Si algo se
                  rompe, se vuelve a la de ayer.
                </p>
                <p>Vuelves atrás cuando quieras.</p>
              </>
            ),
          }}
        />
        <Muted>
          Los servicios de base de datos suelen hacer copias de seguridad diarias por su cuenta, pero recuperarlas es un
          proceso aparte, lento, y se pierde todo lo que pasó desde la última copia. No es marcha atrás.
        </Muted>

        <div className="pt-10">
          <Lead>Y solo hay una.</Lead>
          <UnaSolaBase />
          <Warn title="Probar en tu ordenador no es probar en una copia">
            Cuando arrancas tu web en tu ordenador, no se conecta a una base de datos de prueba. Se conecta a la de
            verdad, la que están usando tus usuarios en ese momento.
          </Warn>
        </div>
      </Section>

      {/* ───────── 8 · NO REINVENTES LA RUEDA ───────── */}
      <SectionHead id="s8" n="08" label="No reinventes la rueda" />
      <Section>
        <Lead>Podrías empezar con una carpeta vacía y decirle a la IA «constrúyeme una web».</Lead>
        <Text>Esto es lo que pasa cuando lo haces.</Text>
        <Split
          left={{
            t: "Sin sistema",
            body: (
              <>
                <p>
                  <span className="text-white">Cada decisión técnica es tuya</span> y no sabes cuál es la buena. La IA
                  elige una, tú no puedes juzgarla, y lo descubres tres semanas después cuando ya construiste encima.
                </p>
                <p>
                  <span className="text-white">Cada vez que pides lo mismo, sale distinto.</span> Pides el registro de
                  usuarios hoy y lo hace de una forma. Lo pides el mes que viene en otro chat y lo hace de otra.
                </p>
                <p>
                  <span className="text-white">La IA no recuerda nada.</span> Le explicas tus preferencias, tus reglas y
                  cómo funciona tu negocio. Mañana, chat nuevo, vuelves a explicarlo todo.
                </p>
                <p>
                  <span className="text-white">Los errores se repiten.</span> Algo falla, lo arreglas, y a la semana
                  vuelve a fallar igual, porque nadie escribió qué pasó.
                </p>
              </>
            ),
          }}
          right={{
            t: "Con el sistema",
            body: (
              <>
                <p>Las decisiones técnicas ya están tomadas y probadas.</p>
                <p>
                  Los procedimientos ya están escritos. Pides el registro de usuarios y se monta igual hoy que dentro de
                  un año, con su seguridad puesta.
                </p>
                <p>Tus reglas y tu memoria viven en el proyecto. La IA las lee al empezar cada chat.</p>
                <p>Los errores quedan registrados solos y no vuelven.</p>
              </>
            ),
          }}
        />
        <Quote>
          Sin sistema, tu trabajo es vigilar a la IA. Con sistema, tu trabajo es dar la idea.
        </Quote>
        <Muted>
          Y hay algo más, que es lo que más se nota: ese sistema obliga a la IA a trabajar de una forma concreta. De eso
          va el punto siguiente.
        </Muted>
      </Section>

      {/* ───────── 9 · LAS SKILLS ───────── */}
      <SectionHead id="s9" n="09" label="Las skills: las órdenes de tu sistema" />
      <Section>
        <Lead>Una skill es un procedimiento completo guardado.</Lead>
        <Text>
          Escribes una orden en el chat y se ejecuta entero, siempre igual, sin saltarse pasos. Se escriben con una barra
          delante: cuando pones <Mono>/</Mono> en el chat no estás escribiendo una frase, estás ejecutando un
          procedimiento.
        </Text>
        <Split
          left={{
            t: "Le pides «monta el registro de usuarios»",
            body: <p>La IA improvisa. Hoy lo hace de una forma, mañana de otra.</p>,
          }}
          right={{
            t: "Escribes /add-login",
            body: (
              <p>
                Se ejecuta el procedimiento probado: las tablas, la seguridad, las pantallas de entrada y el recuperar
                contraseña, en su orden.
              </p>
            ),
          }}
        />
        <Muted>Esa es la diferencia entre pedir algo y ejecutar un procedimiento.</Muted>

        <div className="pt-10">
          <Lead>Las que vas a usar.</Lead>
          <Terms
            head={["Skill", "Qué hace"]}
            rows={[
              [<Mono key="a">/primer</Mono>, "Lee tu proyecto entero y pone al día a la IA"],
              [<Mono key="b">/prp</Mono>, "Escribe el plan antes de construir"],
              [<Mono key="c">/new-ecoai</Mono>, "Monta la base de tu sistema"],
              [<Mono key="d">/add-login</Mono>, "Cuentas de usuario con su seguridad"],
              [<Mono key="e">/publicar</Mono>, "Publica tu trabajo y comprueba que llegó a tu web"],
              [<Mono key="f">/cerrar</Mono>, "Deja el trabajo cerrado antes de cerrar el chat"],
            ]}
          />
          <Muted>Hay más, y las tienes todas en el Catálogo de Skills.</Muted>
        </div>

        <div className="pt-10">
          <Cards
            cols={2}
            items={[
              {
                icon: Wrench,
                t: "Tú puedes crear las tuyas",
                d: "Cualquier proceso que repitas en tu negocio (hacer una factura, publicar contenido, preparar un informe mensual) puede convertirse en una skill.",
              },
              {
                icon: Repeat,
                t: "Lo explicas bien una vez",
                d: "A partir de ahí sale igual de bien siempre, sin que vuelvas a explicarlo.",
              },
            ]}
          />
          <Quote>
            Ese es el objetivo final: que tu sistema no solo construya software, sino que ejecute los procesos de tu
            negocio.
          </Quote>
        </div>
      </Section>

      {/* ───────── 10 · EL CONTEXTO ───────── */}
      <SectionHead id="s10" n="10" label="El contexto" />
      <Section>
        <Lead>Lo que la IA puede tener en la cabeza a la vez.</Lead>
        <Text>Esto no se suele explicar, y es lo que separa a quien va rápido de quien pierde horas.</Text>
        <Cards
          cols={2}
          items={[
            {
              icon: Gauge,
              t: "Token",
              d: "La unidad en la que la IA cuenta el texto. En español, un token son unas 3 o 4 letras. Una palabra normal son 1 o 2 tokens.",
            },
            {
              icon: Brain,
              t: "Ventana de contexto",
              d: "Todo lo que cabe en una conversación. Y «todo» es literal.",
            },
          ]}
        />
        <Code label="Qué ocupa tu ventana de contexto">{`Lo que tu escribes
+ Lo que responde la IA
+ TODOS los archivos que lee para trabajar
+ TODOS los resultados de las ordenes que ejecuta
+ Las reglas de tu proyecto, que se cargan enteras al empezar`}</Code>
        <Muted>
          Lo que más gasta no eres tú: es la IA leyendo archivos. Un documento largo se come más espacio que una hora de
          conversación.
        </Muted>

        <div className="pt-10">
          <Lead>Cuando se llena, la conversación se compacta.</Lead>
          <Text>Compactar es resumir la conversación entera y seguir con el resumen en lugar del original.</Text>
          <Split
            left={{
              t: "Se pierde",
              body: <p>El detalle literal, los matices, lo que dijiste con tus palabras exactas.</p>,
            }}
            right={{
              t: "Se conserva",
              body: <p>Las decisiones, los acuerdos, dónde estás.</p>,
            }}
          />
          <div className="pt-8">
            <Cards
              items={[
                { icon: FileText, t: "Los archivos de tu proyecto", d: "No viven en la conversación. No se pierden." },
                { icon: Database, t: "Tu base de datos", d: "Tampoco. Está fuera del chat." },
                { icon: Layers, t: "Las reglas y el Knowledge", d: "Se vuelven a cargar en cada chat nuevo." },
              ]}
            />
          </div>
          <Quote>Por eso todo lo importante se escribe. Lo que solo se dijo en un chat, desaparece.</Quote>
        </div>

        <div className="pt-10">
          <Lead>Las 4 reglas del contexto.</Lead>
          <Rules
            items={[
              {
                t: "Un chat, una cosa",
                d: "Mezclar dos temas llena el espacio con el doble de ruido y baja la calidad de los dos.",
              },
              { t: "Todo lo que importe, escrito", d: "En un archivo, en tu base de datos o en el Knowledge. Nunca solo dicho." },
              { t: "Compacta entre tareas, no a mitad", d: "A mitad se pierde justo lo que estabas usando." },
              {
                t: "Para trabajos que exigen leer mucho, sub-agentes",
                d: "Un sub-agente es una IA auxiliar que la principal lanza para una tarea concreta. Lee lo que haga falta y devuelve solo el resultado, así que lo que leyó no ocupa espacio en tu conversación. Se lo pides así: «lanza sub-agentes para revisar esto».",
              },
            ]}
          />
        </div>
      </Section>

      {/* ───────── 11 · CÓMO CONSTRUYE ───────── */}
      <SectionHead id="s11" n="11" label="Cómo construye la IA dentro de tu sistema" />
      <Section>
        <Warn title="Esto no es cómo trabajan las IAs en general">
          Una IA sin configurar se pone a escribir código en cuanto le pides algo. Improvisa, no te enseña un plan y no
          comprueba lo que hizo. La tuya no va a hacer eso, porque el sistema está configurado para impedirlo. Está
          obligada a seguir dos pasos.
        </Warn>

        <div className="pt-6">
          <Lead>Primero: el PRP.</Lead>
          <Text>
            PRP viene de <span className="italic">Product Requirements Proposal</span>: propuesta de requisitos del
            producto. Es el plan de lo que se va a construir, escrito antes de tocar nada.
          </Text>
          <Cards
            items={[
              { icon: Eye, t: "Qué entendió", d: "De lo que le pediste, con sus palabras." },
              { icon: Blocks, t: "Qué va a construir", d: "Exactamente qué, con qué datos y en qué fases." },
              { icon: ListChecks, t: "Qué decidió por su cuenta", d: "Para que puedas corregirla antes, no después." },
            ]}
          />
          <Muted>
            Tú lo lees y decides: está bien, cambia esto, o no es lo que quería. Corregir un plan cuesta un minuto.
            Corregir algo ya construido cuesta horas.
          </Muted>
          <Quote>Sin tu aprobación no se construye nada.</Quote>
        </div>

        <div className="pt-10">
          <Lead>Después: el bucle agéntico.</Lead>
          <Text>
            Es un sistema de agentes de IA que planifican, ejecutan, comprueban y corrigen hasta que la tarea está
            completa. Un <span className="text-white">agente</span> es una IA que además de responder hace cosas: abre
            archivos, escribe código, ejecuta órdenes y revisa el resultado. Por eso puede trabajar sola un rato largo.
          </Text>
          <Timeline
            items={[
              { t: "Delimitar", d: "Se define el problema con claridad." },
              { t: "Ingeniería inversa", d: "Se desarma en piezas pequeñas, mirando cómo está tu proyecto ahora mismo." },
              { t: "Planear", d: "Se escribe la lista de tareas antes de tocar código." },
              { t: "Ejecutar", d: "Se hace tarea por tarea, comprobando cada una. No se avanza hasta que lo anterior funciona." },
            ]}
          />
          <Muted>
            Se llama bucle porque repite el mismo ciclo en cada fase. Y el proyecto se vuelve a mirar antes de cada fase
            porque cambia mientras se trabaja: si se decidieran los cuarenta pasos al principio, el paso treinta estaría
            basado en un proyecto que ya no existe.
          </Muted>
        </div>

        <div className="pt-10">
          <Cards
            cols={2}
            items={[
              {
                icon: ShieldCheck,
                t: "El auto-blindaje",
                d: "Cada error que la IA encuentra se documenta automáticamente. Tú no haces nada: ocurre solo, mientras trabaja.",
              },
              {
                icon: History,
                t: "Y por eso no vuelve",
                d: "Ese registro se consulta en los chats siguientes. El mismo error no ocurre dos veces.",
              },
            ]}
          />
        </div>
      </Section>

      {/* ───────── 12 · LAS REGLAS ───────── */}
      <SectionHead id="s12" n="12" label="Las reglas" />
      <Section>
        <Rules
          items={[
            { t: "Un solo chat por carpeta", d: "Dos chats en la misma carpeta acaban mezclando código de ramas distintas." },
            {
              t: "Abre siempre la carpeta del proyecto, nunca la carpeta madre",
              d: "Si abres la madre, la IA ve todos tus proyectos mezclados y toca el que no es.",
            },
            {
              t: "No copies ni dupliques la carpeta de tu proyecto",
              d: "Si hay que moverlo o trabajar en dos cosas a la vez, se lo pides a la IA y lo hace ella.",
            },
            {
              t: "No guardes tu proyecto en iCloud, Drive ni Dropbox",
              d: "Duplican y renombran archivos sin avisar. La copia de seguridad la hace GitHub.",
            },
            {
              t: "Usa tu chat, el que instalaste como extensión",
              d: "El que trae el IDE de fábrica no conoce tus reglas ni puede entrar en tus herramientas.",
            },
            { t: "Empieza cada chat con /primer", d: "Es lo que le da a la IA el contexto de tu proyecto." },
            {
              t: "No se construye nada hasta que apruebas el plan",
              d: "Si empieza a escribir código sin haberte enseñado el plan, párala.",
            },
            { t: "Nada se publica hasta que lo pruebas en tu ordenador y lo dices tú" },
            {
              t: "Las API keys nunca salen de .env.local ni de .mcp.json",
              d: "Ni a un chat, ni a un correo, ni a un mensaje.",
            },
          ]}
        />
      </Section>

      {/* ───────── EL MAPA COMPLETO ───────── */}
      <SectionHead label="El mapa completo" />
      <Section>
        <MapaCompleto />
      </Section>

      {/* ───────── QUÉ VIENE AHORA ───────── */}
      <SectionHead label="Qué viene ahora" />
      <Section tight>
        <Steps
          items={[
            {
              t: "Entrenamiento 2 · Cómo usar el sistema",
              d: "Qué haces tú cada día: qué escribes y en qué orden.",
            },
            {
              t: "El setup de instalación",
              d: "Instalas tus herramientas, creas tus cuentas y levantas tu proyecto por primera vez.",
            },
          ]}
        />
        <Muted>
          Cuando en el setup veas una terminal, una API key, un archivo <Mono>.env.local</Mono> o un MCP, ya sabes qué
          es.
        </Muted>
      </Section>
    </>
  )
}

/* ───────────────────── Diagrama: una sola base de datos ───────────────────── */
function UnaSolaBase() {
  const fuentes = ["Tu web en tu ordenador", "Tu web publicada"]
  return (
    <div data-reveal className="vc-reveal grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
      <div className="space-y-3">
        {fuentes.map((f, i) => (
          <div key={f} className={`vc-node vc-node-${i + 1} border border-[#2A2D34] bg-[#141418] px-5 py-4 text-[15px] text-[#C7CBD1]`}>
            {f}
          </div>
        ))}
      </div>
      <svg viewBox="0 0 120 120" className="mx-auto hidden h-24 w-24 md:block" aria-hidden>
        <path className="vc-draw" d="M10 30 C 60 30 60 60 110 60" fill="none" stroke="#22C55E" strokeWidth="2" pathLength={1} />
        <path className="vc-draw" d="M10 90 C 60 90 60 60 110 60" fill="none" stroke="#22C55E" strokeWidth="2" pathLength={1} style={{ transitionDelay: "0.2s" }} />
      </svg>
      <div className="vc-node vc-node-3 flex items-center gap-3 border border-[#24462F] bg-[#101710] px-5 py-6">
        <Database className="h-6 w-6 shrink-0 text-[#4ADE80]" />
        <div>
          <p className="text-[15px] font-semibold text-white">La misma base de datos</p>
          <p className="mt-0.5 text-[13px] text-[#9CA3AF]">Solo hay una, y es la de verdad.</p>
        </div>
      </div>
    </div>
  )
}

/* ───────────────────── Diagrama: el mapa completo ───────────────────── */
function MapaCompleto() {
  return (
    <div data-reveal className="vc-reveal grid gap-4 md:grid-cols-2">
      <div className="border border-[#2A2D34] bg-[#131316] p-6">
        <p className="mb-5 text-[12px] font-medium uppercase tracking-[0.12em] text-[#7B818C]">Tu ordenador</p>
        <div className="space-y-3">
          {[
            { icon: Boxes, t: "localhost", d: "Donde pruebas. Solo tú lo ves." },
            { icon: Sparkles, t: "rama", d: "Donde se trabaja lo grande, aparte." },
          ].map((x, i) => (
            <div key={x.t} className={`vc-node vc-node-${i + 1} flex items-start gap-3`}>
              <x.icon className="mt-0.5 h-4 w-4 shrink-0 text-[#4ADE80]" />
              <div>
                <p className="text-[15px] font-semibold text-white" style={{ fontFamily: "var(--font-mono)" }}>
                  {x.t}
                </p>
                <p className="text-[13px] text-[#9CA3AF]">{x.d}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-6 text-[13px] text-[#6B7280]" style={{ fontFamily: "var(--font-mono)" }}>
          commit → merge → push
        </p>
      </div>
      <div className="border border-[#24462F] bg-[#101710] p-6">
        <p className="mb-5 text-[12px] font-medium uppercase tracking-[0.12em] text-[#4ADE80]">Internet</p>
        <div className="space-y-3">
          {[
            { icon: Database, t: "GitHub · main", d: "La versión oficial de tu proyecto." },
            { icon: Layers, t: "tu web", d: "Se publica sola al llegar a main. La ve todo el mundo." },
          ].map((x, i) => (
            <div key={x.t} className={`vc-node vc-node-${i + 3} flex items-start gap-3`}>
              <x.icon className="mt-0.5 h-4 w-4 shrink-0 text-[#4ADE80]" />
              <div>
                <p className="text-[15px] font-semibold text-white" style={{ fontFamily: "var(--font-mono)" }}>
                  {x.t}
                </p>
                <p className="text-[13px] text-[#9CA3AF]">{x.d}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-6 text-[13px] text-[#6B7280]" style={{ fontFamily: "var(--font-mono)" }}>
          lo ve todo el mundo
        </p>
      </div>
    </div>
  )
}
