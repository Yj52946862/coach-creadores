// ============================================================================
// herramientas.ts — Links OFICIALES de las apps/herramientas.
//
// La IA recomienda herramientas por NOMBRE; aquí ponemos el link correcto.
// Nunca dejamos que la IA invente URLs (es donde más alucina links rotos). Si
// no conocemos la herramienta, caemos a una búsqueda de Google (segura).
// ============================================================================

// Clave normalizada (minúsculas, sin acentos ni espacios) -> link oficial.
const REGISTRO: Record<string, string> = {
  tiktok: "https://www.tiktok.com",
  instagram: "https://www.instagram.com",
  ig: "https://www.instagram.com",
  youtube: "https://www.youtube.com",
  youtubestudio: "https://studio.youtube.com",
  facebook: "https://www.facebook.com",
  capcut: "https://www.capcut.com",
  canva: "https://www.canva.com",
};

function normalizar(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize("NFD") // separa las letras de sus acentos
    .replace(/[̀-ͯ]/g, "") // quita los acentos
    .replace(/[^a-z0-9]/g, ""); // quita espacios y símbolos
}

// Devuelve el link de descarga: oficial si la conocemos, o una búsqueda segura.
export function linkDescarga(nombre: string): { url: string; oficial: boolean } {
  const clave = normalizar(nombre);

  // 1) Match exacto (ej. "TikTok" -> "tiktok").
  if (REGISTRO[clave]) return { url: REGISTRO[clave], oficial: true };

  // 2) Match por inclusión (ej. "CapCut (editor de video)" contiene "capcut").
  for (const conocida of Object.keys(REGISTRO)) {
    if (clave.includes(conocida)) {
      return { url: REGISTRO[conocida], oficial: true };
    }
  }

  // 3) Fallback seguro: una búsqueda, nunca una URL inventada.
  return {
    url: "https://www.google.com/search?q=descargar+" + encodeURIComponent(nombre),
    oficial: false,
  };
}
