// ============================================================================
// app/api/generar-plan/route.ts — El puente con el cerebro.
//
// Esto corre SOLO en el servidor (no en el navegador). Aquí vive la API key.
// Recibe el diagnóstico del formulario, se lo manda a Claude junto con el
// prompt maestro, y devuelve el plan en JSON.
//
// La URL de esta función es /api/generar-plan (por la ubicación del archivo).
// ============================================================================

import { PROMPT_MAESTRO } from "@/lib/prompt-maestro";
import { anthropic, extraerJSON, mensajeDeError } from "@/lib/ia-utils";
import type { Diagnostico } from "@/lib/tipos";

// Sin esto, Vercel corta la función a los 10s por defecto (Hobby) y esta
// llamada (Opus + thinking adaptativo) tarda 30-60s. 60 es el máximo del plan
// Hobby; con eso alcanza para el caso normal.
export const maxDuration = 60;

export async function POST(request: Request) {
  // 1) Sin API key no hay cerebro. Avisamos con un mensaje claro.
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      {
        error:
          "Falta la ANTHROPIC_API_KEY. Pégala en el archivo .env.local y reinicia el servidor (npm run dev).",
      },
      { status: 500 },
    );
  }

  // 2) Leemos el diagnóstico que mandó el formulario.
  let diagnostico: Diagnostico;
  try {
    diagnostico = (await request.json()) as Diagnostico;
  } catch {
    return Response.json(
      { error: "El diagnóstico llegó con un formato inválido." },
      { status: 400 },
    );
  }

  try {
    // 3) La llamada al cerebro: system = reglas del coach, user = el diagnóstico.
    //    Opus 4.8 con "adaptive thinking" para que razone bien (calidad manda).
    const respuesta = await anthropic.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      system: PROMPT_MAESTRO,
      messages: [
        {
          role: "user",
          content:
            "Este es el diagnóstico de la persona (en JSON). Genera su plan siguiendo el schema exacto:\n\n" +
            JSON.stringify(diagnostico, null, 2),
        },
      ],
    });

    // 4) Si la respuesta se cortó por longitud, el JSON viene incompleto.
    if (respuesta.stop_reason === "max_tokens") {
      return Response.json(
        { error: "El plan salió demasiado largo y se cortó. Intenta de nuevo." },
        { status: 502 },
      );
    }

    // 5) Tomamos solo el bloque de texto (ignoramos el "pensamiento" interno).
    const texto = respuesta.content
      .map((bloque) => (bloque.type === "text" ? bloque.text : ""))
      .join("");

    const plan = extraerJSON(texto);

    // 6) Si al plan le faltan piezas clave, pedimos reintento en vez de mostrar
    //    una página rota tras la espera.
    if (!planValido(plan)) {
      return Response.json(
        { error: "El plan llegó incompleto. Por favor intenta de nuevo." },
        { status: 502 },
      );
    }

    return Response.json(plan);
  } catch (error) {
    console.error("Error generando el plan:", error);
    return Response.json({ error: mensajeDeError(error) }, { status: 502 });
  }
}

// Revisa que el plan traiga sus piezas esenciales antes de devolverlo.
function planValido(plan: unknown): boolean {
  if (!plan || typeof plan !== "object") return false;
  const p = plan as Record<string, unknown>;
  const nicho = p.nicho as Record<string, unknown> | undefined;
  const plataforma = p.plataforma_principal as Record<string, unknown> | undefined;
  return (
    typeof p.diagnostico_resumen === "string" &&
    typeof nicho?.definicion === "string" &&
    typeof plataforma?.red === "string" &&
    Array.isArray(p.fases) &&
    p.fases.length > 0
  );
}
