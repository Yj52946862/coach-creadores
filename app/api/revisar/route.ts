// ============================================================================
// app/api/revisar/route.ts — "Revisa tu contenido con IA".
//
// Recibe el contexto del plan + lo que el usuario pegó (idea/guion/título/
// descripción) y devuelve feedback accionable. Corre solo en el servidor.
// ============================================================================

import type Anthropic from "@anthropic-ai/sdk";
import { promptRevision } from "@/lib/prompt-revision";
import { anthropic, extraerJSON, mensajeDeError } from "@/lib/ia-utils";

// Sin esto, Vercel corta la función a los 10s por defecto. Con Vercel Pro,
// subimos el tope a 300s (antes 60, el máximo del plan Hobby) como margen
// real contra el 504 que sí se confirmó en producción para /api/generar-plan.
export const maxDuration = 300;

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
    contexto?: unknown;
    tipo?: string;
    contenido?: string;
    imagenBase64?: string | null;
    mediaType?: string | null;
    idioma?: string;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "La petición llegó con un formato inválido." },
      { status: 400 },
    );
  }

  // Aceptamos texto O una imagen (miniatura/banner/perfil). Debe venir uno.
  const hayTexto = !!body.contenido && !!body.contenido.trim();
  if (!hayTexto && !body.imagenBase64) {
    return Response.json(
      { error: "No hay contenido para revisar." },
      { status: 400 },
    );
  }

  // Armamos el mensaje: si hay imagen, va primero (para que Claude la "vea").
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
      text: "Arriba está la imagen que la persona quiere que revises (una miniatura, banner o foto de perfil).",
    });
  }
  contenido.push({
    type: "text",
    text:
      `Tipo de contenido: ${body.tipo ?? "no especificado"}\n\n` +
      `Contexto de la persona (JSON):\n${JSON.stringify(body.contexto, null, 2)}` +
      (hayTexto ? `\n\nContenido a revisar:\n"""\n${body.contenido}\n"""` : ""),
  });

  try {
    const respuesta = await anthropic.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 8000,
      thinking: { type: "adaptive" },
      system: promptRevision(body.idioma ?? "es"),
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
    console.error("Error en revisar:", error);
    return Response.json({ error: mensajeDeError(error) }, { status: 502 });
  }
}
