// ============================================================================
// app/api/asistente/route.ts — El "Asistente tu primer video".
//
// Una sola ruta con dos acciones:
//   - accion "ideas"   → devuelve 3 ideas para el primer video.
//   - accion "detalle" → con la idea elegida, devuelve guion + títulos + edición.
//
// Corre solo en el servidor (aquí vive la API key).
// ============================================================================

import { PROMPT_IDEAS, PROMPT_DETALLE } from "@/lib/prompt-asistente";
import { anthropic, extraerJSON, mensajeDeError } from "@/lib/ia-utils";

// Sin esto, Vercel corta la función a los 10s por defecto (Hobby) y esta
// llamada (Opus + thinking adaptativo) puede tardar más. 60 es el máximo del
// plan Hobby.
export const maxDuration = 60;

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

  let body: { accion?: string; contexto?: unknown; idea?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "La petición llegó con un formato inválido." },
      { status: 400 },
    );
  }

  const esIdeas = body.accion === "ideas";
  const system = esIdeas ? PROMPT_IDEAS : PROMPT_DETALLE;

  // Armamos el mensaje del usuario con el contexto del plan (y la idea elegida).
  let userContent = "Plan de la persona (JSON):\n\n" + JSON.stringify(body.contexto, null, 2);
  if (!esIdeas) {
    userContent +=
      "\n\nLa persona eligió esta idea (JSON):\n\n" + JSON.stringify(body.idea, null, 2);
  }

  try {
    const respuesta = await anthropic.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 8000,
      thinking: { type: "adaptive" },
      system,
      messages: [{ role: "user", content: userContent }],
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
    console.error("Error en el asistente:", error);
    return Response.json({ error: mensajeDeError(error) }, { status: 502 });
  }
}
