"use client";

// ============================================================================
// AsistentePrimerVideo.tsx — El asistente interactivo "tu primer video".
//
// Flujo:
//   inicial → (botón) → 3 ideas → (eliges una) → guion + títulos + cómo editar.
// Llama a /api/asistente (que corre en el servidor) para cada paso.
// ============================================================================

import { useState } from "react";
import type {
  Plan,
  IdeaVideo,
  PaqueteVideo,
  DescripcionCreada,
  ImagenCanal,
} from "@/lib/tipos";
import { leerIdioma } from "@/lib/idioma";
import ProgresoCarga from "../ProgresoCarga";
import ListaGuion from "./ListaGuion";
import {
  Clapperboard,
  Video,
  FileText,
  PenLine,
  Scissors,
  AlignLeft,
  Image as ImageIcon,
  Ruler,
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
  const [descripcion, setDescripcion] = useState<DescripcionCreada | null>(null);
  const [miniatura, setMiniatura] = useState<ImagenCanal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiadoDescripcion, setCopiadoDescripcion] = useState(false);
  const [copiadoPrompt, setCopiadoPrompt] = useState(false);

  // Contexto que mandamos a la IA: un subconjunto del plan, suficiente para
  // ideas buenas sin enviar todo.
  const contexto = {
    diagnostico_resumen: plan.diagnostico_resumen,
    nicho: plan.nicho,
    plataforma_principal: plan.plataforma_principal,
    que_funciona_ahora: plan.que_funciona_ahora,
  };

  async function pedirIdeas() {
    setError(null);
    setEstado("cargandoIdeas");
    try {
      const r = await fetch("/api/asistente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "ideas", contexto, idioma: leerIdioma() }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => null);
        throw new Error(d?.error ?? "No se pudo generar.");
      }
      const data = await r.json();
      setIdeas(Array.isArray(data.ideas) ? data.ideas : []);
      setEstado("ideas");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo salió mal.");
      setEstado("inicial");
    }
  }

  // Al elegir una idea pedimos, EN PARALELO, las 3 herramientas: el paquete
  // (guion+títulos+edición), la descripción para publicar y el prompt para la
  // miniatura — así el video queda listo de punta a punta en una sola espera.
  // Reusamos las rutas /api/crear y /api/imagenes (las mismas que usan las
  // herramientas sueltas) en vez de ampliar el schema de /api/asistente, para
  // no alargar esa llamada y arriesgar el límite de 60s de Vercel Hobby.
  async function elegir(idea: IdeaVideo) {
    setElegida(idea);
    setError(null);
    setEstado("cargandoDetalle");
    setDescripcion(null);
    setMiniatura(null);
    const idioma = leerIdioma();

    const pedirDetalle = fetch("/api/asistente", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accion: "detalle", contexto, idea, idioma }),
    }).then(async (r) => {
      if (!r.ok) {
        const d = await r.json().catch(() => null);
        throw new Error(d?.error ?? "No se pudo generar.");
      }
      return r.json() as Promise<PaqueteVideo>;
    });

    // Estas dos son "extra": si fallan, el resultado principal se muestra
    // igual y esas secciones simplemente no aparecen (sin tumbar el flujo).
    const pedirDescripcion = fetch("/api/crear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo: "descripcion",
        tema: `${idea.titulo} — ${idea.gancho}`,
        contexto,
        idioma,
      }),
    })
      .then((r) => (r.ok ? (r.json() as Promise<DescripcionCreada>) : null))
      .catch(() => null);

    const pedirMiniatura = fetch("/api/imagenes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo: "miniatura",
        contexto: { ...contexto, video: idea },
        idioma,
      }),
    })
      .then((r) => (r.ok ? (r.json() as Promise<ImagenCanal>) : null))
      .catch(() => null);

    try {
      const [paqueteRes, descripcionRes, miniaturaRes] = await Promise.all([
        pedirDetalle,
        pedirDescripcion,
        pedirMiniatura,
      ]);
      setPaquete(paqueteRes);
      setDescripcion(descripcionRes);
      setMiniatura(miniaturaRes);
      setEstado("detalle");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo salió mal.");
      setEstado("ideas");
    }
  }

  function copiarDescripcion() {
    if (!descripcion) return;
    navigator.clipboard.writeText(descripcion.descripcion).then(() => {
      setCopiadoDescripcion(true);
      setTimeout(() => setCopiadoDescripcion(false), 1500);
    });
  }

  function copiarPromptMiniatura() {
    if (!miniatura) return;
    navigator.clipboard.writeText(miniatura.prompt).then(() => {
      setCopiadoPrompt(true);
      setTimeout(() => setCopiadoPrompt(false), 1500);
    });
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
            eliges la que más te late, y te paso guion, títulos, cómo editarlo,
            descripción para publicar y hasta el prompt para tu miniatura.
          </p>
          <button className="boton" onClick={pedirIdeas}>
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
              : "Armando tu guion, títulos, edición, descripción y miniatura…"
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
          <ListaGuion segmentos={paquete.guion} />

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

          {descripcion && (
            <>
              <h3>
                <AlignLeft size={18} strokeWidth={1.75} /> Descripción para
                publicar
              </h3>
              <div className="prompt-box">
                <p className="guion-texto">{descripcion.descripcion}</p>
                <button
                  className="boton boton-secundario"
                  onClick={copiarDescripcion}
                >
                  {copiadoDescripcion ? "¡Copiado!" : "Copiar descripción"}
                </button>
              </div>
              {(descripcion.alternativas ?? []).length > 0 && (
                <ul>
                  {descripcion.alternativas.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              )}
              {(descripcion.hashtags ?? []).length > 0 && (
                <div className="hashtags-fila">
                  {descripcion.hashtags.map((h, i) => (
                    <span className="chip" key={i}>
                      {h}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}

          {miniatura && (
            <>
              <h3>
                <ImageIcon size={18} strokeWidth={1.75} /> Prompt para tu
                miniatura
              </h3>
              <p className="medidas-badge">
                <Ruler size={15} strokeWidth={1.9} /> {miniatura.medidas}
              </p>
              <p>{miniatura.concepto}</p>
              <div className="prompt-box">
                <p className="guion-texto">{miniatura.prompt}</p>
                <button
                  className="boton boton-secundario"
                  onClick={copiarPromptMiniatura}
                >
                  {copiadoPrompt ? "¡Copiado!" : "Copiar prompt"}
                </button>
              </div>
              <p className="nota-estimacion">
                Pégalo en un generador gratis: Bing Image Creator, Ideogram o
                Canva.
              </p>
            </>
          )}

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
