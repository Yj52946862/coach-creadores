"use client";

// ============================================================================
// GuardarBoton.tsx — "Guardar en mi proyecto".
//
// Botón reutilizable que guarda un resultado (idea, guion, prompt…) en
// localStorage (ver lib/guardados.ts) y muestra una confirmación breve. Lo usan
// todas las herramientas para que puedas coleccionar lo que te sirvió.
// ============================================================================

import { useState } from "react";
import { agregarGuardado } from "@/lib/guardados";
import { Bookmark, Check } from "lucide-react";

export default function GuardarBoton({
  tipo,
  titulo,
  contenido,
}: {
  tipo: string;
  titulo: string;
  contenido: string;
}) {
  const [guardado, setGuardado] = useState(false);

  function guardar() {
    agregarGuardado({ tipo, titulo, contenido });
    setGuardado(true);
    // Se emite un evento para que "Mi Proyecto" refresque su lista si está abierto.
    window.dispatchEvent(new Event("guardados-cambio"));
    setTimeout(() => setGuardado(false), 2200);
  }

  return (
    <button
      type="button"
      className="boton boton-secundario guardar-boton"
      onClick={guardar}
      disabled={guardado}
    >
      {guardado ? (
        <>
          <Check size={15} strokeWidth={2} /> Guardado en tu proyecto
        </>
      ) : (
        <>
          <Bookmark size={15} strokeWidth={2} /> Guardar en mi proyecto
        </>
      )}
    </button>
  );
}
