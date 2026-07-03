"use client";

// ============================================================================
// CreadorDescripcion.tsx — "Genera descripciones claras y optimizadas".
//
// Llama a /api/crear (tipo "descripcion"). Devuelve una descripción principal,
// un par de alternativas y hashtags. El perfil (si hay) la personaliza.
// ============================================================================

import { useState } from "react";
import type { Plan, DescripcionCreada } from "@/lib/tipos";
import { contextoDePlan } from "@/lib/contexto";
import { leerIdioma } from "@/lib/idioma";
import ProgresoCarga from "../ProgresoCarga";
import GuardarBoton from "./GuardarBoton";
import { AlignLeft, AlertCircle } from "lucide-react";

export default function CreadorDescripcion({ plan }: { plan?: Plan | null }) {
  const [tema, setTema] = useState("");
  const [usarPerfil, setUsarPerfil] = useState(true);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [res, setRes] = useState<DescripcionCreada | null>(null);

  const personalizado = !!(plan && usarPerfil);
  const contexto = personalizado ? contextoDePlan(plan) : null;

  async function generar() {
    setError(null);
    if (!tema.trim()) {
      setError("Escribe de qué trata el video.");
      return;
    }
    setCargando(true);
    setRes(null);
    try {
      const r = await fetch("/api/crear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "descripcion",
          tema: tema.trim(),
          contexto,
          idioma: leerIdioma(),
        }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => null);
        throw new Error(d?.error ?? "No se pudo generar.");
      }
      setRes(await r.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo salió mal.");
    } finally {
      setCargando(false);
    }
  }

  function copiar() {
    if (!res) return;
    navigator.clipboard.writeText(res.descripcion).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    });
  }

  return (
    <section className="tarjeta">
      <h2>
        <AlignLeft size={20} strokeWidth={1.75} /> Crear descripción
      </h2>
      <p>Genera descripciones claras, atractivas y optimizadas.</p>

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
        aria-label="De qué trata el video"
        value={tema}
        onChange={(e) => setTema(e.target.value)}
        placeholder="De qué trata el video. Ej. reseña de una laptop barata…"
      />

      {error && (
        <p className="error">
          <AlertCircle size={16} strokeWidth={2} />
          {error}
        </p>
      )}

      <button className="boton" onClick={generar} disabled={cargando}>
        {cargando ? "Escribiendo…" : "Crear descripción"}
      </button>

      {cargando && <ProgresoCarga mensaje="Redactando tu descripción…" />}

      {res && (
        <div className="revision">
          <h3>Descripción</h3>
          <div className="prompt-box">
            <p className="guion-texto">{res.descripcion}</p>
            <button className="boton boton-secundario" onClick={copiar}>
              {copiado ? "¡Copiado!" : "Copiar descripción"}
            </button>
          </div>

          {(res.alternativas ?? []).length > 0 && (
            <>
              <h3>Alternativas</h3>
              <ul>
                {res.alternativas.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </>
          )}

          {(res.hashtags ?? []).length > 0 && (
            <div className="hashtags-fila">
              {res.hashtags.map((h, i) => (
                <span className="chip" key={i}>
                  {h}
                </span>
              ))}
            </div>
          )}

          <GuardarBoton
            tipo="Descripción"
            titulo={tema}
            contenido={res.descripcion}
          />
        </div>
      )}
    </section>
  );
}
