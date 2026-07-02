// ============================================================================
// ia-utils.ts — Utilidades compartidas por las rutas que llaman a Claude.
// (Antes vivían dentro de generar-plan/route.ts; las movimos aquí para que el
// asistente las reutilice sin duplicar código.)
// ============================================================================

import Anthropic from "@anthropic-ai/sdk";

// Workaround: en producción (Vercel, Fluid Compute) existe un global
// `EdgeRuntime` aunque la función corra en Node.js. El SDK de Anthropic lo usa
// tal cual dentro de un header (`X-Stainless-Arch: other:${EdgeRuntime}`), y
// si ese valor trae algún carácter fuera de Latin-1, el `Headers` nativo lo
// rechaza al construirlo (TypeError: ByteString) — tumbando CADA llamada casi
// al instante, antes de tocar la red. No hay forma de arreglarlo pasando
// `defaultHeaders` al cliente: el SDK arma y valida ese header antes de leer
// los headers por defecto. Ocultamos el global ANTES de crear el cliente para
// que el SDK tome su rama normal de detección de Node. Confirmado que sigue
// sin arreglarse en la versión más nueva del SDK (0.109.1) al momento de
// escribir esto.
try {
  const g = globalThis as { EdgeRuntime?: unknown };
  if (typeof g.EdgeRuntime !== "undefined") {
    g.EdgeRuntime = undefined;
  }
} catch {
  // Best-effort: si por lo que sea no se puede tocar, seguimos igual.
}

// Un único cliente de Anthropic para todas las rutas (lee ANTHROPIC_API_KEY
// de las variables de entorno automáticamente).
export const anthropic = new Anthropic();

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
