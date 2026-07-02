// ============================================================================
// contexto.ts — Un ayudante chiquito y compartido.
//
// Varias herramientas mandan a la IA un "contexto" con lo esencial del plan
// (para personalizar el resultado). En vez de repetir ese recorte en cada
// componente, lo centralizamos aquí. Si no hay plan, devuelve null (la
// herramienta trabaja con el tema que escriba el usuario).
// ============================================================================

import type { Plan } from "./tipos";

export function contextoDePlan(plan?: Plan | null) {
  if (!plan) return null;
  return {
    diagnostico_resumen: plan.diagnostico_resumen,
    nicho: plan.nicho,
    plataforma_principal: plan.plataforma_principal,
  };
}
