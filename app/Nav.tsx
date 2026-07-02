"use client";

// ============================================================================
// app/Nav.tsx — La navegación global de la plataforma.
//
// "use client" porque usa usePathname() para saber en qué sección estás y
// resaltar el enlace activo. Se monta en layout.tsx, así aparece en TODAS las
// páginas (Inicio, Herramientas, Mi Proyecto, etc.).
// ============================================================================

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";

const LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/herramientas", label: "Herramientas IA" },
  { href: "/proyecto", label: "Mi Proyecto" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link href="/" className="nav-marca">
          <span className="nav-marca-icono">
            <Sparkles size={17} strokeWidth={2} />
          </span>
          <span className="nav-marca-texto">Creative Coach OS</span>
        </Link>

        <div className="nav-links">
          {LINKS.map((l) => {
            // "/" solo se activa exacto; el resto, si la ruta empieza con su href
            // (así /resultado → /proyecto también resalta "Mi Proyecto").
            const activo =
              l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={"nav-link" + (activo ? " nav-link-activo" : "")}
                aria-current={activo ? "page" : undefined}
              >
                {l.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
