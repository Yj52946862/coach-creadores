// ============================================================================
// app/resultado/page.tsx — Redirección de compatibilidad.
//
// "Mi Proyecto" vive ahora en /proyecto. Antes vivía aquí (/resultado), así que
// dejamos esta redirección para que enlaces o marcadores viejos sigan llegando
// al lugar correcto, sin romper nada.
// ============================================================================

import { redirect } from "next/navigation";

export default function ResultadoRedirect() {
  redirect("/proyecto");
}
