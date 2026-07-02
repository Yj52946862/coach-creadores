// ============================================================================
// app/api/imagenes/route.ts — "Imágenes de tu canal".
//
// Recibe el tipo de imagen, el contexto del plan y (opcional) una imagen de
// referencia en base64 que Claude SÍ puede analizar (visión). Devuelve concepto
// + medidas + prompt para un generador. Corre solo en el servidor.
// ============================================================================

import type Anthropic from "@anthropic-ai/sdk";
import { PROMPT_IMAGENES } from "@/lib/prompt-imagenes";
import { anthropic, extraerJSON, mensajeDeError } from "@/lib/ia-utils";

// Sin esto, Vercel corta la función a los 10s por defecto (Hobby) y esta
// llamada (Opus + thinking adaptativo, a veces con imagen) puede tardar más.
// 60 es el máximo del plan Hobby.
export const maxDuration = 60;

const ETIQUETAS: Record<string, string> = {
  perfil: "Foto de perfil / Logo del canal",
  banner: "Banner / Portada del canal",
  marca_agua: "Marca de agua del canal",
  miniatura: "Miniatura / Thumbnail de un video",
  branding: "Branding visual del canal (identidad, paleta y estilo)",
};

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      {
        error:
          "Falta la ANTHROPIC_API_KEY. Pégala en el archivo .env.local y reinicia el servidor.",
      },
      { status: 500 },
    );
  }

  let body: {
    tipo?: string;
    contexto?: unknown;
    imagenBase64?: string | null;
    mediaType?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "La petición llegó con un formato inválido." },
      { status: 400 },
    );
  }

  const etiqueta = ETIQUETAS[body.tipo ?? ""] ?? "imagen del canal";

  // Armamos el mensaje: primero la imagen de referencia (si hay), luego el texto.
  const contenido: Anthropic.ContentBlockParam[] = [];
  if (body.imagenBase64) {
    const mediaType = (body.mediaType ?? "image/jpeg") as
      | "image/jpeg"
      | "image/png"
      | "image/gif"
      | "image/webp";
    contenido.push({
      type: "image",
      source: { type: "base64", media_type: mediaType, data: body.imagenBase64 },
    });
    contenido.push({
      type: "text",
      text: "Arriba está la imagen de referencia de la persona. Inspírate en su estilo, colores y vibra.",
    });
  }
  contenido.push({
    type: "text",
    text:
      `Asset a diseñar: ${etiqueta}\n\n` +
      `Contexto de la persona (JSON):\n${JSON.stringify(body.contexto, null, 2)}`,
  });

  try {
    const respuesta = await anthropic.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 4000,
      thinking: { type: "adaptive" },
      system: PROMPT_IMAGENES,
      messages: [{ role: "user", content: contenido }],
    });

    if (respuesta.stop_reason === "max_tokens") {
      return Response.json(
        { error: "La respuesta se cortó. Intenta de nuevo." },
        { status: 502 },
      );
    }

    const texto = respuesta.content
      .map((bloque) => (bloque.type === "text" ? bloque.text : ""))
      .join("");

    return Response.json(extraerJSON(texto));
  } catch (error) {
    console.error("Error en imagenes:", error);
    return Response.json({ error: mensajeDeError(error) }, { status: 502 });
  }
}
