// ============================================================================
// app/api/generar-plan/route.ts — El puente con el cerebro.
//
// Esto corre SOLO en el servidor (no en el navegador). Aquí vive la API key.
// Recibe el diagnóstico del formulario y una de 3 "partes" del plan, se lo
// manda a Claude junto con el prompt maestro de esa parte, y devuelve ese
// pedazo del plan en JSON.
//
// Por qué 3 partes y no 1 llamada grande: la llamada única (todo el plan de
// una vez) confirmó 504 reales en producción (Vercel corta a los 60s). Cada
// parte genera bastante menos contenido, así que tarda bastante menos.
// `app/descubre/page.tsx` pide las 3 en secuencia y arma el Plan completo al
// final. Si la parte es 2 o 3, mandamos también "previo" (lo ya generado en
// las partes anteriores) para que el modelo no contradiga lo ya decidido
// (mismo nicho, misma plataforma, mismas fases).
//
// La URL de esta función es /api/generar-plan (por la ubicación del archivo).
// ============================================================================

import { promptMaestro } from "@/lib/prompt-maestro";
import { anthropic, extraerJSON, mensajeDeError } from "@/lib/ia-utils";
import type { Diagnostico } from "@/lib/tipos";

// Sin esto, Vercel corta la función a los 10s por defecto. Con el plan
// dividido en partes, cada llamada real ya mide bastante menos de 60s (ver
// prompt-maestro.ts para el detalle) — pero ahora que el proyecto está en
// Vercel Pro, subimos el tope a 300s de todos modos, como red de seguridad
// real contra el 504 que sí llegamos a confirmar en producción con el plan
// Hobby (300 es el máximo permitido sin configuración extra en Pro).
export const maxDuration = 300;

type Cuerpo = {
  diagnostico?: Diagnostico;
  parte?: 1 | 2 | 3;
  previo?: unknown;
};

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

  // 2) Leemos el diagnóstico, la parte pedida (1, 2 o 3) y, si aplica, lo ya
  //    generado en partes anteriores.
  let cuerpo: Cuerpo;
  try {
    cuerpo = (await request.json()) as Cuerpo;
  } catch {
    return Response.json(
      { error: "El diagnóstico llegó con un formato inválido." },
      { status: 400 },
    );
  }

  const diagnostico = cuerpo.diagnostico;
  const parte = cuerpo.parte === 2 || cuerpo.parte === 3 ? cuerpo.parte : 1;
  if (!diagnostico) {
    return Response.json(
      { error: "Falta el diagnóstico de la persona." },
      { status: 400 },
    );
  }

  try {
    // 3) Armamos el mensaje: el diagnóstico siempre, y si es parte 2 o 3,
    //    también lo ya decidido antes (para que no se contradiga).
    let userContent =
      "Este es el diagnóstico de la persona (en JSON). Genera su plan siguiendo el schema exacto:\n\n" +
      JSON.stringify(diagnostico, null, 2);
    if (parte > 1 && cuerpo.previo) {
      userContent +=
        "\n\nEsto YA se decidió en las partes anteriores — mantente 100% consistente, no lo cambies ni lo contradigas:\n\n" +
        JSON.stringify(cuerpo.previo, null, 2);
    }

    // 4) La llamada al cerebro: system = reglas del coach para ESTA parte.
    //    "adaptive" (sin más) dejaba a Claude decidir cuánto pensar sin tope,
    //    lo cual midió entre 30s y 80s+ en pruebas reales cuando el plan era
    //    una sola llamada — por encima del límite de 60s de Vercel Hobby
    //    (confirmado con 504 en producción). Este modelo exige "adaptive" (no
    //    admite budget_tokens fijo — lo confirmó la propia API al rechazar ese
    //    intento), así que se acota el esfuerzo con output_config.effort.
    //    max_tokens en 6000: cada parte genera bastante menos que el plan
    //    completo de antes, así que esto es una red de seguridad amplia — si
    //    algo se saliera de control, corta rápido con nuestro propio mensaje
    //    de error en vez de arriesgar un 504 silencioso a los 60s.
    const respuesta = await anthropic.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 6000,
      thinking: { type: "adaptive" },
      output_config: { effort: "low" },
      system: promptMaestro(diagnostico.idioma || "es", parte),
      messages: [{ role: "user", content: userContent }],
    });

    // 5) Si la respuesta se cortó por longitud, el JSON viene incompleto.
    if (respuesta.stop_reason === "max_tokens") {
      return Response.json(
        { error: "El plan salió demasiado largo y se cortó. Intenta de nuevo." },
        { status: 502 },
      );
    }

    // 6) Tomamos solo el bloque de texto (ignoramos el "pensamiento" interno).
    const texto = respuesta.content
      .map((bloque) => (bloque.type === "text" ? bloque.text : ""))
      .join("");

    const pedazo = extraerJSON(texto);

    // 7) Si a esta parte le falta su pieza esencial, pedimos reintento en vez
    //    de dejar avanzar con datos incompletos.
    if (!parteValida(pedazo, parte)) {
      return Response.json(
        { error: "Esa parte del plan llegó incompleta. Por favor intenta de nuevo." },
        { status: 502 },
      );
    }

    return Response.json(pedazo);
  } catch (error) {
    console.error(`Error generando la parte ${parte} del plan:`, error);
    return Response.json({ error: mensajeDeError(error) }, { status: 502 });
  }
}

// Revisa que la parte traiga su pieza esencial antes de devolverla.
function parteValida(pedazo: unknown, parte: 1 | 2 | 3): boolean {
  if (!pedazo || typeof pedazo !== "object") return false;
  const p = pedazo as Record<string, unknown>;
  if (parte === 1) {
    const nicho = p.nicho as Record<string, unknown> | undefined;
    const plataforma = p.plataforma_principal as Record<string, unknown> | undefined;
    return (
      typeof p.diagnostico_resumen === "string" &&
      typeof nicho?.definicion === "string" &&
      typeof plataforma?.red === "string"
    );
  }
  if (parte === 2) {
    return Array.isArray(p.fases) && p.fases.length > 0;
  }
  return Array.isArray(p.ejemplos_titulos) && p.ejemplos_titulos.length > 0;
}
