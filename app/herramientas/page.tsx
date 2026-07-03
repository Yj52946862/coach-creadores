// ============================================================================
// app/herramientas/page.tsx — El estudio de herramientas de IA.
//
// La página es un envoltorio delgado; toda la lógica (rejilla + panel) vive en
// HerramientasStudio, que es un client component (usa estado y localStorage).
// ============================================================================

import HerramientasStudio from "./HerramientasStudio";
import RequiereSesion from "../RequiereSesion";

export default function PaginaHerramientas() {
  return (
    <RequiereSesion>
      <HerramientasStudio />
    </RequiereSesion>
  );
}
