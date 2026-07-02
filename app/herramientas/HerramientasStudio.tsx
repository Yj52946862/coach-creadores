"use client";

// ============================================================================
// HerramientasStudio.tsx — El estudio de herramientas de IA.
//
// Muestra una rejilla de tarjetas (una por herramienta) y, al elegir una, abre
// su panel debajo. Lee el plan de localStorage (si existe) para que las
// herramientas puedan personalizarse con el perfil de la persona. Reutiliza los
// mismos componentes que viven en Mi Proyecto (nada duplicado).
// ============================================================================

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Plan } from "@/lib/tipos";
import GeneradorIdeas from "../proyecto/GeneradorIdeas";
import CreadorGuion from "../proyecto/CreadorGuion";
import CreadorDescripcion from "../proyecto/CreadorDescripcion";
import RevisarContenido from "../proyecto/RevisarContenido";
import ImagenesCanal from "../proyecto/ImagenesCanal";
import {
  Lightbulb,
  FileText,
  AlignLeft,
  Search,
  ClipboardCheck,
  Image as ImageIcon,
  Palette,
  Link2,
  Sparkles,
  FolderKanban,
  type LucideIcon,
} from "lucide-react";

type Tool = {
  slug: string;
  nombre: string;
  desc: string;
  boton: string;
  Icono: LucideIcon;
  render: (plan: Plan | null) => React.ReactNode;
};

const TOOLS: Tool[] = [
  {
    slug: "ideas",
    nombre: "Ideas de contenido",
    desc: "Genera ideas para cualquier tema, nicho o plataforma.",
    boton: "Generar ideas",
    Icono: Lightbulb,
    render: (p) => <GeneradorIdeas plan={p} />,
  },
  {
    slug: "guion",
    nombre: "Crear guion",
    desc: "Convierte una idea en un guion listo para grabar.",
    boton: "Crear guion",
    Icono: FileText,
    render: (p) => <CreadorGuion plan={p} />,
  },
  {
    slug: "descripcion",
    nombre: "Crear descripción",
    desc: "Genera descripciones claras, atractivas y optimizadas.",
    boton: "Crear descripción",
    Icono: AlignLeft,
    render: (p) => <CreadorDescripcion plan={p} />,
  },
  {
    slug: "revisar-guion",
    nombre: "Revisar guion",
    desc: "Mejora claridad, retención, estructura y llamado a la acción.",
    boton: "Revisar guion",
    Icono: Search,
    render: (p) => <RevisarContenido plan={p} tipoInicial="Guion" />,
  },
  {
    slug: "revisar-descripcion",
    nombre: "Revisar descripción",
    desc: "Haz tu descripción más clara, comercial y atractiva.",
    boton: "Revisar descripción",
    Icono: ClipboardCheck,
    render: (p) => <RevisarContenido plan={p} tipoInicial="Descripción" />,
  },
  {
    slug: "miniaturas",
    nombre: "Miniaturas",
    desc: "Genera prompts e ideas visuales para miniaturas con mejor click.",
    boton: "Crear prompt visual",
    Icono: ImageIcon,
    render: (p) => <ImagenesCanal plan={p} tipoInicial="miniatura" />,
  },
  {
    slug: "branding",
    nombre: "Banner y perfil",
    desc: "Crea prompts para banner, foto de perfil y branding del canal.",
    boton: "Crear prompt visual",
    Icono: Palette,
    render: (p) => <ImagenesCanal plan={p} tipoInicial="perfil" />,
  },
  {
    slug: "drive",
    nombre: "Revisar desde Drive",
    desc: "Pega un enlace y recibe recomendaciones de mejora con IA.",
    boton: "Analizar desde Drive",
    Icono: Link2,
    render: (p) => <RevisarContenido plan={p} fuenteInicial="drive" />,
  },
];

export default function HerramientasStudio() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [activa, setActiva] = useState<string | null>(null);

  useEffect(() => {
    // Perfil (si existe) para personalizar las herramientas.
    try {
      const g = localStorage.getItem("plan");
      if (g) setPlan(JSON.parse(g));
    } catch {
      /* si el plan está corrupto, seguimos sin perfil */
    }
    // Enlace directo opcional: /herramientas?h=guion
    const h = new URLSearchParams(window.location.search).get("h");
    if (h && TOOLS.some((t) => t.slug === h)) setActiva(h);
  }, []);

  const tool = TOOLS.find((t) => t.slug === activa) ?? null;

  function elegir(slug: string) {
    setActiva(slug);
    requestAnimationFrame(() => {
      document
        .getElementById("panel-herramienta")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <main className="contenedor-ancho estudio">
      <header className="estudio-hero">
        <span className="hub-eyebrow">Herramientas IA</span>
        <h1>Tu estudio creativo</h1>
        <p className="hub-sub">
          Genera, revisa y mejora tu contenido con IA. Úsalas cuando quieras, sin
          llenar ningún formulario.
        </p>
      </header>

      {plan ? (
        <p className="estudio-perfil-nota">
          <Sparkles size={15} strokeWidth={1.9} /> Tienes un proyecto activo: las
          herramientas se pueden personalizar con tu perfil.
        </p>
      ) : (
        <Link href="/descubre" className="estudio-perfil-nota estudio-perfil-cta">
          <FolderKanban size={15} strokeWidth={1.9} /> ¿Quieres resultados a tu
          medida? Crea tu proyecto personalizado →
        </Link>
      )}

      <div className="tools-grid">
        {TOOLS.map((t) => (
          <button
            key={t.slug}
            className={"tool-card" + (activa === t.slug ? " tool-card-activa" : "")}
            onClick={() => elegir(t.slug)}
          >
            <span className="tool-card-icono">
              <t.Icono size={22} strokeWidth={1.75} />
            </span>
            <span className="tool-card-nombre">{t.nombre}</span>
            <span className="tool-card-desc">{t.desc}</span>
            <span className="tool-card-cta">{t.boton} →</span>
          </button>
        ))}
      </div>

      <div id="panel-herramienta" className="tool-panel">
        {tool ? (
          tool.render(plan)
        ) : (
          <div className="tarjeta tool-vacio">
            <p>Elige una herramienta de arriba para empezar.</p>
          </div>
        )}
      </div>
    </main>
  );
}
