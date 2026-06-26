/**
 * DEPRECADO — no renderiza nada.
 *
 * El header de sección (trigger del sidebar + título + campana) ahora vive en
 * una barra superior ÚNICA y global: <TopBar> (src/features/shell/components/top-bar.tsx),
 * montada una sola vez en (main)/layout.tsx. Así el chrome superior es idéntico y
 * coherente en TODAS las secciones, y su línea inferior se alinea con la del sidebar.
 *
 * Se mantiene este componente como no-op para no romper las páginas/CrmTabsHeader
 * que todavía lo invocan con `title`. El título lo deriva <TopBar> de la ruta.
 */
export function ShellHeader(_props: { title: string }) {
  return null
}
