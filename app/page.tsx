// ============================================================================
// app/page.tsx — El HUB de inicio de la plataforma.
//
// Es un Server Component (no necesita estado ni "use client"): solo enlaces.
// Presenta los DOS caminos del producto:
//   A) Descubrir qué contenido crear  → /descubre  (el onboarding personalizado)
//   B) Usar herramientas de IA directo → /herramientas
// Y deja a la vista el acceso a "Mi Proyecto Personal" (/proyecto).
// ============================================================================

import Link from "next/link";
import {
  Compass,
  Wrench,
  ArrowRight,
  FolderKanban,
  Lightbulb,
  FileText,
  AlignLeft,
  Search,
  Image as ImageIcon,
  Sparkles,
} from "lucide-react";

// Vistazo de las herramientas (todas llevan al estudio /herramientas).
const HERRAMIENTAS_PREVIEW = [
  { icono: Lightbulb, nombre: "Ideas de contenido" },
  { icono: FileText, nombre: "Crear guion" },
  { icono: AlignLeft, nombre: "Crear descripción" },
  { icono: Search, nombre: "Revisar contenido" },
  { icono: ImageIcon, nombre: "Miniaturas y branding" },
  { icono: Sparkles, nombre: "Mejorar con IA" },
];

export default function Inicio() {
  return (
    <main className="contenedor-ancho hub">
      <section className="hub-hero">
        <span className="hub-eyebrow">Estás a punto de ser tendencia.</span>
        <h1>¿Por dónde quieres empezar hoy?</h1>
        <p className="hub-sub">
          Un coach con IA que te ayuda a descubrir qué crear y te da las
          herramientas para lograrlo. Elige tu camino.
        </p>
      </section>

      {/* Los dos caminos: la tarjeta es un enlace completo. */}
      <section className="hub-caminos">
        <Link href="/descubre" className="camino-card camino-primario">
          <span className="camino-icono">
            <Compass size={26} strokeWidth={1.75} />
          </span>
          <span className="camino-tag">Para empezar</span>
          <h2>Descubre tu contenido ideal</h2>
          <p>
            Responde unas preguntas y la IA analiza tus habilidades,
            personalidad e intereses para crearte un proyecto personalizado,
            paso a paso.
          </p>
          <span className="camino-cta">
            Encontrar mi camino <ArrowRight size={18} strokeWidth={2} />
          </span>
        </Link>

        <Link href="/herramientas" className="camino-card">
          <span className="camino-icono">
            <Wrench size={26} strokeWidth={1.75} />
          </span>
          <span className="camino-tag">Para quien ya crea</span>
          <h2>Usa las herramientas de IA</h2>
          <p>
            ¿Ya tienes una idea? Genera guiones, descripciones, ideas y prompts
            para tus miniaturas y branding, sin llenar ningún formulario.
          </p>
          <span className="camino-cta">
            Abrir herramientas <ArrowRight size={18} strokeWidth={2} />
          </span>
        </Link>
      </section>

      {/* Acceso visible a Mi Proyecto Personal. */}
      <Link href="/proyecto" className="hub-proyecto">
        <span className="hub-proyecto-icono">
          <FolderKanban size={22} strokeWidth={1.75} />
        </span>
        <span className="hub-proyecto-texto">
          <strong>Mi Proyecto Personal</strong>
          <span>Vuelve a tu diagnóstico, tu plan y todo lo que has guardado.</span>
        </span>
        <ArrowRight size={18} strokeWidth={2} className="hub-proyecto-flecha" />
      </Link>

      <section className="hub-herramientas">
        <h2 className="zona-titulo">Herramientas disponibles</h2>
        <div className="hub-herramientas-grid">
          {HERRAMIENTAS_PREVIEW.map(({ icono: Icono, nombre }) => (
            <Link
              href="/herramientas"
              className="hub-herramienta-chip"
              key={nombre}
            >
              <Icono size={18} strokeWidth={1.75} />
              {nombre}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
