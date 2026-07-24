"use client"

import {
  Users, UserPlus, KeyRound, GitBranch, ArrowDownToLine, Megaphone, GitPullRequest,
  Database, GitFork, Laptop, Cloud, Rocket, ShieldCheck, FolderTree, Play,
} from "lucide-react"
import {
  FormacionPage, Hero, SectionHead, Section, Lead, Text, Muted, Cards, Steps, Timeline,
  Rules, Quote, Warn, Code, Mono, Toc, Closing, NodeLine,
} from "./formacion-kit"

/**
 * Entrenamiento 3 · Trabajar en equipo.
 * Fuente: docs/sops/producto/ia-integrator/03-entrenamiento-3-trabajar-en-equipo.md
 */

const INDICE = [
  { id: "e3s1", label: "Lo que cambia" },
  { id: "e3s2", label: "Cómo está montado" },
  { id: "e3s3", label: "Alguien nuevo" },
  { id: "e3s4", label: "Su primer día" },
  { id: "e3s5", label: "El día a día" },
  { id: "e3s6", label: "Conflictos" },
  { id: "e3s7", label: "Evitar chocar" },
  { id: "e3s8", label: "Revisar antes" },
  { id: "e3s9", label: "Las reglas" },
]

export function Entrenamiento3() {
  return (
    <FormacionPage label="Entrenamiento 3 · Trabajar en equipo">
      <Toc items={INDICE} />

      <Hero
        eyebrow="Entrenamiento 3"
        eyebrowIcon={Users}
        lines={["Trabajar", "en equipo."]}
        lead="Cuando en tu proyecto va a trabajar más de una persona. Si trabajas solo, no lo necesitas."
        sub="Antes de esto, los Entrenamientos 1 y 2."
      />

      {/* ───────── 1 · LO QUE CAMBIA ───────── */}
      <SectionHead id="e3s1" n="01" label="Lo que cambia" />
      <Section>
        <Lead>Nada de lo que aprendiste cambia. Se añaden dos cosas.</Lead>
        <Cards
          cols={2}
          items={[
            { icon: ArrowDownToLine, t: "Antes de trabajar", d: "Te bajas lo que hayan subido los demás." },
            { icon: Megaphone, t: "Cuando terminas", d: "Avisas al equipo de que has subido algo." },
          ]}
        />
        <Quote>
          Cada uno trabaja en su ordenador, en su rama, y publica lo suyo. Sin pedir permiso a nadie.
        </Quote>
      </Section>

      {/* ───────── 2 · CÓMO ESTÁ MONTADO ───────── */}
      <SectionHead id="e3s2" n="02" label="Cómo está montado" />
      <Section>
        <NodeLine
          nodes={[
            { icon: Laptop, t: "Ana", d: "El proyecto entero en su ordenador." },
            { icon: Cloud, t: "GitHub", d: "El proyecto oficial. El punto de encuentro." },
            { icon: Laptop, t: "Luis", d: "El proyecto entero en el suyo." },
          ]}
        />
        <Muted>
          Cada persona tiene el proyecto entero en su ordenador. No comparten carpeta: se comunican solo a través de
          GitHub.
        </Muted>
      </Section>

      {/* ───────── 3 · METER A ALGUIEN NUEVO ───────── */}
      <SectionHead id="e3s3" n="03" label="Meter a alguien nuevo" />
      <Section>
        <Lead>Lo hace el dueño. Dos cosas.</Lead>

        <div className="pt-2">
          <Cards
            cols={2}
            items={[
              { icon: UserPlus, t: "Invitarla en GitHub", d: "Para que pueda entrar en el proyecto oficial." },
              { icon: KeyRound, t: "Pasarle las claves", d: "Porque no viajan con el proyecto, a propósito." },
            ]}
          />
        </div>

        <div className="pt-10">
          <Lead>1 · Invitarla en GitHub.</Lead>
          <Steps
            items={[
              { t: "Entras en tu proyecto en GitHub", d: "El repositorio oficial." },
              { t: "Settings, luego Collaborators, luego «Add people»", d: "Es la sección de gente con acceso." },
              { t: "Escribes su usuario o su correo y das a Add", d: "Le llega un correo con la invitación." },
              { t: "Ella la acepta", d: "Y ya tiene acceso al proyecto." },
            ]}
          />
        </div>

        <div className="pt-10">
          <Lead>2 · Pasarle las claves.</Lead>
          <Warn title="Los archivos de claves no están en GitHub">
            <p>
              <Mono>.env.local</Mono> y <Mono>.mcp.json</Mono> están excluidos a propósito. Consecuencia: cuando se baje
              el proyecto, no le va a arrancar. No está roto, le faltan las claves.
            </p>
          </Warn>
          <Cards
            cols={2}
            items={[
              {
                icon: ShieldCheck,
                t: "Cómo se las pasas",
                d: "Por un gestor de contraseñas: Dashlane, 1Password o Bitwarden.",
              },
              {
                icon: Database,
                t: "Qué le pasas exactamente",
                d: (
                  <>
                    El contenido de tus dos archivos, <Mono>.env.local</Mono> y <Mono>.mcp.json</Mono>.
                  </>
                ),
              },
            ]}
          />
          <Warn title="Nunca por chat, correo ni WhatsApp">
            Ahí quedan guardadas para siempre.
          </Warn>
        </div>
      </Section>

      {/* ───────── 4 · EL PRIMER DÍA ───────── */}
      <SectionHead id="e3s4" n="04" label="El primer día de la persona nueva" />
      <Section>
        <Lead>Hace el setup, pero solo hasta la mitad.</Lead>
        <Text>
          El proyecto <span className="font-medium text-white">ya existe</span>. Ella no lo crea: se une a uno que está
          hecho. Todo lo que crea cosas nuevas se lo salta.
        </Text>
        <div className="grid gap-4 md:grid-cols-2">
          <div data-reveal className="vc-reveal border border-[#24462F] bg-[#101710] p-6">
            <p className="mb-3 text-[13px] font-medium uppercase tracking-[0.1em] text-[#4ADE80]">Sí hace</p>
            <ul className="space-y-2 text-[15px] leading-relaxed text-[#C7CBD1]">
              <li>Instalar el IDE</li>
              <li>Instalar el chat de la IA (la extensión)</li>
              <li>Crear su cuenta de la IA</li>
              <li>Crear su cuenta de GitHub</li>
            </ul>
          </div>
          <div data-reveal className="vc-reveal border border-[#2A2D34] bg-[#131316] p-6" style={{ transitionDelay: "80ms" }}>
            <p className="mb-3 text-[13px] font-medium uppercase tracking-[0.1em] text-[#7B818C]">No hace</p>
            <ul className="space-y-2 text-[15px] leading-relaxed text-[#9CA3AF]">
              <li>Crear un proyecto nuevo</li>
              <li>
                <Mono>/new-ecoai</Mono>, <Mono>/visual-knowledge</Mono>, <Mono>/add-login</Mono>
              </li>
              <li>Crear una base de datos</li>
              <li>Conectar un servicio de publicación</li>
            </ul>
          </div>
        </div>

        <div className="pt-12 space-y-12">
          <Paso
            n="1"
            titulo="Descarga el proyecto"
            icono={FolderTree}
            cuerpo={
              <>
                <p>
                  Crea una carpeta vacía donde quiera guardar el proyecto, la abre en el IDE, abre el chat y escribe
                  esto.
                </p>
                <Code>{`Clona en esta carpeta el repositorio
https://github.com/USUARIO/NOMBRE-DEL-PROYECTO
y deja el proyecto listo para trabajar.`}</Code>
                <p>
                  El dueño le pasa ese enlace: se copia de la barra del navegador estando dentro del proyecto en GitHub.
                  La IA descarga todos los archivos e instala lo que el proyecto necesita para funcionar.
                </p>
              </>
            }
          />
          <Paso
            n="2"
            titulo="Pone las claves"
            icono={KeyRound}
            cuerpo={
              <>
                <p>El proyecto ya está en su ordenador, pero todavía no arranca. Le faltan las claves.</p>
                <Code>{`Crea los archivos .env.local y .mcp.json con los nombres
de las claves que necesita este proyecto, y dejalos vacios.`}</Code>
                <p>La IA crea los dos archivos con los nombres y los huecos en blanco, así:</p>
                <Code>{`SUPABASE_URL=
SUPABASE_KEY=
RESEND_KEY=`}</Code>
                <p>
                  Entonces ella abre esos dos archivos y pega los valores que el dueño le pasó por el gestor de
                  contraseñas, cada uno detrás de su nombre.
                </p>
                <Warn title="Los valores los pega ella a mano">
                  No se los da a la IA por el chat. Si los pega en el chat, quedan guardados en el historial.
                </Warn>
              </>
            }
          />
          <Paso
            n="3"
            titulo="Arranca el proyecto"
            icono={Play}
            cuerpo={
              <>
                <Code>{`Arranca el proyecto y dime la direccion exacta con el puerto.`}</Code>
                <p>
                  La IA enciende la web dentro de su ordenador y le devuelve una dirección tipo{" "}
                  <Mono>http://localhost:3000</Mono>. Ella la abre en su navegador: si la web carga, ya está dentro y
                  puede trabajar. Si sale un error, lo copia y lo pega en el chat, y la IA lo arregla.
                </p>
                <p>
                  A partir de ahí: abre un chat, escribe <Mono>/primer</Mono>, y a trabajar.
                </p>
              </>
            }
          />
        </div>
      </Section>

      {/* ───────── 5 · EL DÍA A DÍA ───────── */}
      <SectionHead id="e3s5" n="05" label="El día a día" />
      <Section>
        <Lead>Cada persona, cada vez que se sienta a trabajar.</Lead>
        <Timeline
          items={[
            { t: "Abre el IDE en la carpeta del proyecto", d: "La del proyecto, no la madre." },
            { t: "Abre un chat", d: "Uno. Nunca dos." },
            { t: <>Escribe: <span className="text-[#4ADE80]">&quot;bájate lo último del proyecto y déjalo listo&quot;</span></>, d: "Este es el paso que no se puede saltar." },
            { t: <><Mono>/primer</Mono></>, d: "Y ya está lista para trabajar." },
            { t: "Trabaja igual que si estuviera sola", d: "Dice su objetivo, aprueba el plan, la IA construye en una rama, ella lo mira en su ordenador." },
            { t: <><Mono>/publicar</Mono> y <Mono>/cerrar</Mono></>, d: "En ese orden." },
            { t: "Avisa al equipo", d: "«Subí X, bajaos lo último». Es lo que evita que el siguiente choque." },
          ]}
        />
        <Warn title="El paso 3 es el que no se puede saltar">
          <p>
            Trae lo que los demás hayan subido desde la última vez. Si no lo haces, construyes sobre una versión vieja y
            chocas al subir lo tuyo.
          </p>
          <p className="mt-2">
            Va con &quot;déjalo listo&quot; a propósito: si alguien añadió algo nuevo al proyecto, con bajarse el código
            no basta. Hay que instalarlo, y así la IA lo hace en el mismo paso.
          </p>
        </Warn>
        <Muted>
          Qué hace <Mono>/publicar</Mono>: une tu rama con <Mono>main</Mono>, lo sube a GitHub, y comprueba que tu web ya
          está sirviendo tu código nuevo. Es el mismo camino de siempre: tu rama pasa por <Mono>main</Mono>, y de{" "}
          <Mono>main</Mono> sale a la web. No hay atajos.
        </Muted>
      </Section>

      {/* ───────── 6 · CONFLICTOS ───────── */}
      <SectionHead id="e3s6" n="06" label="Cuando dos tocan lo mismo" />
      <Section>
        <Lead>Dos personas cambian la misma línea del mismo archivo. Eso es un conflicto.</Lead>
        <Cards
          items={[
            { icon: GitBranch, t: "Cuándo aparece", d: "Al bajarte lo último o al publicar. No mientras escribes." },
            { icon: ShieldCheck, t: "No se pierde nada", d: "El trabajo de los dos está guardado. Las dos versiones existen." },
            { icon: GitFork, t: "Lo resuelve el que llega segundo", d: "Y no lo resuelves tú a mano." },
          ]}
        />
        <Code label="Lo único que escribes">{`Hay un conflicto, resuelvelo.`}</Code>
        <Muted>La IA mira las dos versiones y decide. Si hay algo que solo tú puedes decidir, te pregunta.</Muted>
      </Section>

      {/* ───────── 7 · CÓMO EVITAR CHOCAR ───────── */}
      <SectionHead id="e3s7" n="07" label="Cómo evitar chocar" />
      <Section>
        <Lead>Cada persona en una parte distinta de la aplicación.</Lead>
        <Code label="Reparto por zonas">{`Ana   ->  cobros
Luis  ->  calendario`}</Code>
        <Muted>
          Hay archivos que son de todos (el menú, la configuración). Ahí sí se choca aunque el reparto sea bueno. Si vas
          a tocar uno, avisa antes.
        </Muted>

        <div className="pt-10">
          <Lead>Y la base de datos es una sola.</Lead>
          <Cards
            items={[
              { icon: Laptop, t: "Ana en su ordenador", d: "Conectada a la de verdad." },
              { icon: Laptop, t: "Luis en el suyo", d: "A la misma." },
              { icon: Database, t: "La web publicada", d: "También. Es una sola para todos." },
            ]}
          />
          <Warn title="Si uno borra o cambia datos, se los cambia a todos">
            Y a los usuarios de la web. Al instante y sin marcha atrás. Añadir cosas nuevas es seguro: borrar o cambiar
            lo que existe se avisa antes.
          </Warn>
        </div>
      </Section>

      {/* ───────── 8 · REVISAR ANTES DE PUBLICAR ───────── */}
      <SectionHead id="e3s8" n="08" label="Si quieres que alguien revise antes de publicar" />
      <Section>
        <Lead>Opcional. No hace falta para trabajar en equipo.</Lead>
        <Text>
          En vez de publicar directamente, subes tu rama a GitHub y abres un{" "}
          <span className="font-medium text-white">Pull Request</span>: un botón que dice &quot;he terminado, ¿lo
          metemos?&quot;. GitHub le enseña al otro qué líneas cambiaste. Cuando aprueba, tu trabajo entra en{" "}
          <Mono>main</Mono> y sale a la web igual que siempre.
        </Text>
        <Cards
          cols={2}
          items={[
            {
              icon: GitPullRequest,
              t: "Cuándo tiene sentido",
              d: "Cobros, cuentas de usuario, datos de clientes. O alguien nuevo del que aún no sabes cómo trabaja.",
            },
            {
              icon: Rocket,
              t: "Cuándo no",
              d: "El día a día, con gente que se conoce y cada uno en su zona.",
            },
          ]}
        />
      </Section>

      {/* ───────── 9 · LAS REGLAS DEL EQUIPO ───────── */}
      <SectionHead id="e3s9" n="09" label="Las reglas del equipo" />
      <Section>
        <Rules
          items={[
            { t: "Cada persona, su ordenador y su rama" },
            { t: "Bájate lo último cada vez que te sientes a trabajar" },
            { t: "Avisa cuando subas algo" },
            { t: "Avisa antes de tocar la base de datos", d: "Es la misma para todos y no tiene marcha atrás." },
            { t: "Avisa antes de tocar un archivo que use todo el mundo" },
          ]}
        />
      </Section>

      {/* ───────── EL RECORRIDO COMPLETO ───────── */}
      <SectionHead label="El recorrido completo" />
      <Section>
        <div className="grid gap-4 md:grid-cols-2">
          <div data-reveal className="vc-reveal border border-[#2A2D34] bg-[#131316] p-6">
            <p className="mb-4 text-[12px] font-medium uppercase tracking-[0.12em] text-[#7B818C]">
              Una vez, al entrar alguien nuevo
            </p>
            <p className="mb-2 text-[15px] leading-relaxed text-[#C7CBD1]">
              <span className="text-white">El dueño:</span> la invita en GitHub, le pasa las claves.
            </p>
            <p className="text-[15px] leading-relaxed text-[#C7CBD1]">
              <span className="text-white">Ella:</span> setup a medias, clona, pone las claves, arranca.
            </p>
          </div>
          <div data-reveal className="vc-reveal border border-[#24462F] bg-[#101710] p-6" style={{ transitionDelay: "80ms" }}>
            <p className="mb-4 text-[12px] font-medium uppercase tracking-[0.12em] text-[#4ADE80]">Cada día</p>
            <p className="text-[15px] leading-relaxed text-[#C7CBD1]" style={{ fontFamily: "var(--font-mono)" }}>
              &quot;bájate lo último&quot; → /primer → trabaja → lo prueba → /publicar → /cerrar → avisa
            </p>
          </div>
        </div>
      </Section>

      <Closing
        kicker="Has terminado los tres entrenamientos"
        title={<>Ya sabes cómo funciona, cómo se usa y cómo se comparte.</>}
        sub="Lo siguiente es el setup: instalar tus herramientas, crear tus cuentas y levantar tu proyecto por primera vez."
        cta={{ href: "/formacion/ia-integrator", label: "Volver a la formación" }}
      />
    </FormacionPage>
  )
}

/* ───────────────────── Paso del primer día ───────────────────── */
function Paso({
  n,
  titulo,
  icono: Icono,
  cuerpo,
}: {
  n: string
  titulo: string
  icono: typeof KeyRound
  cuerpo: React.ReactNode
}) {
  return (
    <div data-reveal className="vc-reveal">
      <div className="mb-3 flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#2A2D34] text-[13px] font-semibold text-[#4ADE80]">
          {n}
        </span>
        <Icono className="h-5 w-5 text-[#4ADE80]" />
        <h3 className="text-xl font-medium text-white" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
          {titulo}
        </h3>
      </div>
      <div className="space-y-3 border-l border-[#1F2126] pl-5 text-[15px] leading-relaxed text-[#9CA3AF]">{cuerpo}</div>
    </div>
  )
}
