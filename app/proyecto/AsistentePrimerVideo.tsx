"use client";

// ============================================================================
// AsistentePrimerVideo.tsx — El asistente interactivo "tu primer video".
//
// Flujo:
//   inicial → (botón) → 3 ideas → (eliges una) → guion + títulos + cómo editar.
// Llama a /api/asistente (que corre en el servidor) para cada paso.
// ============================================================================

import { useState } from "react";
import type { Plan, IdeaVideo, PaqueteVideo } from "@/lib/tipos";
import ProgresoCarga from "../ProgresoCarga";
import {
  Clapperboard,
  Video,
  FileText,
  PenLine,
  Scissors,
  AlertCircle,
} from "lucide-react";

type Estado =
  | "inicial"
  | "cargandoIdeas"
  | "ideas"
  | "cargandoDetalle"
  | "detalle";

export default function AsistentePrimerVideo({ plan }: { plan: Plan }) {
  const [estado, setEstado] = useState<Estado>("inicial");
  const [ideas, setIdeas] = useState<IdeaVideo[]>([]);
  const [elegida, setElegida] = useState<IdeaVideo | null>(null);
  const [paquete, setPaquete] = useState<PaqueteVideo | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Contexto que mandamos a la IA: un subconjunto del plan, suficiente para
  // ideas buenas sin enviar todo.
  const contexto = {
    diagnostico_resumen: plan.diagnostico_resumen,
    nicho: plan.nicho,
    plataforma_principal: plan.plataforma_principal,
    que_funciona_ahora: plan.que_funciona_ahora,
  };

  async function pedir(accion: "ideas" | "detalle", idea?: IdeaVideo) {
    setError(null);
    setEstado(accion === "ideas" ? "cargandoIdeas" : "cargandoDetalle");
    try {
      const r = await fetch("/api/asistente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion, contexto, idea }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => null);
        throw new Error(d?.error ?? "No se pudo generar.");
      }
      const data = await r.json();
      if (accion === "ideas") {
        setIdeas(Array.isArray(data.ideas) ? data.ideas : []);
        setEstado("ideas");
      } else {
        setPaquete(data);
        setEstado("detalle");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo salió mal.");
      // Volvemos a un estado usable para que pueda reintentar.
      setEstado(accion === "ideas" ? "inicial" : "ideas");
    }
  }

  function elegir(idea: IdeaVideo) {
    setElegida(idea);
    pedir("detalle", idea);
  }

  const cargando = estado === "cargandoIdeas" || estado === "cargandoDetalle";

  return (
    <section className="tarjeta asistente">
      <h2>
        <Clapperboard size={20} strokeWidth={1.75} /> Hagamos tu primer video
      </h2>

      {estado === "inicial" && (
        <>
          <p>
            ¿Listo para arrancar? Te doy 3 ideas concretas para tu primer video,
            eliges la que más te late, y te paso el guion, los títulos y cómo
            editarlo.
          </p>
          <button className="boton" onClick={() => pedir("ideas")}>
            Dame 3 ideas para empezar
          </button>
        </>
      )}

      {error && (
        <p className="error">
          <AlertCircle size={16} strokeWidth={2} />
          {error}
        </p>
      )}

      {cargando && (
        <ProgresoCarga
          mensaje={
            estado === "cargandoIdeas"
              ? "Pensando 3 ideas a tu medida…"
              : "Armando tu guion, títulos y edición…"
          }
        />
      )}

      {estado === "ideas" && (
        <>
          <p className="asistente-instruccion">Elige la idea que más te guste:</p>
          <div className="ideas-grid">
            {ideas.map((idea, i) => (
              <div className="idea-card" key={i}>
                <p className="idea-titulo">{idea.titulo}</p>
                <p className="idea-gancho">{idea.gancho}</p>
                <p className="idea-porque">{idea.porque}</p>
                <button
                  className="boton boton-secundario"
                  onClick={() => elegir(idea)}
                >
                  Elegir esta →
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {estado === "detalle" && paquete && (
        <div className="paquete">
          {elegida && (
            <p className="paquete-idea">
<Video size={16} strokeWidth={1.9} />
              <strong>{elegida.titulo}</strong>
            </p>
          )}

          <h3>
            <FileText size={18} strokeWidth={1.75} /> Tu guion
          </h3>
          <p className="guion-texto">{paquete.guion}</p>

          <h3>
            <PenLine size={18} strokeWidth={1.75} /> Títulos para publicar
          </h3>
          <ul className="lista-titulos">
            {(paquete.titulos ?? []).map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>

          <h3>
            <Scissors size={18} strokeWidth={1.75} /> Cómo editarlo
          </h3>
          <ol className="pasos-edicion">
            {(paquete.edicion ?? []).map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ol>

          <button
            className="boton boton-secundario"
            onClick={() => setEstado("ideas")}
          >
            ← Ver las otras ideas
          </button>
        </div>
      )}
    </section>
  );
}
