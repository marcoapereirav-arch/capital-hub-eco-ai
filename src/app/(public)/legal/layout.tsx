import "@/features/public-pages/funnel-lt8/styles.css"
import { LegalFooter } from "@/features/public-pages/funnel-mifge/components/LegalFooter"

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="funnel-lt8-root relative min-h-screen bg-[#0F0F12] text-white overflow-x-hidden">
      <main className="container mx-auto max-w-3xl px-6 py-16 md:py-24">
        <div className="prose prose-invert prose-sm md:prose-base max-w-none
          prose-headings:font-serif prose-headings:uppercase prose-headings:tracking-wide
          prose-h1:text-3xl md:prose-h1:text-4xl prose-h1:mb-8
          prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4
          prose-h3:text-base prose-h3:mt-6 prose-h3:mb-2
          prose-p:text-[#D1D5DB] prose-p:leading-relaxed
          prose-li:text-[#D1D5DB] prose-li:leading-relaxed
          prose-a:text-white prose-a:underline
          prose-strong:text-white">
          {children}
        </div>
      </main>
      <LegalFooter />
    </div>
  )
}
