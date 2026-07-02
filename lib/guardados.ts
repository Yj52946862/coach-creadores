// ============================================================================
// guardados.ts — "Guardar en mi proyecto" sin base de datos.
//
// Igual que el plan y el avance, los ítems que el usuario guarda (ideas,
// guiones, descripciones, títulos, hooks, prompts visuales) viven en
// localStorage, atados al navegador. Aquí están los ayudantes para leer,
// agregar y borrar. Todo es del lado del cliente (por eso revisamos `window`).
// ============================================================================

const CLAVE = "coach-guardados";

export interface ItemGuardado {
  id: string;
  tipo: string; // "Idea" | "Guion" | "Descripción" | "Título" | "Hook" | "Prompt visual"…
  titulo: string; // etiqueta corta para la lista
  contenido: string; // el cuerpo (puede tener varias líneas)
  fecha: number; // Date.now(), para ordenar
}

// Lee la lista guardada (o [] si no hay nada o está corrupta).
export function leerGuardados(): ItemGuardado[] {
  if (typeof window === "undefined") return [];
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (!crudo) return [];
    const datos = JSON.parse(crudo);
    return Array.isArray(datos) ? (datos as ItemGuardado[]) : [];
  } catch {
    return [];
  }
}

// Agrega un ítem al inicio y devuelve la lista nueva (para refrescar el estado).
export function agregarGuardado(
  item: Omit<ItemGuardado, "id" | "fecha">,
): ItemGuardado[] {
  const nuevo: ItemGuardado = {
    ...item,
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : String(Date.now() + Math.random()),
    fecha: Date.now(),
  };
  const lista = [nuevo, ...leerGuardados()];
  guardarLista(lista);
  return lista;
}

// Borra un ítem por id y devuelve la lista nueva.
export function borrarGuardado(id: string): ItemGuardado[] {
  const lista = leerGuardados().filter((i) => i.id !== id);
  guardarLista(lista);
  return lista;
}

function guardarLista(lista: ItemGuardado[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CLAVE, JSON.stringify(lista));
  } catch {
    // Si el almacenamiento está lleno o bloqueado, fallamos en silencio:
    // guardar es un extra, no debe romper la app.
  }
}
