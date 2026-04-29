"use client"

import React, { useEffect, useState } from 'react';
import Button from './Button';

const CHECKOUT_URL = "/lt8/checkout";

const COLLAGE_PHOTOS = [
  { src: "https://storage.googleapis.com/msgsndr/fPSTvVgtLrLaVpNFx8ix/media/6992fed51d5e04810f4b1096.jpg", alt: "Italia" },
  { src: "https://storage.googleapis.com/msgsndr/fPSTvVgtLrLaVpNFx8ix/media/6992fed26bac244bf3c25764.jpg", alt: "Con amigos en Italia" },
  { src: "https://storage.googleapis.com/msgsndr/fPSTvVgtLrLaVpNFx8ix/media/6992fed2a9efde40c49f05f7.jpg", alt: "100km en un día", label: "100km en un día 🏃 ↖" },
  { src: "https://storage.googleapis.com/msgsndr/fPSTvVgtLrLaVpNFx8ix/media/6992fed26bac245f73c25763.jpg", alt: "Bali" },
  { src: "https://storage.googleapis.com/msgsndr/fPSTvVgtLrLaVpNFx8ix/media/6992fed254da04624742c046.jpg", alt: "Croacia" },
  { src: "https://storage.googleapis.com/msgsndr/fPSTvVgtLrLaVpNFx8ix/media/6992fed51d5e04eb3f4b1065.jpg", alt: "Muay Thai", label: "Muay Thai 🥊 ↗" },
  { src: "https://storage.googleapis.com/msgsndr/fPSTvVgtLrLaVpNFx8ix/media/6992fed2a9efded4549f05fc.jpg", alt: "Mi madre", label: "Mi madre ❤️ ↖" },
  { src: "https://storage.googleapis.com/msgsndr/fPSTvVgtLrLaVpNFx8ix/media/6992fed51d5e045bd14b1078.jpg", alt: "Desde pequeño" },
];

