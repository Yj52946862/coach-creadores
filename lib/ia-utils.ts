// ============================================================================
// ia-utils.ts — Utilidades compartidas por las rutas que llaman a Claude.
// (Antes vivían dentro de generar-plan/route.ts; las movimos aquí para que el
// asistente las reutilice sin duplicar código.)
// ============================================================================

import Anthropic from "@anthropic-ai/sdk";

// Workaround: en producción (Vercel, Fluid Compute) existe un global
// `EdgeRuntime` aunque la función corra en Node.js, y NO se puede tocar (es de
// solo lectura). El SDK de Anthropic usa ese global tal cual dentro de un
// header (`X-Stainless-Arch: other:${EdgeRuntime}`), y si trae algun caracter
// fuera del rango ByteString (0 a 255), el `Headers` nativo lo rechaza al
// CONSTRUIRLO (TypeError: ByteString) — tumbando CADA llamada casi al
// instante, antes de tocar la red. Ni pasar `defaultHeaders` al cliente ni
// parchear el modulo interno del SDK sirven: lo primero llega tarde (el SDK
// arma y valida ese header antes de leer los headers por defecto) y lo
// segundo no sobrevive el bundling de Turbopack (cada entrypoint se lleva su
// propia copia del modulo, asi que parchear "nuestra" copia no afecta la que
// usa el SDK — confirmado reproduciendo el bug en local con el dev server
// real antes de este fix). Lo unico verdaderamente compartido, sin importar
// como empaquete Turbopack el codigo, es el `Headers` nativo del runtime: es
// un global del lenguaje, no un modulo de node_modules. Lo parcheamos para
// que descarte silenciosamente los caracteres fuera de rango en vez de
// crashear — no cambia nada para valores normales (ASCII), solo evita el
// crash en este caso puntual. El rango se arma con códigos numéricos (0 a
// 255) en vez de un caracter literal, para no depender de la codificación
// del archivo fuente.
const CODIGO_MAXIMO_BYTESTRING = 255;
if (typeof Headers !== "undefined") {
  const original = Headers.prototype.append;
  Headers.prototype.append = function (name: string, value: string) {
    let limpio = value;
    for (let i = 0; i < limpio.length; i++) {
      if (limpio.charCodeAt(i) > CODIGO_MAXIMO_BYTESTRING) {
        limpio = limpio
          .split("")
          .filter((c) => c.charCodeAt(0) <= CODIGO_MAXIMO_BYTESTRING)
          .join("");
        break;
      }
    }
    return original.call(this, name, limpio);
  };
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
