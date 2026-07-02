"use client";

// ============================================================================
// GeneradorRapido.tsx — Títulos o hooks en segundos.
//
// Un mismo componente con un toggle (Títulos / Hooks). Llama a /api/crear con el
// tipo elegido. Pensado para "Sigue avanzando" dentro de Mi Proyecto.
// ============================================================================

import { useState } from "react";
import type { Plan } from "@/lib/tipos";
import { contextoDePlan } from "@/lib/contexto";
import ProgresoCarga from "../ProgresoCarga";
import GuardarBoton from "./GuardarBoton";
import { Type, AlertCircle } from "lucide-react";

const MODOS = [
  { id: "titulos", etiqueta: "Títulos" },
  { id: "hooks", etiqueta: "Hooks" },
] as const;

export default function GeneradorRapido({ plan }: { plan?: Plan | null }) {
  const [modo, setModo] = useState<string>("titulos");
  const [tema, setTema] = useState("");
  const [usarPerfil, setUsarPerfil] = useState(true);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<string[]>([]);

  const personalizado = !!(plan && usarPerfil);
  const contexto = personalizado ? contextoDePlan(plan) : null;
  const etiqueta = MODOS.find((m) => m.id === modo)?.etiqueta ?? "";

  async function generar() {
    setError(null);
    if (!tema.trim()) {
      setError("Escribe el tema del video.");
      return;
    }
    setCargando(true);
    setItems([]);
    try {
      const r = await fetch("/api/crear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo: modo, tema: tema.trim(), contexto }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => null);
        throw new Error(d?.error ?? "No se pudo generar.");
      }
      const data = await r.json();
      const lista = modo === "titulos" ? data.titulos : data.hooks;
      setItems(Array.isArray(lista) ? lista : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo salió mal.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <section className="tarjeta">
      <h2>
        <Type size={20} strokeWidth={1.75} /> Títulos y hooks
      </h2>
      <p>Genera títulos o ganchos para un video en segundos.</p>

      <div className="grupo-botones" role="group" aria-label="Qué generar">
        {MODOS.map((m) => (
          <button
            key={m.id}
            type="button"
            className={"chip" + (modo === m.id ? " chip-activo" : "")}
            aria-pressed={modo === m.id}
            onClick={() => {
              setModo(m.id);
              setItems([]);
            }}
          >
            {m.etiqueta}
          </button>
        ))}
      </div>

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
        aria-label="Tema del video"
        value={tema}
        onChange={(e) => setTema(e.target.value)}
        placeholder="El tema del video…"
      />

      {error && (
        <p className="error">
          <AlertCircle size={16} strokeWidth={2} />
          {error}
        </p>
      )}

      <button className="boton" onClick={generar} disabled={cargando}>
        {cargando ? "Generando…" : `Generar ${etiqueta.toLowerCase()}`}
      </button>

      {cargando && (
        <ProgresoCarga mensaje={`Pensando ${etiqueta.toLowerCase()}…`} />
      )}

      {items.length > 0 && (
        <>
          <ul className="lista-titulos">
            {items.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
          <GuardarBoton
            tipo={etiqueta}
            titulo={`${etiqueta} · ${tema}`}
            contenido={items.join("\n")}
          />
        </>
      )}
    </section>
  );
}
