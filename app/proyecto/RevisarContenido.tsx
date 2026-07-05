"use client";

// ============================================================================
// RevisarContenido.tsx — "Revisa tu contenido con IA".
//
// Generalizado: sirve CON perfil (en Mi Proyecto, personaliza) y SIN perfil (en
// el estudio de herramientas). Revisa TEXTO (idea/guion/título/descripción/hook)
// o una IMAGEN (miniatura/banner/perfil), esto último con visión. Fuentes del
// texto: pegar, subir archivo, o enlace de Drive (preparado para conectar).
// Llama a /api/revisar (que corre en el servidor).
// ============================================================================

import { useState } from "react";
import type { Plan, RevisionContenido } from "@/lib/tipos";
import { contextoDePlan } from "@/lib/contexto";
import { leerIdioma } from "@/lib/idioma";
import { leerImagenRedimensionada, type Referencia } from "@/lib/imagen";
import ProgresoCarga from "../ProgresoCarga";
import GuardarBoton from "./GuardarBoton";
import {
  Search,
  CircleCheck,
  Wrench,
  Sparkles,
  AlertCircle,
  Type,
  Paperclip,
  Link2,
  Image as ImageIcon,
  Check,
} from "lucide-react";

const TIPOS_TEXTO = ["Idea", "Guion", "Título", "Descripción", "Hook"] as const;
const TIPOS_VISUAL = ["Miniatura", "Banner", "Perfil"] as const;
const TODOS = [...TIPOS_TEXTO, ...TIPOS_VISUAL];

type Fuente = "texto" | "archivo" | "drive";

