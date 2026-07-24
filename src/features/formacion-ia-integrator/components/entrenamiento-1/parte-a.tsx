"use client"

import {
  Monitor, Server, Palette, MousePointerClick, Database, Plug, KeyRound,
  MessageSquare, Bot, FolderTree, AppWindow, Terminal, Puzzle, Plug2,
} from "lucide-react"
import {
  SectionHead, Section, Lead, Text, Muted, Cards, Terms, Split, Quote, Warn, Code, Mono, Chain,
} from "../formacion-kit"

/** Entrenamiento 1 · secciones 0 a 3: vocabulario, reparto de trabajo, la carpeta y las herramientas. */
export function ParteA() {
  return (
    <>
      {/* ───────── 0 · VOCABULARIO ───────── */}
      <SectionHead id="s0" n="00" label="Las palabras que vas a oír" />
      <Section>
        <Lead>Empezamos por aquí porque sin esto el resto no se entiende.</Lead>

        <Text>Un software tiene dos mitades.</Text>
        <Cards
          cols={2}
          items={[
            {
              icon: Monitor,
              t: "Frontend",
              d: (
                <>
                  Todo lo que se ve en la pantalla: los botones, los textos, los colores, los formularios. Si abres tu
                  web y ves un botón que dice &quot;Comprar&quot;, eso es frontend.
                </>
              ),
            },
            {
              icon: Server,
              t: "Backend",
              d: (
                <>
                  Todo lo que ocurre por detrás. Haces clic en &quot;Comprar&quot; y algo tiene que comprobar tu sesión,
                  mirar si queda producto, cobrar, guardar el pedido y mandarte el correo. Nada de eso se ve.
                </>
              ),
            },
          ]}
        />
        <Muted>
          Para qué te sirve saberlo: cuando algo falle, vas a poder decir dónde. &quot;El botón no se ve bien&quot; es
          frontend. &quot;Hago clic en comprar y no me llega el correo&quot; es backend.
        </Muted>

        <div className="pt-14">
          <Text>Dentro del frontend hay dos cosas distintas que se confunden todo el rato.</Text>
          <Cards
            cols={2}
            items={[
              {
                icon: Palette,
                t: "UI · interfaz de usuario",
                d: "Cómo se ve. Los colores, las tipografías, el tamaño de los botones, la separación entre las cosas.",
              },
              {
                icon: MousePointerClick,
                t: "UX · experiencia de usuario",
                d: "Cómo se usa. Si es fácil llegar a lo que buscas, si se entiende qué hacer, si hacen falta tres pasos o siete.",
              },
            ]}
          />
          <Quote>
            La UI es cómo se ve. La UX es lo fácil que resulta usarlo. Una web puede ser preciosa y aun así ser un
            infierno para comprar.
          </Quote>
        </div>

        <div className="pt-8">
          <Lead>La información no es código. Vive aparte, en la base de datos.</Lead>
          <Text>
            El frontend y el backend son código: instrucciones escritas en archivos de tu carpeta. Las cuentas de tus
            usuarios, sus compras y sus mensajes viven en un sitio aparte. Los tres trabajan juntos en cada clic.
          </Text>
          <Chain
            steps={[
              { icon: Monitor, t: "frontend", d: "El usuario hace clic en «ver mi perfil»." },
              { icon: Server, t: "backend", d: "Recibe la orden y va a buscar los datos." },
              { icon: Database, t: "base de datos", d: "Devuelve nombre, correo y sus compras." },
              { icon: Monitor, t: "frontend", d: "Los pinta en la pantalla." },
            ]}
          />
          <Muted>
            Por dentro está organizada en <span className="text-[#C7CBD1]">tablas</span>: una tabla es una lista de cosas
            del mismo tipo (la de usuarios, la de pedidos). Y cada tabla tiene{" "}
            <span className="text-[#C7CBD1]">campos</span>: la de usuarios tiene el campo nombre, el campo correo, el
            campo teléfono.
          </Muted>
        </div>

        <div className="pt-14">
          <Lead>Y para hablar entre ellos, la API.</Lead>
          <Cards
            cols={2}
            items={[
              {
                icon: Plug,
                t: "API",
                d: (
                  <>
                    El punto de entrada por el que dos programas se piden cosas. Tu frontend no entra en la base de datos
                    por su cuenta: se lo pide al backend a través de una API. Y hacia fuera igual: tu web no sabe cobrar
                    con tarjeta, se lo pide a la API de Stripe.
                  </>
                ),
              },
              {
                icon: KeyRound,
                t: "API key",
                d: (
                  <>
                    El código de acceso a esa API. Un texto largo tipo <Mono>sk_live_ESTO_ES_UN_EJEMPLO...</Mono> que identifica que
                    la petición viene de tu cuenta.
                  </>
                ),
              },
            ]}
          />
          <Warn title="Una API key no es una contraseña de las que tú escribes en una pantalla">
            La usa tu programa, sin que nadie la teclee. Quien tenga esa cadena de texto, tiene tu cuenta. No hay
            usuario, ni segundo paso, ni nada. Dónde se guardan va en el punto 06.
          </Warn>
        </div>

        <div className="pt-6">
          <Terms
            head={["Palabra", "Qué es"]}
            rows={[
              ["Frontend", "Lo que se ve y se toca"],
              ["Backend", "Lo que ocurre por detrás"],
              ["UI", "Cómo se ve"],
              ["UX", "Lo fácil que resulta usarlo"],
              ["Base de datos", "Donde vive la información de tus usuarios"],
              ["Tabla", "Una lista de cosas del mismo tipo dentro de la base de datos"],
              ["Campo", "Cada dato de esa lista: nombre, correo, teléfono"],
              ["API", "El punto de entrada por el que dos programas se piden cosas"],
              ["API key", "El código de acceso a una API. Quien lo tiene, entra"],
            ]}
          />
        </div>
      </Section>

      {/* ───────── 1 · QUIÉN HACE QUÉ ───────── */}
      <SectionHead id="s1" n="01" label="Quién hace qué" />
      <Section>
        <Terms
          head={["Tú", "La IA"]}
          rows={[
            ["Dices qué quieres lograr", "Decide cómo hacerlo"],
            ["Apruebas el plan", "Escribe el código"],
            ["Miras el resultado", "Lo prueba y lo corrige"],
            ["Decides cuándo sale a internet", "Lo publica cuando tú lo dices"],
          ]}
        />
        <Quote>Ella construye todo lo que le pidas. Publicar es tuyo.</Quote>

        <Text>
          Le dices <span className="font-medium text-white">qué</span> quieres lograr, no{" "}
          <span className="font-medium text-white">cómo</span> hacerlo. El cómo es su trabajo: qué archivos tocar, qué
          tecnología usar, en qué orden.
        </Text>
        <Split
          left={{
            t: "Objetivo poco claro",
            body: <p>&quot;Quiero mejorar la web.&quot;</p>,
          }}
          right={{
            t: "Objetivo claro",
            body: (
              <p>
                &quot;Quiero que mis clientes puedan reservar una cita desde mi web y que me llegue un aviso cuando
                alguien reserve.&quot;
              </p>
            ),
          }}
        />
        <Muted>Si tú no tienes claro tu objetivo, ella tampoco.</Muted>
      </Section>

      {/* ───────── 2 · TU PROYECTO ES UNA CARPETA ───────── */}
      <SectionHead id="s2" n="02" label="Tu proyecto es una carpeta" />
      <Section>
        <Lead>Tu software es una carpeta de tu ordenador con cientos de archivos dentro.</Lead>
        <Text>
          Cuando abres esa carpeta y arrancas un chat, la IA trabaja con los archivos de esa carpeta. No abre tus otros
          proyectos ni tus documentos personales.
        </Text>

        <Code label="Carpeta madre y carpeta de proyecto">{`Mis-Proyectos          <- la carpeta MADRE
   |-- mi-tienda       <- un proyecto
   |-- mi-app          <- otro
   \\-- mi-web          <- otro`}</Code>

        <Warn title="Abres siempre la carpeta del proyecto. Nunca la madre">
          Si abres la madre, la IA ve tres proyectos mezclados y va a tocar archivos del equivocado.
        </Warn>

        <Cards
          cols={2}
          items={[
            {
              icon: FolderTree,
              t: "Los chats no viajan",
              d: "Cada proyecto tiene sus propios chats. Si abres otro proyecto, esos chats no están.",
            },
            {
              icon: MessageSquare,
              t: "Y cada chat empieza en blanco",
              d: (
                <>
                  Incluso dentro del mismo proyecto. Por eso lo primero que escribes en un chat nuevo es{" "}
                  <Mono>/primer</Mono>: hace que la IA lea tu proyecto entero y se ponga al día.
                </>
              ),
            },
          ]}
        />
      </Section>

      {/* ───────── 3 · TUS HERRAMIENTAS ───────── */}
      <SectionHead id="s3" n="03" label="Tus herramientas" />
      <Section>
        <Lead>El IDE es el programa donde se abre tu proyecto y donde ocurre todo tu trabajo.</Lead>
        <Text>
          IDE viene de <span className="italic">Integrated Development Environment</span>: entorno de desarrollo
          integrado. Se llama integrado porque junta en una sola ventana todo lo que necesitas.
        </Text>
        <IdeMock />
        <Muted>
          Los tres más usados son Antigravity, VS Code y Cursor. Los tres sirven igual para esto. Elige uno y quédate con
          él.
        </Muted>

        <div className="pt-14">
          <Lead>La terminal es donde le das órdenes escritas al ordenador, en lugar de con clics.</Lead>
          <Text>
            Existe de dos formas: como programa suelto y como panel dentro del IDE. Son la misma cosa. Aquí siempre vas a
            usar la del IDE, para no saltar entre ventanas. La usarás para instalar programas y arrancar tu proyecto,
            casi siempre pegando algo que la IA te da.
          </Text>
          <Split
            left={{
              t: "Cuadradito hueco",
              body: <p>No estás dentro de la terminal. Haz clic sobre ella primero.</p>,
            }}
            right={{
              t: "Cuadradito relleno",
              body: <p>La terminal está activa. Puedes escribir.</p>,
            }}
          />
          <Warn title="Es el tropiezo más común al empezar">
            Escribir creyendo que estás en la terminal y que no aparezca nada. Y cuando escribas una contraseña ahí, no
            vas a ver nada: ni puntos ni asteriscos. Está escribiendo. Es a propósito.
          </Warn>
        </div>

        <div className="pt-8">
          <Lead>Tu chat de IA no es el que trae el IDE de fábrica.</Lead>
          <Cards
            cols={2}
            items={[
              {
                icon: AppWindow,
                t: "El de fábrica",
                d: "No conoce tus reglas, no puede ejecutar tus procedimientos y no entra en tu base de datos. Te va a dar respuestas genéricas que no encajan con tu proyecto.",
              },
              {
                icon: Puzzle,
                t: "El tuyo",
                d: "Se instala aparte, como extensión: un añadido que pones dentro del IDE desde su propio catálogo. Lo vas a hacer en el setup.",
              },
            ]}
          />
        </div>

        <div className="pt-14">
          <Lead>Los MCPs conectan a la IA con tus herramientas.</Lead>
          <Text>
            MCP viene de <span className="italic">Model Context Protocol</span>: protocolo de contexto para modelos. Es
            un estándar que permite conectar una IA con una herramienta externa. Cada conexión de esas es un MCP.
          </Text>
          <Split
            left={{
              t: "Sin MCPs",
              body: <p>La IA escribe código y no sabe si funcionó.</p>,
            }}
            right={{
              t: "Con MCPs",
              body: <p>Entra en tus herramientas y trabaja dentro de ellas. Comprueba el resultado y lo corrige sola.</p>,
            }}
          />
          <div className="pt-8">
            <Terms
              head={["MCP", "Qué le permite hacer"]}
              rows={[
                ["Supabase", "Entrar en tu base de datos: crear tablas, consultar datos, poner la seguridad"],
                ["Playwright", "Abrir tu web en un navegador de verdad y comprobar que se ve bien"],
                ["Next.js DevTools", "Ver los errores de tu proyecto mientras se ejecuta"],
              ]}
            />
          </div>
          <div className="pt-8">
            <Cards
              cols={2}
              items={[
                {
                  icon: Bot,
                  t: "Le pides una pantalla nueva. Sin MCPs",
                  d: "La escribe y te dice «listo». Nadie ha comprobado nada.",
                },
                {
                  icon: Plug2,
                  t: "La misma pantalla. Con MCPs",
                  d: "La escribe, abre tu web en un navegador, ve que un botón se sale en el móvil, lo arregla y vuelve a mirar.",
                },
              ]}
            />
          </div>
        </div>
      </Section>
    </>
  )
}