export default function BioModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      document.body.classList.add('lt8-no-scroll');
    } else {
      document.body.classList.remove('lt8-no-scroll');
    }
    return () => document.body.classList.remove('lt8-no-scroll');
  }, [open]);

  // Cerrar con ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      {/* TRIGGER (sección en la página) */}
      <section id="bio" className="relative z-10 py-24 md:py-32 bg-[#111113] border-t border-b border-[#2A2D34]">
        <div className="container mx-auto px-6 text-center">
          <h3 className="title-font text-white uppercase text-2xl md:text-3xl mb-8 leading-tight">
            LA HABILIDAD QUE ME DIO LA LIBERTAD
          </h3>
          <button
            onClick={() => setOpen(true)}
            className="font-mono uppercase tracking-wider text-xs px-8 py-4 bg-white text-black rounded-[2px] hover:bg-[#E5E5E5] transition-colors"
          >
            Ver la historia de Adrián
          </button>
        </div>
      </section>

      {/* MODAL */}
      <div className={`lt8-modal ${open ? 'open' : ''}`}>
        <div className="lt8-modal-backdrop" onClick={() => setOpen(false)} />
        <div className="lt8-modal-window">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="lt8-modal-close"
            aria-label="Cerrar"
          >
            ✕
          </button>

          <div className="container mx-auto">
            <div className="bio-container">

              {/* Left: Title + Photos */}
              <div className="w-full">
                <h3 className="title-font text-white uppercase text-2xl mb-8 leading-tight">
                  LA HABILIDAD QUE ME DIO LA LIBERTAD
                </h3>

                <div className="bio-collage-container">
                  {COLLAGE_PHOTOS.map((photo, i) => (
                    <div key={i} className="collage-item">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo.src} alt={photo.alt} className="collage-img" loading="lazy" />
                      {photo.label && (
                        <span className="casual-label label-left">{photo.label}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Historia */}
              <div className="w-full text-left">
                <p className="bio-text-large">Me llamo Adrián.</p>
                <p className="bio-text-large">Y hace unos años estaba jodido. Pero jodido de verdad.</p>
                <p className="bio-text-normal">Tenía 21 años. Había pasado 4 años montando negocios que fracasaron. Agencia de marketing. Consultoría. Eventos. Criptomonedas.</p>
                <p className="bio-text-normal">Había vuelto a casa de mi madre. La había dejado con la novia. Y tenía una deuda de 4.000€ que no sabía cómo coño iba a pagar.</p>
                <p className="bio-text-normal">Vengo de una familia de clase baja. Mi madre limpiaba casas. Mi padre era camarero. Nunca tuvimos casa en propiedad. El coche era un Opel Corsa heredado de mi abuelo.</p>
                <p className="bio-text-large">Y nadie —absolutamente nadie— me enseñó cómo funcionaba el dinero.</p>
                <p className="bio-text-large">Pero yo siempre supe que quería algo más.</p>
                <p className="bio-text-large">El problema era que no tenía ni puta idea de cómo llegar ahí.</p>

                <hr className="bio-divider" />

                <p className="bio-text-large">Entonces descubrí las profesiones digitales.</p>
                <p className="bio-text-normal">Tenía un amigo que trabajaba de esto. Ganaba muy bien. Desde casa. Sin jefes.</p>
                <p className="bio-text-normal">Y pensé: &ldquo;Aquí puedo aprender una habilidad que se paga bien, meterme en una empresa en días, y empezar a cobrar. Sin montar nada. Sin riesgo.&rdquo;</p>
                <p className="bio-text-large">Aprendes. Das el servicio. Te pagan.</p>
                <p className="bio-text-large">Dejé el trabajo en diciembre. En enero gané 4.000€.</p>
                <p className="bio-text-large">Casi 4 veces más de lo que ganaba. En 30 días. Desde casa.</p>

                <hr className="bio-divider" />

                <p className="bio-text-normal">No porque fuera especial. Sino porque tenía una habilidad que el mercado pagaba bien.</p>
                <p className="bio-text-normal">Hoy vivo en Dubai. Tiro una piedra desde mi terraza y llega al mar.</p>
                <p className="bio-text-normal">Entreno cuando quiero. Como fuera todos los días. Me fui 48 horas a España al bautizo de mi primita. Ida y vuelta. He llevado a mi madre a Roma y a Praga.</p>
                <p className="bio-text-large">Yo decido qué hago. Y luego diseño mi día alrededor de eso.</p>

                <hr className="bio-divider" />

                <p className="bio-text-large">No te voy a prometer que te vas a hacer millonario.</p>
                <p className="bio-text-normal">Pero sí te puedo decir lo que me pasó a mí:</p>
                <p className="bio-text-normal">Pasé de 1.150€ al mes en una inmobiliaria a 4.000€ desde casa. En 30 días.</p>
                <p className="bio-text-normal">Y ese cambio —pasar de un sueldo que no controlas a ganar el doble o el triple desde tu casa, sin fichar— es el cambio de paradigma más grande que he vivido.</p>
                <p className="bio-text-large">No fue hacerme rico.</p>
                <p className="bio-text-large">Fue dejar de depender.</p>
                <p className="bio-text-normal">Y esa es mi intención para ti con Capital Hub, para que puedas:</p>

                <ul className="bio-list">
                  <li className="bio-list-item">
                    <span className="bio-arrow">→</span>
                    <span>Dejar de depender de un sueldo que no controlas.</span>
                  </li>
                  <li className="bio-list-item">
                    <span className="bio-arrow">→</span>
                    <span>Aprender una habilidad que las empresas están demandando.</span>
                  </li>
                  <li className="bio-list-item">
                    <span className="bio-arrow">→</span>
                    <span>Empezar a diseñar un estilo de vida flexible, en tus propios términos.</span>
                  </li>
                </ul>

                <div className="bio-btn-container">
                  <Button text="EMPEZAR AHORA" href={CHECKOUT_URL} variant="green" size="md" className="w-full md:w-auto" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
