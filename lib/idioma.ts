// ============================================================================
// idioma.ts — El idioma en que la IA genera TODO su contenido.
//
// Importante: esto NO traduce la interfaz de la app (botones, textos del
// wizard, etc.) — eso sería un proyecto de i18n completo aparte (necesitaría
// una librería como next-intl + archivos de traducción por idioma, y
// probablemente soporte RTL para árabe). La interfaz sigue en español fijo.
// Este selector solo controla el idioma del CONTENIDO GENERADO POR IA (planes,
// ideas, guiones, descripciones, revisiones) — que es lo que de verdad importa
// al usuario final.
// ============================================================================

export const IDIOMAS = [
  { codigo: "es", nombre: "Español" },
  { codigo: "en", nombre: "English" },
  { codigo: "pt", nombre: "Português" },
  { codigo: "hi", nombre: "हिन्दी" },
  { codigo: "id", nombre: "Bahasa Indonesia" },
  { codigo: "tl", nombre: "Filipino" },
  { codigo: "vi", nombre: "Tiếng Việt" },
  { codigo: "ar", nombre: "العربية" },
  { codigo: "tr", nombre: "Türkçe" },
  { codigo: "fr", nombre: "Français" },
] as const;

export type CodigoIdioma = (typeof IDIOMAS)[number]["codigo"];

const NOMBRES: Record<CodigoIdioma, string> = {
  es: "español",
  en: "inglés",
  pt: "portugués",
  hi: "hindi",
  id: "indonesio",
  tl: "filipino (tagalo)",
  vi: "vietnamita",
  ar: "árabe",
  tr: "turco",
  fr: "francés",
};

// Devuelve el nombre legible del idioma para mostrar en la UI (ej. en el
// wizard: "vas a crear en Español"). Cae a "Español" si el código no existe.
export function nombreIdioma(codigo: string): string {
  const match = IDIOMAS.find((i) => i.codigo === codigo);
  return match?.nombre ?? "Español";
}

// La instrucción que se inyecta al FINAL de cada system prompt de IA. Va al
// final a propósito: las instrucciones más recientes pesan más para el
// modelo. Acepta cualquier string (no solo CodigoIdioma) porque el body de
// una ruta API siempre es `unknown` hasta parsearlo — si llega un código
// desconocido o vacío, cae a español sin que la ruta tenga que validarlo.
export function instruccionIdioma(codigo: string): string {
  const nombre = NOMBRES[codigo as CodigoIdioma] ?? NOMBRES.es;
  return (
    `IDIOMA OBLIGATORIO: responde ÚNICAMENTE en ${nombre}. Todo el contenido ` +
    `generado (títulos, guiones, descripciones, consejos, y cualquier texto ` +
    `libre del schema) debe estar en ${nombre} de principio a fin. Nunca ` +
    `mezcles idiomas ni dejes fragmentos en otro idioma, salvo nombres ` +
    `propios de apps o plataformas que no se traducen (ej. "TikTok", ` +
    `"CapCut").`
  );
}

const CLAVE = "yotrend-idioma";

export function leerIdioma(): CodigoIdioma {
  if (typeof window === "undefined") return "es";
  try {
    const crudo = localStorage.getItem(CLAVE);
    return IDIOMAS.some((i) => i.codigo === crudo)
      ? (crudo as CodigoIdioma)
      : "es";
  } catch {
    return "es";
  }
}

export function guardarIdioma(codigo: CodigoIdioma): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CLAVE, codigo);
    window.dispatchEvent(new Event("idioma-cambio"));
  } catch {
    // silencioso, igual que el resto de los helpers de localStorage.
  }
}
