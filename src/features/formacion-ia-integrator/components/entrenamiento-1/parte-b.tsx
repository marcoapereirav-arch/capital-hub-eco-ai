"use client"

import {
  Laptop, GitBranch, Cloud, Globe, Save, Upload, Download, GitMerge,
  FolderTree, ShieldCheck, FileCode, Ban, KeyRound, Zap,
} from "lucide-react"
import {
  SectionHead, Section, Lead, Text, Muted, Cards, Steps, Timeline, Quote, Warn, Code, Mono, Split, NodeLine, Flow,
} from "../formacion-kit"

/** Entrenamiento 1 · secciones 4 a 6: el viaje del código, la regla de oro y las API keys. */
export function ParteB() {
  return (
    <>
      {/* ───────── 4 · EL VIAJE DE TU CÓDIGO ───────── */}
      <SectionHead id="s4" n="04" label="El viaje de tu código" />
      <Section>
        <Lead>Tu código pasa por cuatro lugares, siempre en el mismo orden.</Lead>
        <NodeLine
          nodes={[
            { icon: Laptop, t: "localhost", d: "Tu web dentro de tu ordenador. Pruebas. Solo tú." },
            { icon: GitBranch, t: "rama", d: "Una versión aparte, para no tocar lo que ya funciona." },
            { icon: Cloud, t: "GitHub", d: "Tu proyecto en internet, con todo su historial." },
            { icon: Globe, t: "producción", d: "Tu web pública. La ve todo el mundo." },
          ]}
        />
        <Flow steps={["tu ordenador", "internet"]} />

        <div className="pt-10 space-y-10">
          <Detalle
            n="1"
            titulo="Localhost"
            cuerpo={
              <>
                <p>
                  Tu web corriendo dentro de tu ordenador. Se abre en el navegador en una dirección tipo{" "}
                  <Mono>localhost:3000</Mono>. Solo la ves tú: nadie más puede entrar aunque le pases el enlace. Sirve
                  para construir y probar sin consecuencias.
                </p>
                <p>
                  Ese número del final es el <span className="text-white">puerto</span>: identifica a qué programa de tu
                  ordenador va cada conexión. Puedes tener varias webs corriendo a la vez y cada una usa un puerto
                  distinto. Si el 3000 está ocupado, se abre en el 3001. Por eso conviene pedirle la dirección a la IA en
                  vez de escribirla de memoria.
                </p>
              </>
            }
          />
          <Detalle
            n="2"
            titulo="Rama"
            cuerpo={
              <>
                <p>
                  Una versión paralela de tu proyecto donde se trabaja sin tocar la que ya funciona. La versión buena se
                  llama <Mono>main</Mono>: mientras trabajas en la rama, <Mono>main</Mono> sigue exactamente igual. Si
                  sale mal, se descarta la rama y no ha pasado nada.
                </p>
                <p>
                  Se usa para algo nuevo, grande o delicado (cobros, cuentas de usuario, datos). Para un texto o un color
                  no hace falta. <span className="text-white">Lo decide la IA. Tú no tienes que pedirlo.</span>
                </p>
              </>
            }
          />
          <Detalle
            n="3"
            titulo="GitHub"
            cuerpo={
              <>
                <p>
                  Tu carpeta está en tu ordenador. GitHub tiene una copia de esa carpeta en internet, con todo su
                  historial. Sirve para tres cosas: es tu copia de seguridad, es de donde se publica tu web, y es el
                  punto de encuentro si trabajan varias personas.
                </p>
                <Code label="La misma estructura en los dos sitios">{`TU ORDENADOR              GITHUB
   main                     main       <- las dos versiones de lo mismo
   rama "cobros"            (vacio)    <- hasta que subes tu rama`}</Code>
                <Quote>El main de GitHub tiene que estar siempre igual o más nuevo que tu web. Nunca más viejo.</Quote>
              </>
            }
          />
          <Detalle
            n="4"
            titulo="Producción"
            cuerpo={
              <>
                <p>
                  Tu web pública. Para que funcione hay que conectar un servicio de publicación a tu GitHub: vigila tu
                  proyecto y publica tu web cada vez que cambia. Se conecta una sola vez, en el setup, y no lo tocas más.
                </p>
                <Steps
                  items={[
                    { t: "GitHub avisa al servicio de publicación", d: "En cuanto algo entra en main." },
                    { t: "Tu web se compila", d: "Montar tu web con todas sus piezas antes de servirla. Tarda entre 2 y 4 minutos." },
                    { t: "Tu web pública sirve el código nuevo", d: "Ya está live para todo el mundo." },
                  ]}
                />
                <Quote>
                  Si la compilación falla, tu web no se toca. Sigue funcionando como antes. Un error de código no puede
                  tumbar tu web.
                </Quote>
              </>
            }
          />
        </div>

        <div className="pt-14">
          <Lead>Las 4 palabras del viaje.</Lead>
          <Text>
            Tú nunca las vas a escribir. Pero cuando la IA te diga que hizo una, tienes que saber qué acaba de pasar.
          </Text>
          <Cards
            cols={2}
            items={[
              {
                icon: Save,
                t: "commit · guardar",
                d: "Guarda el estado de tu proyecto en ese momento, con una nota de qué cambió. Queda en tu ordenador, solo ahí. Un commit no está publicado.",
              },
              {
                icon: Upload,
                t: "push · subir a GitHub",
                d: "Manda a GitHub lo que has guardado. Hasta que no se hace push, tu trabajo no tiene copia de seguridad y no puede publicarse.",
              },
              {
                icon: Download,
                t: "pull · bajar de GitHub",
                d: "Lo contrario: trae a tu ordenador lo que haya en GitHub. Lo necesitas si trabajan varias personas, o si usas dos ordenadores.",
              },
              {
                icon: GitMerge,
                t: "merge · unir la rama con main",
                d: "Coge lo que hiciste en tu rama y lo mete en main.",
              },
            ]}
          />
          <Warn title="Merge y push no son lo mismo">
            <p>
              El merge une tu rama con <Mono>main</Mono> y ocurre en tu ordenador: no sale nada. El push sube{" "}
              <Mono>main</Mono> a GitHub, y ese es el que publica.
            </p>
            <p className="mt-2">
              Cuando publicas, la IA hace los dos seguidos, por eso parece una sola acción. Pero si algún día algo
              &quot;no aparece&quot; en tu web, la causa casi siempre es esta: se hizo el merge y no el push.
            </p>
          </Warn>
        </div>
      </Section>

      {/* ───────── 5 · LA REGLA DE ORO ───────── */}
      <SectionHead id="s5" n="05" label="La regla de oro" />
      <Section>
        <div data-reveal className="vc-reveal mb-10 border border-[#24462F] bg-[#101710] p-8 md:p-10">
          <Zap className="mb-5 h-7 w-7 text-[#4ADE80]" />
          <p
            className="text-2xl font-medium leading-snug text-white md:text-[2.4rem]"
            style={{ fontFamily: "'Inter Tight', sans-serif" }}
          >
            Una ventana del IDE. Una carpeta. Una rama.{" "}
            <span className="text-[#22C55E]">Un chat.</span>
          </p>
          <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-[#9CA3AF]">
            Es lo más importante de todo el entrenamiento. Saltártelo no da error: mezcla tu trabajo por dentro y no te
            enteras hasta días después.
          </p>
        </div>

        <Text>
          Los archivos de tu carpeta son los de la rama activa. Cuando se cambia de rama, esos archivos se reemplazan por
          los de la otra rama. Solo hay un juego de archivos: el de la rama que esté puesta. Por eso una carpeta solo
          puede tener una rama a la vez.
        </Text>
        <Muted>
          Mucha gente cree que la rama vive en el chat. No: vive en la carpeta. Todos los chats que abras ahí trabajan
          sobre los mismos archivos.
        </Muted>

        <div className="pt-10">
          <Lead>Qué pasa si abres dos chats en la misma carpeta.</Lead>
          <Timeline
            items={[
              { t: "El chat 1 trabaja en la rama «cobros»", d: "Todo normal, de momento." },
              {
                t: "En el chat 2 le pides otra cosa y cambia a la rama «calendario»",
                d: "Los archivos de la carpeta pasan a ser los de calendario.",
              },
              {
                t: "El chat 1 no se enteró",
                d: "Sigue creyendo que está en cobros. Todo lo que escriba se guarda en calendario.",
              },
              {
                t: "La rama de calendario acaba con código de cobros dentro",
                d: "Nadie lo nota hasta que algo revienta días después.",
              },
            ]}
          />
        </div>

        <div className="pt-14">
          <Lead>Si necesitas hacer dos cosas a la vez.</Lead>
          <Text>Lo normal es que no lo necesites: termina una, publícala, empieza la otra.</Text>
          <Cards
            cols={2}
            items={[
              {
                icon: FolderTree,
                t: "Si de verdad lo necesitas",
                d: "Se lo pides a la IA y ella prepara una carpeta de trabajo aparte, conectada al mismo proyecto. Tú no la copias a mano: la crea ella, y cuando terminas, la borra.",
              },
              {
                icon: Ban,
                t: "Esto no es duplicar tu proyecto",
                d: "Duplicarlo tú a mano es lo que está prohibido. Lo que hace la IA es abrir una segunda vista del mismo proyecto, no una copia suelta.",
              },
            ]}
          />
        </div>

        <Warn title="Nunca guardes tu proyecto en una nube que sincroniza sola">
          iCloud, Drive o Dropbox duplican, renombran y a veces corrompen archivos sin avisar. Acabas con dos carpetas
          parecidas y un día abres la que no toca. Tu proyecto va en una carpeta normal de tu ordenador: la copia de
          seguridad la hace GitHub.
        </Warn>
      </Section>

      {/* ───────── 6 · API KEYS ───────── */}
      <SectionHead id="s6" n="06" label="Tus API keys y dónde se guardan" />
      <Section>
        <Lead>Tu código necesita las keys para funcionar. Pero tu código viaja.</Lead>
        <Text>
          Sube a GitHub, se comparte, se descarga. Si la key está escrita dentro del código, viaja con él. La solución es
          la <span className="font-medium text-white">variable de entorno</span>: un dato que vive fuera del código, en
          un archivo aparte, y que tu programa va a buscar cuando arranca.
        </Text>

        <Split
          left={{
            t: "Mal · la key dentro del código",
            body: (
              <>
                <p className="text-[#C7CBD1]" style={{ fontFamily: "var(--font-mono)" }}>
                  conectar_a_stripe(&quot;sk_live_ESTO_ES_UN_EJEMPLO...&quot;)
                </p>
                <p>Esa línea está en un archivo de tu carpeta. Sube a GitHub con la key dentro.</p>
              </>
            ),
          }}
          right={{
            t: "Bien · la key fuera del código",
            body: (
              <>
                <p className="text-[#C7CBD1]" style={{ fontFamily: "var(--font-mono)" }}>
                  conectar_a_stripe(STRIPE_KEY)
                </p>
                <p>
                  Aquí <Mono>STRIPE_KEY</Mono> no es la key: es su nombre. Una etiqueta que dice &quot;ve a buscar el
                  valor guardado con este nombre&quot;.
                </p>
              </>
            ),
          }}
        />

        <div className="pt-6">
          <Text>Y el valor de verdad vive en un archivo aparte que nunca sube a GitHub.</Text>
          <Code label=".env.local">{`STRIPE_KEY=sk_live_ESTO_ES_UN_EJEMPLO_NO_UNA_KEY
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5...
RESEND_KEY=re_8fH2kL9mNp...`}</Code>
          <Muted>
            Resultado: tu código puede ir a donde sea, porque no lleva ninguna key dentro. Solo lleva los nombres.
          </Muted>
        </div>

        <div className="pt-10">
          <Lead>Tu proyecto tiene dos archivos con claves.</Lead>
          <Cards
            cols={2}
            items={[
              { icon: FileCode, t: ".env.local", d: "Las keys que usa tu web." },
              { icon: KeyRound, t: ".mcp.json", d: "Las keys que usa la IA para entrar en tus herramientas." },
            ]}
          />
          <Muted>En el setup vas a pegar claves en los dos. Los dos se protegen igual: nunca suben a GitHub.</Muted>
        </div>

        <div className="pt-10">
          <Lead>Cómo te protege el sistema: tres capas ya puestas.</Lead>
          <Steps
            items={[
              {
                t: "Los dos archivos están excluidos desde el primer día",
                d: "Hay una lista de lo que nunca sube a GitHub, y los dos están en ella desde antes de que escribas la primera línea.",
              },
              {
                t: "La IA tiene prohibido leer su contenido",
                d: "Puede comprobar que una key existe, pero no puede ver su valor. Así no acaba escrita en el historial de un chat.",
              },
              {
                t: "El proyecto trae un archivo de ejemplo",
                d: "Con los nombres y los valores vacíos, para que sepas qué keys necesitas.",
              },
            ]}
          />
        </div>

        <Warn title="Lo único que te toca a ti: no sacar las keys de sus archivos">
          <p>Ni a un chat, ni a un correo, ni a un mensaje. Tampoco a la IA.</p>
          <p className="mt-2">
            Si una key llega a GitHub, cualquiera entra en tu cuenta de ese servicio. Y queda registrada en el historial,
            así que borrarla del archivo no basta: hay que pedir una nueva y cambiarla en todos lados.
          </p>
        </Warn>
        <div className="mt-2 flex items-center gap-2 text-[13px] text-[#6B7280]">
          <ShieldCheck className="h-4 w-4 text-[#4ADE80]" />
          Las tres capas ya vienen puestas. Tú no configuras nada.
        </div>
      </Section>
    </>
  )
}

/* ───────────────────── Bloque de detalle numerado ───────────────────── */
function Detalle({ n, titulo, cuerpo }: { n: string; titulo: string; cuerpo: React.ReactNode }) {
  return (
    <div data-reveal className="vc-reveal">
      <div className="mb-3 flex items-center gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#2A2D34] text-[13px] font-semibold text-[#4ADE80]">
          {n}
        </span>
        <h3 className="text-xl font-medium text-white" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
          {titulo}
        </h3>
      </div>
      <div className="space-y-3 border-l border-[#1F2126] pl-[15px] text-[15px] leading-relaxed text-[#9CA3AF]">
        {cuerpo}
      </div>
    </div>
  )
}
