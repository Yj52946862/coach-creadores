// ============================================================================
// ia-utils.ts — Utilidades compartidas por las rutas que llaman a Claude.
// (Antes vivían dentro de generar-plan/route.ts; las movimos aquí para que el
// asistente las reutilice sin duplicar código.)
// ============================================================================

import Anthropic from "@anthropic-ai/sdk";

// Convierte el texto de Claude en objeto. El prompt pide JSON puro, pero por si
// acaso viene envuelto en markdown o con texto alrededor, nos quedamos con el
// primer bloque { ... } y lo parseamos.
export function extraerJSON(texto: string): unknown {
  try {
    return JSON.parse(texto);
  } catch {
    const inicio = texto.indexOf("{");
    const fin = texto.lastIndexOf("}");
    if (inicio !== -1 && fin > inicio) {
      return JSON.parse(texto.slice(inicio, fin + 1));
    }
    throw new Error("La respuesta del modelo no era JSON válido.");
  }
}

// Traduce los errores de la API a algo claro para la persona.
export function mensajeDeError(error: unknown): string {
  if (error instanceof Anthropic.APIError) {
    const status = error.status;
    if (status === 401) {
      return "Tu API key parece inválida. Revísala en el archivo .env.local.";
    }
    if (status === 400 && /credit|balance|saldo/i.test(error.message)) {
      return "Tu cuenta de Anthropic no tiene saldo. Agrega crédito en console.anthropic.com e intenta de nuevo.";
    }
    if (status === 429) {
      return "Hay demasiadas solicitudes ahora mismo. Espera unos segundos e intenta de nuevo.";
    }
    if (status === 529) {
      return "El servicio de Claude está saturado. Intenta de nuevo en un minuto.";
    }
    return `La API de Claude respondió con un error (${status ?? "desconocido"}). Intenta de nuevo.`;
  }
  return "No se pudo generar la respuesta. Revisa la consola del servidor.";
}
