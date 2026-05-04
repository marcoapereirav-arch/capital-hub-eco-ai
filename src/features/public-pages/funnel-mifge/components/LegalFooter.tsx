import Link from "next/link"

/**
 * Footer obligatorio en /mifge/* con enlaces RGPD.
 * Sin esto Meta puede rechazar las ads en EU.
 */
export function LegalFooter() {
  return (
    <footer className="border-t border-[#2A2D34] bg-[#0B0B0E] py-8 px-6">
      <div className="container mx-auto max-w-5xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-[#6B7280] font-mono">
          <p>
            © {new Date().getFullYear()} Capital Hub · Adrián Villanueva
          </p>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 justify-center">
            <Link href="/legal/privacidad" className="hover:text-[#9CA3AF] transition-colors">
              Privacidad
            </Link>
            <Link href="/legal/terminos" className="hover:text-[#9CA3AF] transition-colors">
              Términos
            </Link>
            <Link href="/legal/cookies" className="hover:text-[#9CA3AF] transition-colors">
              Cookies
            </Link>
            <a href="mailto:adrian@mail.capitalhubapp.com" className="hover:text-[#9CA3AF] transition-colors">
              Contacto
            </a>
          </nav>
        </div>
      </div>
    </footer>
  )
}
