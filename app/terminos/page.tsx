// ============================================================================
// app/terminos/page.tsx — Términos de Servicio.
//
// Server Component, contenido estático. No es asesoría legal formal, ver
// aviso al final.
// ============================================================================

import Link from "next/link";

export default function Terminos() {
  return (
    <main className="contenedor legal-pagina">
      <Link href="/" className="enlace-volver">
        ← Volver al inicio
      </Link>

      <h1>Términos de Servicio</h1>
      <p className="legal-fecha">Última actualización: {new Date().toLocaleDateString("es", { year: "numeric", month: "long" })}</p>

      <h2>Qué es YoTrend</h2>
      <p>
        YoTrend es una herramienta que usa inteligencia artificial para
        ayudarte a descubrir qué contenido crear y generar materiales de apoyo
        (ideas, guiones, descripciones, conceptos visuales) para tu proyecto de
        creador de contenido. Es gratuita mientras esté en esta etapa.
      </p>

      <h2>El contenido generado por IA</h2>
      <p>
        Las respuestas, planes, guiones e ideas que genera YoTrend son creados
        por un modelo de inteligencia artificial y pueden contener errores o
        imprecisiones. Úsalos como punto de partida, no como verdad absoluta.
        Eres responsable de revisar y adaptar el contenido antes de publicarlo,
        y de cumplir las reglas de cada plataforma donde publiques.
      </p>

      <h2>Uso permitido</h2>
      <p>
        Puedes usar YoTrend para tu propio proyecto de creación de contenido.
        No debes usar la herramienta para generar contenido ilegal, dañino,
        difamatorio o que infrinja derechos de terceros.
      </p>

      <h2>Sin garantías</h2>
      <p>
        YoTrend se ofrece "tal cual", sin garantía de resultados específicos
        (como crecimiento de audiencia o ingresos). El plan es una guía
        orientativa basada en la información que tú proporcionas.
      </p>

      <h2>Cambios</h2>
      <p>
        Estos términos pueden actualizarse conforme la herramienta evolucione.
        La versión vigente es siempre la publicada en esta página.
      </p>

      <h2>Aviso importante</h2>
      <p className="legal-aviso">
        Este texto es una plantilla razonable para el estado actual del
        producto, no una asesoría legal formal. Si este producto crece o
        empieza a cobrar, se recomienda una revisión legal profesional antes
        de escalar.
      </p>
    </main>
  );
}
