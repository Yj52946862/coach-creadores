// ============================================================================
// app/api/crear/route.ts — Herramientas de "crear" (sueltas o con perfil).
//
// Una sola ruta flexible para generar contenido: ideas, guion, descripción,
// títulos o hooks. Recibe:
//   { tipo, tema, contexto? }
//   - tipo    : qué generar (ideas|guion|descripcion|titulos|hooks)
//   - tema    : el tema o idea base que escribe el usuario
//   - contexto: OPCIONAL. El perfil/plan de la persona (para personalizar).
//
// Si hay contexto, la respuesta sale ajustada al nicho/plataforma/voz. Si no,
// trabaja con el tema tal cual. Corre solo en el servidor (aquí vive la API key).
// ============================================================================

import { promptCrear, TIPOS_CREAR } from "@/lib/prompt-crear";
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

  let body: { tipo?: string; tema?: string; contexto?: unknown; idioma?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "La petición llegó con un formato inválido." },
      { status: 400 },
    );
  }

  const tipo = String(body.tipo ?? "");
  if (!TIPOS_CREAR.includes(tipo)) {
    return Response.json(
      { error: "No reconozco ese tipo de herramienta." },
      { status: 400 },
    );
  }

  const tema = (body.tema ?? "").toString().trim();
  // Necesitamos al menos un tema o un contexto del que partir.
  if (!tema && !body.contexto) {
    return Response.json(
      { error: "Escribe un tema para empezar." },
      { status: 400 },
    );
  }

  let userContent = `Tema o idea base: ${tema || "(usa el nicho del contexto)"}\n\n`;
  if (body.contexto) {
    userContent +=
      `Contexto de la persona (JSON):\n${JSON.stringify(body.contexto, null, 2)}\n\n`;
  }
  userContent += `Genera el contenido para el tipo "${tipo}" siguiendo exactamente el schema.`;

  try {
    const respuesta = await anthropic.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 6000,
      thinking: { type: "adaptive" },
      system: promptCrear(tipo, body.idioma ?? "es"),
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
    console.error("Error en crear:", error);
    return Response.json({ error: mensajeDeError(error) }, { status: 502 });
  }
}
