// ============================================================================
// ListaGuion.tsx — Un guion mostrado como lista ordenada por tiempos.
//
// Reusado en los 3 lugares donde se muestra un guion (Mi Proyecto, Crear
// guion, Asistente primer video), en vez de repetir el mismo bloque de JSX
// tres veces. Antes el guion era un bloque de texto continuo con marcas de
// tiempo incrustadas ("[0-3s] ..."); ahora es una lista de segmentos.
// ============================================================================

import type { SegmentoGuion } from "@/lib/tipos";

// Nota: `segmentos` viene de datos que a veces llevan tiempo guardados en el
// navegador (localStorage). Un plan generado ANTES de que el guion pasara a
// ser una lista todavía puede tener `guion` como string plano — por eso se
// valida con Array.isArray() en vez de asumir la forma nueva a ciegas. Sin
// esto, un plan viejo guardado tumbaba TODA la página de Mi Proyecto.
export default function ListaGuion({
  segmentos,
}: {
  segmentos: SegmentoGuion[] | string | null | undefined;
}) {
  if (!segmentos) return null;
  if (!Array.isArray(segmentos)) {
    // Formato viejo (string plano) guardado antes de hoy: lo mostramos tal
    // cual en vez de romper, para no perder el contenido del usuario.
    return <p className="guion-texto">{segmentos}</p>;
  }
  if (segmentos.length === 0) return null;
  return (
    <ol className="lista-guion">
      {segmentos.map((s, i) => (
        <li key={i} className="guion-segmento">
          <span className="guion-tiempo">{s.tiempo}</span>
          <span className="guion-segmento-texto">{s.texto}</span>
        </li>
      ))}
    </ol>
  );
}

// Convierte un guion estructurado a texto plano de una línea por segmento,
// para guardarlo en "Mi Proyecto → Guardado" (que espera un string).
export function aplanarGuion(segmentos: SegmentoGuion[] | string | null | undefined): string {
  if (!segmentos) return "";
  if (!Array.isArray(segmentos)) return segmentos;
  return segmentos.map((s) => `[${s.tiempo}] ${s.texto}`).join("\n");
}
