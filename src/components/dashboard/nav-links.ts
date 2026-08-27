export const NAV_LINKS = [
  { href: "/dashboard", label: "Resumen" },
  { href: "/reporte", label: "Reporte diario" },
  { href: "/portafolio", label: "Mi Portafolio" },
  { href: "/cartera-demo", label: "Cartera demo" },
  { href: "/chat", label: "Chat de inversión" },
  { href: "/screener", label: "Screener" },
  { href: "/watchlist", label: "Watchlist" },
  { href: "/aprende", label: "Aprende" },
  { href: "/creditos", label: "Créditos" },
  { href: "/ajustes", label: "Ajustes" },
];

/** Agrupado para el menú móvil (secciones plegables, estilo Yahoo Finance). */
export const NAV_SECTIONS = [
  {
    label: "Mercado",
    links: [
      { href: "/dashboard", label: "Resumen" },
      { href: "/reporte", label: "Reporte diario" },
      { href: "/screener", label: "Screener" },
      { href: "/watchlist", label: "Watchlist" },
    ],
  },
  {
    label: "Mi cuenta",
    links: [
      { href: "/portafolio", label: "Mi Portafolio" },
      { href: "/cartera-demo", label: "Cartera demo" },
      { href: "/chat", label: "Chat de inversión" },
      { href: "/creditos", label: "Créditos" },
      { href: "/ajustes", label: "Ajustes" },
    ],
  },
  {
    label: "Aprende",
    links: [
      { href: "/aprende", label: "Aprende" },
      { href: "/aprende/glosario", label: "Glosario" },
      { href: "/aprende/tutoriales", label: "Tutoriales" },
    ],
  },
];