export default function RevisarContenido({
  plan,
  tipoInicial,
  fuenteInicial,
}: {
  plan?: Plan | null;
  tipoInicial?: string;
  fuenteInicial?: Fuente;
}) {
  const [tipo, setTipo] = useState<string>(tipoInicial ?? TIPOS_TEXTO[0]);
  const [fuente, setFuente] = useState<Fuente>(fuenteInicial ?? "texto");
  const [contenido, setContenido] = useState("");
  const [nombreArchivo, setNombreArchivo] = useState<string | null>(null);
  const [driveUrl, setDriveUrl] = useState("");
  const [imagen, setImagen] = useState<Referencia | null>(null);
  const [usarPerfil, setUsarPerfil] = useState(true);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [revision, setRevision] = useState<RevisionContenido | null>(null);

  const esVisual = (TIPOS_VISUAL as readonly string[]).includes(tipo);
  const contexto = plan && usarPerfil ? contextoDePlan(plan) : null;

  async function subirArchivoTexto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const texto = await file.text();
      setContenido(texto);
      setNombreArchivo(file.name);
      setError(null);
    } catch {
      setError("No pude leer ese archivo. Prueba con un .txt o pega el texto.");
    }
  }

  async function subirImagen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setImagen(await leerImagenRedimensionada(file));
      setError(null);
    } catch {
      setError("No se pudo leer esa imagen. Prueba con otra.");
    }
  }

  async function revisar() {
    setError(null);
    setAviso(null);
    if (esVisual && !imagen) {
      setError("Sube la imagen que quieres revisar.");
      return;
    }
    if (!esVisual && !contenido.trim()) {
      setError("Pega, sube o escribe tu contenido primero.");
      return;
    }
    setCargando(true);
    setRevision(null);
    try {
      const r = await fetch("/api/revisar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contexto,
          tipo,
          contenido: esVisual ? "" : contenido,
          imagenBase64: esVisual ? imagen?.base64 ?? null : null,
          mediaType: esVisual ? imagen?.mediaType ?? null : null,
          idioma: leerIdioma(),
        }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => null);
        throw new Error(d?.error ?? "No se pudo revisar.");
      }
      setRevision(await r.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Algo salió mal.");
    } finally {
      setCargando(false);
    }
  }

  // Placeholder honesto de Drive: la UI está lista; leer el archivo directo
  // llegará después (necesita conexión con Google). Por ahora guiamos al usuario.
  function analizarDesdeDrive() {
    setError(null);
    if (!driveUrl.trim()) {
      setError("Pega el enlace de Drive primero.");
      return;
    }
    setAviso(
      "La conexión con Google Drive está en camino. Por ahora, abre tu archivo, copia el texto y pégalo en “Pegar texto” (o súbelo) y lo reviso al instante.",
    );
  }

  const puntaje = Math.max(0, Math.min(100, Math.round(revision?.puntaje ?? 0)));

  return (
    <section className="tarjeta revisar">
      <h2>
        <Search size={20} strokeWidth={1.75} /> Revisa tu contenido con IA
      </h2>
      <p>Pulo tu contenido y lo mejoro con IA.</p>

      {/* Qué tipo de contenido */}
      <div
        className="grupo-botones"
        role="group"
        aria-label="Tipo de contenido a revisar"
      >
        {TODOS.map((t) => (
          <button
            type="button"
            key={t}
            className={"chip" + (tipo === t ? " chip-activo" : "")}
            aria-pressed={tipo === t}
            onClick={() => {
              setTipo(t);
              setRevision(null);
              setError(null);
            }}
          >
            {t}
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

      {/* Zona de entrada: imagen (visual) o texto con fuentes */}
      {esVisual ? (
        <div className="revisar-visual">
          <label className="subir-ref">
            <input type="file" accept="image/*" onChange={subirImagen} />
            <span
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              {imagen ? (
                <>
                  <Check size={15} strokeWidth={2} /> Cambiar imagen
                </>
              ) : (
                <>
                  <ImageIcon size={15} strokeWidth={2} /> Subir tu{" "}
                  {tipo.toLowerCase()}
                </>
              )}
            </span>
          </label>
          {imagen && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imagen.dataUrl}
              alt="Imagen a revisar"
              className="ref-preview"
            />
          )}
        </div>
      ) : (
        <>
          <div
            className="fuente-tabs"
            role="tablist"
            aria-label="De dónde tomar el contenido"
          >
            <button
              type="button"
              role="tab"
              aria-selected={fuente === "texto"}
              className={
                "fuente-tab" + (fuente === "texto" ? " fuente-tab-activo" : "")
              }
              onClick={() => setFuente("texto")}
            >
              <Type size={15} strokeWidth={1.9} /> Pegar texto
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={fuente === "archivo"}
              className={
                "fuente-tab" + (fuente === "archivo" ? " fuente-tab-activo" : "")
              }
              onClick={() => setFuente("archivo")}
            >
              <Paperclip size={15} strokeWidth={1.9} /> Subir archivo
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={fuente === "drive"}
              className={
                "fuente-tab" + (fuente === "drive" ? " fuente-tab-activo" : "")
              }
              onClick={() => setFuente("drive")}
            >
              <Link2 size={15} strokeWidth={1.9} /> Enlace de Drive
            </button>
          </div>

          {fuente === "texto" && (
            <textarea
              aria-label="Tu contenido a revisar"
              value={contenido}
              onChange={(e) => setContenido(e.target.value)}
              placeholder="Pega o escribe aquí tu idea, guion, título, descripción o hook…"
            />
          )}

          {fuente === "archivo" && (
            <div className="fuente-archivo">
              <label className="subir-ref">
                <input
                  type="file"
                  accept=".txt,.md,text/plain,text/markdown"
                  onChange={subirArchivoTexto}
                />
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Paperclip size={15} strokeWidth={2} />
                  {nombreArchivo
                    ? `Archivo: ${nombreArchivo}`
                    : "Subir un archivo de texto (.txt, .md)"}
                </span>
              </label>
              {contenido && (
                <p className="fuente-archivo-preview">
                  {contenido.slice(0, 220)}
                  {contenido.length > 220 ? "…" : ""}
                </p>
              )}
            </div>
          )}

          {fuente === "drive" && (
            <div className="fuente-drive">
              <input
                type="url"
                aria-label="Enlace de Google Drive"
                value={driveUrl}
                onChange={(e) => setDriveUrl(e.target.value)}
                placeholder="Pega el enlace de tu archivo de Drive…"
              />
              <button
                type="button"
                className="boton boton-secundario"
                onClick={analizarDesdeDrive}
              >
                <Link2 size={16} strokeWidth={2} /> Analizar desde enlace
              </button>
              <p className="nota-estimacion">
                Conexión con Google Drive en camino. Mientras tanto, pega o sube
                el contenido y lo reviso al instante.
              </p>
            </div>
          )}
        </>
      )}

      {error && (
        <p className="error">
          <AlertCircle size={16} strokeWidth={2} />
          {error}
        </p>
      )}
      {aviso && <p className="aviso">{aviso}</p>}

      {/* Botón de revisar (en la pestaña Drive el botón es el de arriba) */}
      {!(fuente === "drive" && !esVisual) && (
        <button className="boton" onClick={revisar} disabled={cargando}>
          {cargando ? "Revisando…" : "Revisar con IA"}
        </button>
      )}

      {cargando && (
        <ProgresoCarga mensaje="Leyendo tu contenido y buscando qué mejorar…" />
      )}

      {revision && (
        <div className="revision">
          <div className="revision-puntaje">
            <span className="revision-num">
              {puntaje}
              <small>/100</small>
            </span>
            <div
              className="avance-barra"
              role="progressbar"
              aria-valuenow={puntaje}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="avance-relleno" style={{ width: `${puntaje}%` }} />
            </div>
          </div>
          <p className="revision-veredicto">{revision.veredicto}</p>

          <h3>
            <CircleCheck size={18} strokeWidth={1.75} /> Lo que ya funciona
          </h3>
          <ul>
            {(revision.fortalezas ?? []).map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>

          <h3>
            <Wrench size={18} strokeWidth={1.75} /> Qué mejorar
          </h3>
          <ul>
            {(revision.mejoras ?? []).map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>

          <h3>
            <Sparkles size={18} strokeWidth={1.75} /> Versión mejorada
          </h3>
          <p className="guion-texto">{revision.version_mejorada}</p>

          <GuardarBoton
            tipo={`Revisión · ${tipo}`}
            titulo={`Revisión de ${tipo.toLowerCase()} (${puntaje}/100)`}
            contenido={revision.version_mejorada}
          />
        </div>
      )}
    </section>
  );
}
