"use client"

import { Compass, Zap } from "lucide-react"
import { FormacionPage, Hero, SectionHead, Section, Text, Toc, Closing, Muted } from "../formacion-kit"
import { ParteA } from "./parte-a"
import { ParteB } from "./parte-b"
import { ParteC } from "./parte-c"

/**
 * Entrenamiento 1 · Cómo funciona construir un software con IA.
 * Fuente: docs/sops/producto/ia-integrator/01-entrenamiento-1-como-funciona-todo.md
 */

const INDICE = [
  { id: "s0", n: "00", label: "Vocabulario", d: "Frontend, backend, UI, UX, base de datos, API y API key." },
  { id: "s1", n: "01", label: "Quién hace qué", d: "El reparto entre tú y la IA." },
  { id: "s2", n: "02", label: "Tu proyecto", d: "Es una carpeta, y eso tiene consecuencias." },
  { id: "s3", n: "03", label: "Herramientas", d: "El IDE, la terminal, tu chat y los MCPs." },
  { id: "s4", n: "04", label: "El viaje", d: "Los cuatro lugares por los que pasa tu código." },
  { id: "s5", n: "05", label: "La regla de oro", d: "Lo más importante de todo el entrenamiento." },
  { id: "s6", n: "06", label: "API keys", d: "Dónde se guardan y por qué nunca salen de ahí." },
  { id: "s7", n: "07", label: "Base de datos", d: "Lo único que no tiene marcha atrás." },
  { id: "s8", n: "08", label: "El sistema", d: "Por qué no se parte de cero." },
  { id: "s9", n: "09", label: "Las skills", d: "Las órdenes que ejecutan un procedimiento entero." },
  { id: "s10", n: "10", label: "El contexto", d: "Lo que la IA puede tener en la cabeza a la vez." },
  { id: "s11", n: "11", label: "Cómo construye", d: "El plan primero, el bucle después." },
  { id: "s12", n: "12", label: "Las reglas", d: "Las nueve que no se saltan." },
]

export function Entrenamiento1() {
  return (
    <FormacionPage label="Entrenamiento 1 · Cómo funciona todo">
      <Toc items={INDICE.map((i) => ({ id: i.id, label: i.label }))} />

      <Hero
        eyebrow="Entrenamiento 1"
        eyebrowIcon={Zap}
        lines={["Cómo funciona", "por dentro."]}
        lead={
          <>
            Construyes software hablándole a una IA. Tú dices qué quieres lograr; ella escribe el código, lo prueba y lo
            deja funcionando.
          </>
        }
        sub={
          <>
            Este entrenamiento explica cómo funciona eso por dentro.{" "}
            <span className="text-[#C7CBD1]">No vas a escribir código en ningún momento</span>, ni aquí ni después.
          </>
        }
      />

      <SectionHead label="Por qué necesitas entenderlo" />
      <Section>
        <Text>
          Porque <span className="font-medium text-white">tú vas a decidir qué se construye y qué sale a internet</span>.
          Para decidir bien tienes que saber dónde vive tu trabajo, qué es cada herramienta, y qué acciones no tienen
          vuelta atrás.
        </Text>

        <div className="grid gap-3 pt-4 sm:grid-cols-2">
          {INDICE.map((i, k) => (
            <a
              key={i.id}
              href={`#${i.id}`}
              data-reveal
              className="vc-card vc-reveal group relative overflow-hidden border border-[#1F2126] bg-[#131316] p-4 transition-colors hover:border-[#2f6b45]"
              style={{ transitionDelay: `${k * 35}ms` }}
            >
              <div className="flex items-baseline gap-3">
                <span className="text-[12px] font-semibold text-[#22C55E]" style={{ fontFamily: "var(--font-mono)" }}>
                  {i.n}
                </span>
                <div>
                  <p className="text-[15px] font-medium text-white">{i.label}</p>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-[#7B818C]">{i.d}</p>
                </div>
              </div>
              <span aria-hidden className="vc-corner" />
            </a>
          ))}
        </div>
        <Muted>
          <span className="inline-flex items-center gap-2">
            <Compass className="h-4 w-4 text-[#4ADE80]" /> El índice te sigue en el lateral mientras bajas.
          </span>
        </Muted>
      </Section>

      <ParteA />
      <ParteB />
      <ParteC />

      <Closing
        kicker="Siguiente paso"
        title={<>Entrenamiento 2 · Cómo usar el sistema</>}
        sub="Qué haces tú cada día: qué escribes, en qué orden y hasta dónde llega tu parte."
        cta={{ href: "/formacion/ia-integrator/entrenamiento-2", label: "Abrir el Entrenamiento 2" }}
      />
    </FormacionPage>
  )
}
