"use client";

// ============================================================================
// app/Nav.tsx — La navegación global de la plataforma.
//
// "use client" porque usa usePathname() para saber en qué sección estás y
// resaltar el enlace activo. Se monta en layout.tsx, así aparece en TODAS las
// páginas (Inicio, Herramientas, Mi Proyecto, etc.).
// ============================================================================

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import LogoYoTrend from "./LogoYoTrend";
import { leerSesion, cerrarSesion, type Sesion } from "@/lib/sesion";
import { IDIOMAS, leerIdioma, guardarIdioma, type CodigoIdioma } from "@/lib/idioma";
import { LogOut } from "lucide-react";

const LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/herramientas", label: "Herramientas IA" },
  { href: "/proyecto", label: "Mi Proyecto" },
];

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [idioma, setIdioma] = useState<CodigoIdioma>("es");

  // Se relee en cada navegación (por si cambia de ruta con sesión distinta) y
  // cada vez que RequiereSesion guarda/borra la sesión en la MISMA página
  // (ese caso no cambia la URL, así que un cambio de pathname no bastaría).
  useEffect(() => {
    setSesion(leerSesion());
    const refrescar = () => setSesion(leerSesion());
    window.addEventListener("sesion-cambio", refrescar);
    return () => window.removeEventListener("sesion-cambio", refrescar);
  }, [pathname]);

  useEffect(() => {
    setIdioma(leerIdioma());
  }, []);

  function salir() {
    cerrarSesion();
    setSesion(null);
    router.push("/");
  }

  function cambiarIdioma(codigo: CodigoIdioma) {
    guardarIdioma(codigo);
    setIdioma(codigo);
  }

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link href="/" className="nav-marca">
          <span className="nav-marca-icono">
            <LogoYoTrend size={17} />
          </span>
          <span className="nav-marca-texto">YoTrend</span>
        </Link>

        <div className="nav-derecha">
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

          <div className="nav-extras">
            <select
              aria-label="Idioma del contenido generado por IA"
              className="nav-idioma"
              value={idioma}
              onChange={(e) => cambiarIdioma(e.target.value as CodigoIdioma)}
            >
              {IDIOMAS.map((i) => (
                <option key={i.codigo} value={i.codigo}>
                  {i.nombre}
                </option>
              ))}
            </select>
            {sesion && (
              <button
                type="button"
                className="nav-salir"
                onClick={salir}
                title={`Salir de la sesión de ${sesion.nombre}`}
              >
                <LogOut size={14} strokeWidth={2} />
                <span className="nav-salir-texto">Salir</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
