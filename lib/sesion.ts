// ============================================================================
// sesion.ts — Login ligero, sin base de datos.
//
// No es autenticación real: no hay contraseña, no hay servidor que verifique
// nada. Es solo un "quién eres" (nombre + correo) que se guarda en el
// navegador, para poder personalizar y para que avanzar a las herramientas
// se sienta como entrar a un espacio propio. Mismo patrón que
// lib/guardados.ts: todo en localStorage, con guardas para "use client".
// ============================================================================

const CLAVE = "yotrend-sesion";

export interface Sesion {
  nombre: string;
  correo: string;
}

// Lee la sesión guardada (o null si no hay, está corrupta, o está incompleta).
export function leerSesion(): Sesion | null {
  if (typeof window === "undefined") return null;
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (!crudo) return null;
    const datos = JSON.parse(crudo);
    if (
      datos &&
      typeof datos.nombre === "string" &&
      datos.nombre.trim() &&
      typeof datos.correo === "string" &&
      datos.correo.trim()
    ) {
      return datos as Sesion;
    }
    return null;
  } catch {
    return null;
  }
}

// Valida (ligero, solo UX) y guarda. Devuelve false si algo obligatorio falta.
export function guardarSesion(s: Sesion): boolean {
  const nombre = s.nombre.trim();
  const correo = s.correo.trim();
  if (!nombre || !/^\S+@\S+\.\S+$/.test(correo)) return false;
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(CLAVE, JSON.stringify({ nombre, correo }));
    window.dispatchEvent(new Event("sesion-cambio"));
    return true;
  } catch {
    return false;
  }
}

export function cerrarSesion(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(CLAVE);
    window.dispatchEvent(new Event("sesion-cambio"));
  } catch {
    // silencioso, igual que el resto de los helpers de localStorage.
  }
}
