"use client";

// ============================================================================
// ImagenesCanal.tsx — "Imágenes y branding de tu canal".
//
// Generalizado: sirve CON perfil (Mi Proyecto) y SIN perfil (estudio). El
// usuario elige el asset (perfil, banner, miniatura, marca de agua, branding),
// opcionalmente sube una imagen de referencia, y la IA da concepto + medidas +
// un prompt listo para un generador. Si no hay perfil, pide un "tema".
// Llama a /api/imagenes (visión) en el servidor.
// ============================================================================

import { useState } from "react";
import type { Plan, ImagenCanal } from "@/lib/tipos";
import { contextoDePlan } from "@/lib/contexto";
import { leerImagenRedimensionada, type Referencia } from "@/lib/imagen";
import ProgresoCarga from "../ProgresoCarga";
import GuardarBoton from "./GuardarBoton";
import { Palette, Ruler, Paperclip, Check, AlertCircle } from "lucide-react";

const ASSETS = [
  { id: "perfil", etiqueta: "Foto de perfil / Logo" },
  { id: "banner", etiqueta: "Banner / Portada" },
  { id: "miniatura", etiqueta: "Miniatura" },
  { id: "marca_agua", etiqueta: "Marca de agua" },
  { id: "branding", etiqueta: "Branding del canal" },
] as const;

export default function ImagenesCanal({
  plan,
  tipoInicial,
}: {
  plan?: Plan | null;
  tipoInicial?: string;
}) {
  const [tipo, setTipo] = useState<string>(tipoInicial ?? "perfil");
  const [tema, setTema] = useState("");
  const [usarPerfil, setUsarPerfil] = useState(true);
  const [referencia, setReferencia] = useState<Referencia | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ImagenCanal | null>(null);
  const [copiado, setCopiado] = useState(false);

  const personalizado = !!(plan && usarPerfil);
  const contexto = personalizado ? contextoDePlan(plan) : { tema: tema.trim() };
  const etiquetaActual =
    ASSETS.find((a) => a.id === tipo)?.etiqueta ?? "tu imagen";

  async function subirReferencia(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setReferencia(await leerImagenRedimensionada(file));
      setError(null);
    } catch {
      setError("No se pudo leer esa imagen. Prueba con otra.");
    }
  }

  async function generar() {
    setError(null);
    if (!personalizado && !tema.trim()) {
      setError("Escribe de qué trata tu canal para darte un buen concepto.");
      return;
    }
    setCargando(true);
    setResultado(null);
    try {
      const r = await fetch("/api/imagenes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo,
          contexto,
          imagenBase64: referencia?.base64 ?? null,
          mediaType: referencia?.mediaType ?? null,
        }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => null);
        throw new Error(d?.error ?? "No se pudo generar.");
      }
      setResultado(await r.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo salió mal.");
    } finally {
      setCargando(false);
    }
  }

  function copiarPrompt() {
    if (!resultado) return;
    navigator.clipboard.writeText(resultado.prompt).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    });
  }

  const consejos = resultado?.consejos ?? [];

  return (
    <section className="tarjeta imagenes">
      <h2>
        <Palette size={20} strokeWidth={1.75} /> Imágenes y branding de tu canal
      </h2>
      <p>
        Elige qué imagen quieres y, si gustas, sube una de referencia. Te doy el
        concepto, las medidas y un prompt listo para pegar en un generador gratis.
      </p>

      <div className="grupo-botones" role="group" aria-label="Tipo de imagen">
        {ASSETS.map((a) => (
          <button
            type="button"
            key={a.id}
            className={"chip" + (tipo === a.id ? " chip-activo" : "")}
            aria-pressed={tipo === a.id}
            onClick={() => setTipo(a.id)}
          >
            {a.etiqueta}
          </button>
        ))}
      </div>

      {/* Personalizar con el proyecto (solo si hay plan) */}
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

      {/* Tema: solo cuando NO estamos personalizando con el perfil */}
      {!personalizado && (
        <input
          type="text"
          aria-label="De qué trata tu canal"
          value={tema}
          onChange={(e) => setTema(e.target.value)}
          placeholder="¿De qué trata tu canal? Ej. recetas rápidas y baratas…"
        />
      )}

      <label className="subir-ref">
        <input type="file" accept="image/*" onChange={subirReferencia} />
        <span
          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          {referencia ? (
            <>
              <Check size={15} strokeWidth={2} /> Cambiar imagen de referencia
            </>
          ) : (
            <>
              <Paperclip size={15} strokeWidth={2} /> Subir imagen de referencia
              (opcional)
            </>
          )}
        </span>
      </label>
      {referencia && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={referencia.dataUrl}
          alt="Tu imagen de referencia"
          className="ref-preview"
        />
      )}

      {error && (
        <p className="error">
          <AlertCircle size={16} strokeWidth={2} />
          {error}
        </p>
      )}

      <button className="boton" onClick={generar} disabled={cargando}>
        {cargando ? "Generando…" : `Generar idea para ${etiquetaActual}`}
      </button>

      {cargando && (
        <ProgresoCarga mensaje="Diseñando el concepto de tu imagen…" />
      )}

      {resultado && (
        <div className="resultado-imagen">
          <p className="medidas-badge">
            <Ruler size={15} strokeWidth={1.9} /> {resultado.medidas}
          </p>

          <h3>Concepto</h3>
          <p>{resultado.concepto}</p>

          <h3>Prompt para el generador</h3>
          <div className="prompt-box">
            <p className="guion-texto">{resultado.prompt}</p>
            <button className="boton boton-secundario" onClick={copiarPrompt}>
              {copiado ? "¡Copiado!" : "Copiar prompt"}
            </button>
          </div>
          <p className="nota-estimacion">
            Pega ese prompt en un generador gratis: Bing Image Creator, Ideogram
            o Canva.
          </p>

          {consejos.length > 0 && (
            <>
              <h3>Consejos</h3>
              <ul>
                {consejos.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </>
          )}

          <GuardarBoton
            tipo={`Prompt visual · ${etiquetaActual}`}
            titulo={`${etiquetaActual}: ${resultado.concepto.slice(0, 60)}`}
            contenido={`Concepto: ${resultado.concepto}\n\nMedidas: ${resultado.medidas}\n\nPrompt:\n${resultado.prompt}`}
          />
        </div>
      )}
    </section>
  );
}
