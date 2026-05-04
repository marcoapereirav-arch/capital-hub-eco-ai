import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="relative bg-[#0F0F12] text-white pt-16 md:pt-24 pb-12 border-t border-[#2A2D34]">
      <div className="container mx-auto px-6">

        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-12 md:mb-20 border-b border-[#2A2D34] pb-12">
            <div className="md:col-span-4">
                 <h4 className="font-serif text-2xl mb-6 tracking-[0.15em]">CAPITAL HUB</h4>
                 <div className="space-y-4 font-mono text-sm text-[#6B7280]">
                     <p>¿Tienes dudas?</p>
                     <p className="text-white">+34 623 600 094</p>
                     <a href="mailto:adrian@mail.capitalhubapp.com" className="text-white hover:text-[#9CA3AF] transition-colors block">adrian@mail.capitalhubapp.com</a>
                 </div>
            </div>

            <div className="md:col-span-8">
                 <h5 className="font-mono text-xs text-[#6B7280] mb-4 uppercase">Sobre lo que ofrecemos</h5>
                 <div className="text-[11px] text-[#4B5563] space-y-4 leading-relaxed text-justify columns-1 md:columns-2 gap-8">
                    <p>Capital Hub es una plataforma de formación en profesiones digitales con acceso a una bolsa de empleo real. Todo nuestro contenido tiene fines educativos e informativos.</p>
                    <p>Los resultados que puedas obtener dependen de muchos factores: tu punto de partida, tu dedicación, el tiempo que inviertas y tu capacidad de aplicar lo aprendido. Por eso, aunque ponemos todo de nuestra parte para darte las mejores herramientas, no podemos prometer resultados específicos ni ingresos concretos. Cada persona es diferente y cada camino también.</p>
                    <p>Las cifras que mencionamos en esta página son ejemplos reales pero ilustrativos. Sirven para que entiendas el potencial del mercado, no como garantía de lo que tú vas a ganar.</p>
                    <p>Lo que sí te garantizamos es la calidad de la formación. Si accedes al contenido y no estás satisfecho, tienes 30 días para pedir un reembolso completo. Sin complicaciones.</p>
                    <p>Los testimonios que aparecen reflejan experiencias de personas reales, pero son individuales. Lo que a ellos les funcionó puede no ser exactamente igual para ti.</p>
                    <p>Nada de lo que encuentres aquí sustituye el asesoramiento de un profesional legal, fiscal o financiero. Antes de tomar decisiones importantes, consulta con quien corresponda.</p>
                    <p>Al registrarte en Capital Hub, aceptas que las decisiones que tomes y los resultados que obtengas son tu responsabilidad.</p>
                    <p>Los precios pueden cambiar sin previo aviso. Algunas ofertas incluyen servicios de suscripción con cargos recurrentes. Revisa siempre los detalles antes de comprar.</p>
                 </div>
            </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center text-[#4B5563] text-xs font-mono gap-4">
             <p className="text-center md:text-left">Este producto es propiedad de Adrián Villanueva & Capital Hub.</p>
             <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center">
                <span>© {new Date().getFullYear()}</span>
                <span>|</span>
                <Link href="/legal/privacidad" className="hover:text-white transition-colors">Privacidad</Link>
                <span>|</span>
                <Link href="/legal/terminos" className="hover:text-white transition-colors">Términos</Link>
                <span>|</span>
                <Link href="/legal/cookies" className="hover:text-white transition-colors">Cookies</Link>
             </div>
        </div>

      </div>
    </footer>
  );
}
