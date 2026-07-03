// ============================================================================
// app/Footer.tsx — Pie de página global.
//
// Server Component (no necesita estado): copyright + enlaces legales. Se monta
// en layout.tsx junto a <Nav />, así aparece en TODAS las páginas.
// ============================================================================

import Link from "next/link";

export default function Footer() {
  const anio = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="footer-inner">
        <span className="footer-copy">© {anio} YoTrend. Todos los derechos reservados.</span>
        <nav className="footer-links">
          <Link href="/privacidad">Política de Privacidad</Link>
          <Link href="/terminos">Términos de Servicio</Link>
        </nav>
      </div>
    </footer>
  );
}
