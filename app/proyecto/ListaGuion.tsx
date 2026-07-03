// ============================================================================
// ListaGuion.tsx — Un guion mostrado como lista ordenada por tiempos.
//
// Reusado en los 3 lugares donde se muestra un guion (Mi Proyecto, Crear
// guion, Asistente primer video), en vez de repetir el mismo bloque de JSX
// tres veces. Antes el guion era un bloque de texto continuo con marcas de
// tiempo incrustadas ("[0-3s] ..."); ahora es una lista de segmentos.
// ============================================================================

import type { SegmentoGuion } from "@/lib/tipos";

export default function ListaGuion({ segmentos }: { segmentos: SegmentoGuion[] }) {
  if (!segmentos || segmentos.length === 0) return null;
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
export function aplanarGuion(segmentos: SegmentoGuion[]): string {
  return (segmentos ?? [])
    .map((s) => `[${s.tiempo}] ${s.texto}`)
    .join("\n");
}
