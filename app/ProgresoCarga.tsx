"use client";

// ============================================================================
// ProgresoCarga.tsx — Indicador de avance para cuando la IA está "pensando".
//
// La API no nos da un avance real (la llamada es opaca), así que mostramos un
// porcentaje que sube y se va frenando cerca del 96%. No es exacto: es para que
// la persona vea que la página NO se trabó. Al terminar, el componente se quita.
// ============================================================================

import { useEffect, useState } from "react";

export default function ProgresoCarga({ mensaje }: { mensaje: string }) {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    let p = 0;
    const id = setInterval(() => {
      // Sube rápido al inicio y se desacelera hacia 96% (nunca llega a 100
      // hasta que de verdad termina y el componente desaparece).
      p = Math.min(96, p + Math.max(0.5, (96 - p) * 0.035));
      setPct(Math.round(p));
    }, 320);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="progreso" role="status" aria-live="polite">
      <div className="progreso-top">
        <span className="spinner" aria-hidden="true" />
        <span className="progreso-msg">{mensaje}</span>
        <span className="progreso-pct">{pct}%</span>
      </div>
      <div className="progreso-pista">
        <div className="progreso-relleno" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
