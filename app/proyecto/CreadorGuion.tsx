"use client";

// ============================================================================
// CreadorGuion.tsx — "Convierte una idea en un guion listo para grabar".
//
// Llama a /api/crear (tipo "guion"). El tema del video siempre se pide; el perfil
// (si hay) personaliza el tono, la plataforma y la duración.
// ============================================================================

import { useState } from "react";
import type { Plan, GuionCreado } from "@/lib/tipos";
import { contextoDePlan } from "@/lib/contexto";
import ProgresoCarga from "../ProgresoCarga";
import GuardarBoton from "./GuardarBoton";
import { FileText, Clock, AlertCircle } from "lucide-react";

export default function CreadorGuion({ plan }: { plan?: Plan | null }) {
  const [tema, setTema] = useState("");
  const [usarPerfil, setUsarPerfil] = useState(true);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guion, setGuion] = useState<GuionCreado | null>(null);

  const personalizado = !!(plan && usarPerfil);
  const contexto = personalizado ? contextoDePlan(plan) : null;

  async function generar() {
    setError(null);
    if (!tema.trim()) {
      setError("Escribe la idea o el tema de tu video.");
      return;
    }
    setCargando(true);
    setGuion(null);
    try {
      const r = await fetch("/api/crear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: "guion", tema: tema.trim(), contexto }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => null);
        throw new Error(d?.error ?? "No se pudo generar.");
      }
      setGuion(await r.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo salió mal.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <section className="tarjeta">
      <h2>
        <FileText size={20} strokeWidth={1.75} /> Crear guion
      </h2>
      <p>Convierte una idea en un guion listo para grabar.</p>

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
        aria-label="Idea o tema del video"
        value={tema}
        onChange={(e) => setTema(e.target.value)}
        placeholder="La idea o tema de tu video. Ej. 3 errores al ahorrar…"
      />

      {error && (
        <p className="error">
          <AlertCircle size={16} strokeWidth={2} />
          {error}
        </p>
      )}

      <button className="boton" onClick={generar} disabled={cargando}>
        {cargando ? "Escribiendo…" : "Crear guion"}
      </button>

      {cargando && <ProgresoCarga mensaje="Escribiendo tu guion…" />}

      {guion && (
        <div className="paquete">
          <p className="paquete-idea">
            <strong>{guion.titulo}</strong>
          </p>
          {guion.duracion && (
            <span className="paso-tiempo">
              <Clock size={14} strokeWidth={2} />
              {guion.duracion}
            </span>
          )}

          <h3>
            <FileText size={18} strokeWidth={1.75} /> Tu guion
          </h3>
          <p className="guion-texto">{guion.guion}</p>

          {(guion.notas ?? []).length > 0 && (
            <>
              <h3>Notas de producción</h3>
              <ul>
                {guion.notas.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </>
          )}

          <GuardarBoton
            tipo="Guion"
            titulo={guion.titulo}
            contenido={`${guion.titulo} (${guion.duracion})\n\n${guion.guion}`}
          />
        </div>
      )}
    </section>
  );
}
