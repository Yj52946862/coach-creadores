"use client";

// ============================================================================
// GeneradorIdeas.tsx — "Ideas de contenido para cualquier tema".
//
// Llama a /api/crear (tipo "ideas"). Sirve sin perfil (escribes un tema) y con
// perfil (personaliza según tu proyecto). Cada idea se puede guardar.
// ============================================================================

import { useState } from "react";
import type { Plan, IdeaContenido } from "@/lib/tipos";
import { contextoDePlan } from "@/lib/contexto";
import { leerIdioma } from "@/lib/idioma";
import ProgresoCarga from "../ProgresoCarga";
import GuardarBoton from "./GuardarBoton";
import { Lightbulb, AlertCircle } from "lucide-react";

export default function GeneradorIdeas({ plan }: { plan?: Plan | null }) {
  const [tema, setTema] = useState("");
  const [usarPerfil, setUsarPerfil] = useState(true);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ideas, setIdeas] = useState<IdeaContenido[]>([]);

  const personalizado = !!(plan && usarPerfil);
  const contexto = personalizado ? contextoDePlan(plan) : null;

  async function generar() {
    setError(null);
    if (!personalizado && !tema.trim()) {
      setError("Escribe un tema para generar ideas.");
      return;
    }
    setCargando(true);
    setIdeas([]);
    try {
      const r = await fetch("/api/crear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "ideas",
          tema: tema.trim(),
          contexto,
          idioma: leerIdioma(),
        }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => null);
        throw new Error(d?.error ?? "No se pudo generar.");
      }
      const data = await r.json();
      setIdeas(Array.isArray(data.ideas) ? data.ideas : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo salió mal.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <section className="tarjeta">
      <h2>
        <Lightbulb size={20} strokeWidth={1.75} /> Ideas de contenido
      </h2>
      <p>Genera ideas para cualquier tema, nicho o plataforma.</p>

      {plan && (
        <label className="toggle-perfil">
          <input
            type="checkbox"
            checked={usarPerfil}
            onChange={(e) => setUsarPerfil(e.target.checked)}
          />
          <span>Personalizar según mi proyecto</span>
        </label>
      )}

      <input
        type="text"
        aria-label="Tema para las ideas"
        value={tema}
        onChange={(e) => setTema(e.target.value)}
        placeholder={
          personalizado
            ? "Opcional: afina el tema (o déjalo para usar tu nicho)…"
            : "Tema, nicho o plataforma. Ej. finanzas para jóvenes en TikTok…"
        }
      />

      {error && (
        <p className="error">
          <AlertCircle size={16} strokeWidth={2} />
          {error}
        </p>
      )}

      <button className="boton" onClick={generar} disabled={cargando}>
        {cargando ? "Generando…" : "Generar ideas"}
      </button>

      {cargando && <ProgresoCarga mensaje="Pensando ideas frescas…" />}

      {ideas.length > 0 && (
        <div className="ideas-grid">
          {ideas.map((idea, i) => (
            <div className="idea-card" key={i}>
              <p className="idea-titulo">{idea.titulo}</p>
              <p className="idea-gancho">{idea.gancho}</p>
              <p className="idea-porque">{idea.angulo}</p>
              <GuardarBoton
                tipo="Idea"
                titulo={idea.titulo}
                contenido={`${idea.titulo}\n\nÁngulo: ${idea.angulo}\n\nGancho: ${idea.gancho}`}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
