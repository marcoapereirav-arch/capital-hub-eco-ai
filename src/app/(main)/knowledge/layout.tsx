/**
 * Layout de la seccion Knowledge.
 *
 * El gate de auth+rol y el shell del OS (sidebar colapsable + botones) los pone
 * el layout PADRE `src/app/(main)/layout.tsx`. Aqui solo dejamos pasar el contenido.
 *
 * OJO: este layout envuelve TAMBIEN a `/knowledge/[slug]`, que es una pagina de
 * LECTURA y escritura larga. Antes ponia aqui `h-full overflow-hidden` para que el
 * cerebro 3D encajara en la pantalla, y ese recorte se comia el final del documento:
 * en el telefono no se llegaba ni al boton de guardar. El contenedor de altura fija
 * vive ahora en la pantalla del cerebro (`/knowledge/page.tsx`), que es la unica que
 * lo necesita.
 */
export default function KnowledgeLayout({ children }: { children: React.ReactNode }) {
  return <div className="h-full min-w-0">{children}</div>
}
