"use client";

// ============================================================================
// app/RequiereSesion.tsx — Envuelve una página protegida.
//
// Si no hay sesión guardada, muestra un formulario corto (nombre + correo) en
// vez del contenido. No es autenticación real: no hay contraseña ni servidor
// que verifique nada — es solo para que la persona "entre" a su espacio antes
// de usar las herramientas. Se monta directamente en el JSX de cada página
// protegida (/descubre, /herramientas, /proyecto); el HUB y las páginas
// legales quedan fuera, siempre abiertas.
// ============================================================================

import { useEffect, useState } from "react";
import { leerSesion, guardarSesion, type Sesion } from "@/lib/sesion";
import { AlertCircle, ArrowRight } from "lucide-react";

export default function RequiereSesion({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sesion, setSesion] = useState<Sesion | null | "cargando">(
    "cargando",
  );

  useEffect(() => {
    setSesion(leerSesion());
  }, []);

  // Evita un parpadeo del formulario mientras se lee localStorage.
  if (sesion === "cargando") return null;

  if (sesion === null) {
    return <FormularioEntrada onEntrar={setSesion} />;
  }

  return <>{children}</>;
}

function FormularioEntrada({
  onEntrar,
}: {
  onEntrar: (s: Sesion) => void;
}) {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [error, setError] = useState<string | null>(null);

  function entrar(e: React.FormEvent) {
    e.preventDefault();
    const s: Sesion = { nombre, correo };
    if (!guardarSesion(s)) {
      setError("Escribe tu nombre y un correo válido para continuar.");
      return;
    }
    setError(null);
    onEntrar(s);
  }

  return (
    <main className="contenedor">
      <section className="capa entrada-sesion">
        <legend>Antes de seguir</legend>
        <h1 className="entrada-titulo">¿Cómo te llamas?</h1>
        <p className="entrada-sub">
          Solo para identificarte en tu espacio. No creamos una cuenta ni
          pedimos contraseña — se guarda únicamente en este navegador.
        </p>
        <form className="formulario" onSubmit={entrar}>
          <label className="pregunta">
            <span className="pregunta-texto">Tu nombre</span>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Sofía"
              autoFocus
            />
          </label>
          <label className="pregunta">
            <span className="pregunta-texto">Tu correo</span>
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="tucorreo@ejemplo.com"
            />
          </label>

          {error && (
            <p className="error">
              <AlertCircle size={16} strokeWidth={2} />
              {error}
            </p>
          )}

          <button className="boton" type="submit">
            Entrar <ArrowRight size={16} strokeWidth={2} />
          </button>
        </form>
      </section>
    </main>
  );
}