/* ───────────────────── Maqueta del IDE ───────────────────── */
function IdeMock() {
  const panel = "border border-[#2A2D34] bg-[#131316] p-4"
  return (
    <div data-reveal className="vc-reveal my-6 border border-[#2A2D34] bg-[#0C0C0F] p-3">
      <div className="mb-3 flex gap-1.5 px-1">
        {["#3A3D44", "#3A3D44", "#3A3D44"].map((c, i) => (
          <span key={i} className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c }} />
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-[0.8fr_1.4fr_1fr]">
        <div className={`${panel} vc-node vc-node-1`}>
          <FolderTree className="mb-3 h-4 w-4 text-[#4ADE80]" />
          <p className="text-[13px] font-medium text-white">Archivos</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-[#7B818C]">de tu proyecto</p>
        </div>
        <div className="grid gap-3">
          <div className={`${panel} vc-node vc-node-2`}>
            <p className="text-[13px] font-medium text-white">El archivo abierto</p>
          </div>
          <div className={`${panel} vc-node vc-node-3`}>
            <Terminal className="mb-2 h-4 w-4 text-[#4ADE80]" />
            <p className="text-[13px] font-medium text-white">La terminal</p>
          </div>
        </div>
        <div className={`${panel} vc-node vc-node-4`}>
          <MessageSquare className="mb-3 h-4 w-4 text-[#4ADE80]" />
          <p className="text-[13px] font-medium text-white">El chat</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-[#7B818C]">con la IA</p>
        </div>
      </div>
    </div>
  )
}
