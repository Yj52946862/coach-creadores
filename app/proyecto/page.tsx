"use client";

// ============================================================================
// app/proyecto/page.tsx — "Mi Proyecto Personal": el plan, el avance, las
// herramientas para seguir creando, y lo que has guardado.
//
// Client Component porque lee localStorage (navegador). El plan vive en
// localStorage para que PERSISTA aunque cierres la pestaña: así puedes volver
// a tu proyecto y a tu avance otro día, sin cuentas ni base de datos.
// El avance (qué pasos marcaste) y lo guardado también viven en localStorage.
// ============================================================================

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Plan, SegmentoContenido } from "@/lib/tipos";
import { linkDescarga } from "@/lib/herramientas";
import { leerGuardados, borrarGuardado, type ItemGuardado } from "@/lib/guardados";
import AsistentePrimerVideo from "./AsistentePrimerVideo";
import RevisarContenido from "./RevisarContenido";
import ImagenesCanal from "./ImagenesCanal";
import GeneradorIdeas from "./GeneradorIdeas";
import CreadorGuion from "./CreadorGuion";
import CreadorDescripcion from "./CreadorDescripcion";
import GeneradorRapido from "./GeneradorRapido";
import ListaGuion from "./ListaGuion";
import RequiereSesion from "../RequiereSesion";
import {
  Target,
  Smartphone,
  TrendingUp,
  PieChart,
  BarChart3,
  Flame,
  Wrench,
  PenLine,
  Clapperboard,
  Lightbulb,
  Sprout,
  Footprints,
  Users,
  Clock,
  PartyPopper,
  Rocket,
  Bookmark,
  Trash2,
} from "lucide-react";

export default function PaginaResultado() {
  const router = useRouter();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [listo, setListo] = useState(false);
  const [completados, setCompletados] = useState<Set<string>>(new Set());
  const [guardados, setGuardados] = useState<ItemGuardado[]>([]);

  // Al montar: leemos el plan y, si hay avance guardado para ESE plan, lo cargamos.
  useEffect(() => {
    const guardado = localStorage.getItem("plan");
    if (guardado) {
      try {
        const p = JSON.parse(guardado) as Plan;
        // Si el plan guardado está incompleto o corrupto, mostramos el estado
        // vacío en lugar de reventar al dibujar.
        if (!p || !p.nicho || !p.plataforma_principal || !Array.isArray(p.fases)) {
          setPlan(null);
        } else {
          setPlan(p);
          const progresoRaw = localStorage.getItem("coach-progreso");
          if (progresoRaw) {
            const progreso = JSON.parse(progresoRaw);
            if (
              progreso.firma === firmaDePlan(p) &&
              Array.isArray(progreso.completados)
            ) {
              setCompletados(new Set<string>(progreso.completados));
            }
          }
        }
      } catch {
        setPlan(null);
      }
    }
    setListo(true);
  }, []);

  // Marca/desmarca un paso. Usamos la forma "funcional" de setState para que
  // varios clics seguidos no se pisen entre sí.
  function alternarPaso(clave: string) {
    setCompletados((previo) => {
      const nuevo = new Set(previo);
      if (nuevo.has(clave)) nuevo.delete(clave);
      else nuevo.add(clave);
      return nuevo;
    });
  }

  // Cada vez que cambia el avance, lo guardamos en el navegador (atado al plan).
  useEffect(() => {
    if (plan) {
      localStorage.setItem(
        "coach-progreso",
        JSON.stringify({
          firma: firmaDePlan(plan),
          completados: [...completados],
        }),
      );
    }
  }, [completados, plan]);

  // Aparición cinematográfica: cada bloque se revela cuando entra en pantalla,
  // con un leve escalonado entre los que entran juntos. No cambia ninguna
  // lógica: solo el MOMENTO en que se muestra cada tarjeta.
  useEffect(() => {
    if (!plan) return;

    // La consulta del DOM se reintenta unas pocas veces porque este efecto
    // puede ejecutarse ANTES de que el navegador pinte las tarjetas de este
    // mismo render (React a veces corre los efectos de un commit antes de que
    // ese commit esté reflejado en el DOM que consulta querySelectorAll). Sin
    // este reintento, la consulta encontraba 0 elementos, el efecto salía
    // temprano sin registrar el observer NI la red de seguridad de 1.5s, y
    // como el arreglo de dependencias no volvía a cambiar de valor
    // (guardados.length se queda en 0 si no hay nada guardado), el efecto
    // jamás se reintentaba solo: la página quedaba con opacity:0 para
    // siempre. Se usa setTimeout (no requestAnimationFrame) porque rAF se
    // pausa en pestañas en segundo plano y no queremos depender de que la
    // pestaña esté visible en el momento exacto del montaje.
    let observador: IntersectionObserver | null = null;
    let fallback: number | null = null;
    let intentoId: number | null = null;
    let cancelado = false;

    const selector =
      ".con-reveal .resumen, .con-reveal .ficha, .con-reveal .avance, .con-reveal .tarjeta, .con-reveal .zona-titulo, .con-reveal .titulo-fases";

    const intentar = (intentosRestantes: number) => {
      if (cancelado) return;
      const items = Array.from(document.querySelectorAll<HTMLElement>(selector));
      if (items.length === 0) {
        if (intentosRestantes > 0) {
          intentoId = window.setTimeout(() => intentar(intentosRestantes - 1), 100);
        }
        return;
      }

      const revelarTodo = () =>
        items.forEach((el) => el.classList.add("revelado"));

      // Si el navegador no soporta IntersectionObserver, mostramos todo de una.
      if (typeof IntersectionObserver === "undefined") {
        revelarTodo();
        return;
      }

      observador = new IntersectionObserver(
        (entradas) => {
          let i = 0;
          for (const entrada of entradas) {
            if (!entrada.isIntersecting) continue;
            const el = entrada.target as HTMLElement;
            const retraso = Math.min(i, 6) * 55; // escalonado, tope ~330ms
            el.style.transitionDelay = `${retraso}ms`;
            el.classList.add("revelado");
            observador?.unobserve(el);
            // Limpiamos el retraso tras la entrada, para que el hover no se sienta lento.
            window.setTimeout(() => {
              el.style.transitionDelay = "";
            }, retraso + 700);
            i++;
          }
        },
        { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
      );

      items.forEach((el) => observador?.observe(el));
      // Red de seguridad: si algo impidiera revelar, mostramos todo al 1.5s.
      fallback = window.setTimeout(revelarTodo, 1500);
    };

    intentar(10); // hasta ~1s de reintentos antes de rendirse

    return () => {
      cancelado = true;
      if (intentoId !== null) window.clearTimeout(intentoId);
      observador?.disconnect();
      if (fallback !== null) window.clearTimeout(fallback);
    };
    // Depende también de guardados.length: si aparecen ítems guardados DESPUÉS
    // (al montar o al guardar algo), re-observamos para que también se revelen
    // y no queden invisibles. Solo AGREGAMOS la clase, nunca la quitamos.
  }, [plan, guardados.length]);

  // Lo que has guardado (ideas, guiones, prompts…). Se refresca al montar y cada
  // vez que una herramienta guarda algo (emite el evento "guardados-cambio").
  useEffect(() => {
    const refrescar = () => setGuardados(leerGuardados());
    refrescar();
    window.addEventListener("guardados-cambio", refrescar);
    return () => window.removeEventListener("guardados-cambio", refrescar);
  }, []);

  function borrar(id: string) {
    setGuardados(borrarGuardado(id));
  }

  // Borra el plan, el avance y las respuestas guardadas, y manda de vuelta al
  // diagnóstico en blanco. Lo guardado con las herramientas (ideas, guiones…)
  // NO se toca: es independiente del plan.
  function empezarDeNuevo() {
    const ok = window.confirm(
      "¿Seguro que quieres borrar tu proyecto actual y volver a hacer el diagnóstico? Se perderá tu avance guardado.",
    );
    if (!ok) return;
    localStorage.removeItem("plan");
    localStorage.removeItem("coach-progreso");
    localStorage.removeItem("coach-diagnostico");
    router.push("/descubre");
  }

  if (!listo) return null;

  if (!plan) {
    return (
      <RequiereSesion>
      <main className="contenedor">
        <section className="tarjeta proyecto-vacio">
          <span className="camino-icono">
            <Rocket size={26} strokeWidth={1.75} />
          </span>
          <h1>Aún no tienes un proyecto</h1>
          <p>
            Descubre tu contenido ideal: la IA analiza tus habilidades,
            personalidad e intereses y te arma un plan personalizado, paso a paso.
          </p>
          <Link href="/descubre" className="boton">
            Descubrir mi contenido ideal
          </Link>
        </section>

        <SeccionGuardados items={guardados} onBorrar={borrar} />
      </main>
      </RequiereSesion>
    );
  }

  // Arreglos a prueba de planes incompletos: si falta uno, queda como [].
  const metricas = plan.metricas ?? [];
  const queFunciona = plan.que_funciona_ahora ?? [];
  const fases = plan.fases ?? [];
  const titulos = plan.ejemplos_titulos ?? [];
  const guiones = plan.ejemplos_guiones ?? [];
  const consejos = plan.consejos ?? [];
  const herramientas = plan.herramientas ?? [];
  const analisis = plan.analisis;
  const indicadores = analisis?.indicadores ?? [];
  const mezcla = analisis?.mezcla_contenido ?? [];

  // Cálculo del avance (total de pasos y cuántos están marcados).
  let totalPasos = 0;
  let pasosHechos = 0;
  fases.forEach((f) =>
    (f.pasos ?? []).forEach((_, i) => {
      totalPasos++;
      if (completados.has(`${f.numero}:${i}`)) pasosHechos++;
    }),
  );
  const pct = totalPasos > 0 ? Math.round((pasosHechos / totalPasos) * 100) : 0;

  return (
    <RequiereSesion>
    <main className="contenedor con-reveal">
      <Link href="/" className="enlace-volver">
        ← Volver al inicio
      </Link>

      <div className="cabecera-proyecto">
        <h1 className="titulo-plan">Mi Proyecto Personal</h1>
        <div className="acciones-proyecto">
          <Link href="/descubre" className="enlace-accion">
            <PenLine size={15} strokeWidth={1.9} />
            Editar mis respuestas
          </Link>
          <button
            type="button"
            className="enlace-accion enlace-peligro"
            onClick={empezarDeNuevo}
          >
            <Trash2 size={15} strokeWidth={1.9} />
            Borrar y empezar de nuevo
          </button>
        </div>
      </div>

      {/* CALCULADOR DE AVANCE */}
      {totalPasos > 0 && (
        <section className="avance">
          <div className="avance-cabecera">
            <span className="avance-titulo">Tu avance</span>
            <span className="avance-num">
              {pasosHechos} de {totalPasos} pasos · {pct}%
            </span>
          </div>
          <div
            className="avance-barra"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="avance-relleno" style={{ width: `${pct}%` }} />
          </div>
          <p className="avance-msg">
            {pct === 100
              ? "¡Completaste todo tu plan! Ya eres creador en acción."
              : "Marca cada paso conforme lo logres (abajo, en tu ruta). Vas bien."}
          </p>
        </section>
      )}

      {/* Resumen corto: que la persona sienta que la entendimos */}
      <p className="resumen">{plan.diagnostico_resumen}</p>

      {/* Ficha rápida: lo esencial de un vistazo */}
      <div className="ficha">
        <div className="ficha-item">
          <span className="ficha-icono">
            <Smartphone size={22} strokeWidth={1.75} />
          </span>
          <span className="ficha-label">Plataforma</span>
          <span className="ficha-valor">{plan.plataforma_principal.red}</span>
        </div>
        <div className="ficha-item">
          <span className="ficha-icono">
            <Clapperboard size={22} strokeWidth={1.75} />
          </span>
          <span className="ficha-label">Formato</span>
          <span className="ficha-valor">{plan.plataforma_principal.formato}</span>
        </div>
        {metricas[0] && (
          <div className="ficha-item">
            <span className="ficha-icono">
              <TrendingUp size={22} strokeWidth={1.75} />
            </span>
            <span className="ficha-label">{metricas[0].etiqueta}</span>
            <span className="ficha-valor">{metricas[0].valor}</span>
          </div>
        )}
      </div>

      {/* SIGUIENTE PASO — la acción protagonista, arriba y dominante */}
      <section className="tarjeta siguiente-paso">
        <span className="siguiente-paso-tag">
          <Footprints size={16} strokeWidth={2} /> Tu siguiente paso
        </span>
        <p className="siguiente-paso-texto">{plan.primer_paso_hoy}</p>
      </section>

      {/* GUARDADO: lo que has coleccionado con las herramientas */}
      <SeccionGuardados items={guardados} onBorrar={borrar} />

      <h2 className="zona-titulo">Tu perfil creativo</h2>

      <section className="tarjeta">
        <h2>
          <Target size={20} strokeWidth={1.75} /> Tu nicho
        </h2>
        <p className="destacado">{plan.nicho.definicion}</p>
        <p>{plan.nicho.porque_para_ti}</p>
        <p className="frase">“{plan.nicho.frase_posicionamiento}”</p>
      </section>

      <section className="tarjeta">
        <h2>
          <Smartphone size={20} strokeWidth={1.75} /> Por qué esa plataforma
        </h2>
        <p>{plan.plataforma_principal.porque}</p>
      </section>

      {/* DIAGNÓSTICO VISUAL: anillos de porcentaje (estimaciones del coach) */}
      {indicadores.length > 0 && (
        <section className="tarjeta">
          <h2>
            <TrendingUp size={20} strokeWidth={1.75} /> Diagnóstico de tu
            oportunidad
          </h2>
          <p className="nota-estimacion">
            Estimaciones del coach para orientarte (no son datos en tiempo real).
          </p>
          <div className="anillos-grid">
            {indicadores.map((ind, i) => (
              <Anillo
                key={i}
                porcentaje={ind.porcentaje}
                nombre={ind.nombre}
                nota={ind.nota}
              />
            ))}
          </div>
          {analisis?.publico_potencial && (
            <p className="publico-potencial">
              <Users
                size={16}
                strokeWidth={1.9}
                style={{ verticalAlign: "-3px", marginRight: "6px" }}
              />
              <strong>Público potencial:</strong> {analisis.publico_potencial}
            </p>
          )}
        </section>
      )}

      {/* DONA: mezcla de contenido recomendada */}
      {mezcla.length > 0 && (
        <section className="tarjeta">
          <h2>
            <PieChart size={20} strokeWidth={1.75} /> Tu mezcla de contenido
          </h2>
          <Dona segmentos={mezcla} />
        </section>
      )}

      {/* MÉTRICAS: números concretos, en mosaico para que se lean claro */}
      {metricas.length > 0 && (
        <section className="tarjeta">
          <h2>
            <BarChart3 size={20} strokeWidth={1.75} /> Tus métricas y metas
          </h2>
          <div className="metricas-grid">
            {metricas.map((m, i) => (
              <div className="metrica" key={i}>
                <p className="metrica-etiqueta">{m.etiqueta}</p>
                <p className="metrica-valor">{m.valor}</p>
                <p className="metrica-detalle">{m.detalle}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {queFunciona.length > 0 && (
        <section className="tarjeta">
          <h2>
            <Flame size={20} strokeWidth={1.75} /> Lo que funciona hoy
          </h2>
          <ul>
            {queFunciona.map((insight, i) => (
              <li key={i}>{insight}</li>
            ))}
          </ul>
        </section>
      )}

      {herramientas.length > 0 && (
        <section className="tarjeta">
          <h2>
            <Wrench size={20} strokeWidth={1.75} /> Herramientas que vas a usar
          </h2>
          <p className="nota-estimacion">
            Descárgalas para tus primeros pasos. Cada botón te lleva al sitio
            oficial.
          </p>
          <ul className="lista-herramientas">
            {herramientas.map((h, i) => {
              const { url, oficial } = linkDescarga(h.nombre);
              return (
                <li className="herramienta" key={i}>
                  <div className="herramienta-info">
                    <span className="herramienta-nombre">{h.nombre}</span>
                    <span className="herramienta-para">{h.para}</span>
                  </div>
                  <a
                    className="herramienta-link"
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {oficial ? "Descargar →" : "Buscar →"}
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <h2 className="zona-titulo">Empieza a crear con IA</h2>

      {/* ASISTENTE INTERACTIVO: te lleva de la mano a hacer tu primer video */}
      <AsistentePrimerVideo plan={plan} />

      {/* REVISIÓN: pega tu contenido y la IA te dice qué mejorar */}
      <RevisarContenido plan={plan} />

      {/* IMÁGENES: concepto + medidas + prompt para perfil, banner o marca de agua */}
      <ImagenesCanal plan={plan} />

      {/* SIGUE AVANZANDO: genera más contenido, ya personalizado con tu perfil */}
      <h2 className="zona-titulo">Sigue avanzando</h2>
      <p className="zona-intro">
        Genera más contenido a la medida de tu proyecto y guárdalo aquí mismo.
      </p>
      <GeneradorIdeas plan={plan} />
      <GeneradorRapido plan={plan} />
      <CreadorGuion plan={plan} />
      <CreadorDescripcion plan={plan} />

      {/* TU RUTA: cada paso es una casilla que marcas para ver tu avance */}
      {fases.length > 0 && (
        <>
          <h2 className="titulo-fases">Tu ruta, fase por fase</h2>
          {fases.map((fase) => {
            const pasos = fase.pasos ?? [];
            const hechosFase = pasos.filter((_, i) =>
              completados.has(`${fase.numero}:${i}`),
            ).length;
            const faseCompleta = pasos.length > 0 && hechosFase === pasos.length;
            return (
              <section
                className={"tarjeta fase" + (faseCompleta ? " fase-completa" : "")}
                key={fase.numero}
              >
                <h3>
                  <span className="numero-fase">Fase {fase.numero}</span>{" "}
                  {fase.titulo}
                  {pasos.length > 0 && (
                    <span className="fase-conteo">
                      {hechosFase}/{pasos.length}
                    </span>
                  )}
                </h3>
                <p className="objetivo-fase">{fase.objetivo}</p>
                <ol className="pasos">
                  {pasos.map((paso, i) => {
                    const clave = `${fase.numero}:${i}`;
                    const hecho = completados.has(clave);
                    return (
                      <li
                        key={i}
                        className={"paso" + (hecho ? " paso-hecho" : "")}
                      >
                        <label className="paso-check">
                          <input
                            type="checkbox"
                            checked={hecho}
                            onChange={() => alternarPaso(clave)}
                          />
                          <div>
                            <p className="paso-que">{paso.que}</p>
                            <p className="paso-como">{paso.como}</p>
                            <span className="paso-tiempo">
                              <Clock size={14} strokeWidth={2} />
                              {paso.tiempo_estimado}
                            </span>
                          </div>
                        </label>
                      </li>
                    );
                  })}
                </ol>
                {faseCompleta && (
                  <p className="fase-festejo">
                    <PartyPopper size={16} strokeWidth={1.9} /> ¡Fase completa!
                    Sigue así.
                  </p>
                )}
              </section>
            );
          })}
        </>
      )}

      {titulos.length > 0 && (
        <section className="tarjeta">
          <h2>
            <PenLine size={20} strokeWidth={1.75} /> Ejemplos de títulos
          </h2>
          <ul className="lista-titulos">
            {titulos.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </section>
      )}

      {guiones.length > 0 && (
        <section className="tarjeta">
          <h2>
            <Clapperboard size={20} strokeWidth={1.75} /> Ejemplos de guion
          </h2>
          {guiones.map((g, i) => (
            <div className="guion-card" key={i}>
              <p className="guion-titulo">{g.titulo}</p>
              <ListaGuion segmentos={g.guion} />
            </div>
          ))}
        </section>
      )}

      {consejos.length > 0 && (
        <section className="tarjeta">
          <h2>
            <Lightbulb size={20} strokeWidth={1.75} /> Consejos
          </h2>
          <ul>
            {consejos.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="tarjeta">
        <h2>
          <Sprout size={20} strokeWidth={1.75} /> Qué esperar
        </h2>
        <p>{plan.expectativa_realista}</p>
      </section>

    </main>
    </RequiereSesion>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────

// Firma corta y estable del plan, para atar el avance a ESTE plan. Si generas
// uno nuevo, la firma cambia y el avance empieza limpio.
function firmaDePlan(p: Plan): string {
  const base = (p.diagnostico_resumen ?? "") + "|" + (p.nicho?.definicion ?? "");
  let h = 0;
  for (let i = 0; i < base.length; i++) {
    h = (Math.imul(h, 31) + base.charCodeAt(i)) | 0;
  }
  return String(h);
}

// La lista de lo que has guardado con las herramientas. Se oculta si está vacía.
function SeccionGuardados({
  items,
  onBorrar,
}: {
  items: ItemGuardado[];
  onBorrar: (id: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <>
      <h2 className="zona-titulo">Guardado en tu proyecto</h2>
      <section className="tarjeta guardados">
        <ul className="lista-guardados">
          {items.map((it) => (
            <li key={it.id} className="guardado-item">
              <div className="guardado-info">
                <span className="guardado-tipo">
                  <Bookmark size={13} strokeWidth={2} /> {it.tipo}
                </span>
                <p className="guardado-titulo">{it.titulo}</p>
                <p className="guardado-contenido">{it.contenido}</p>
              </div>
              <button
                type="button"
                className="guardado-borrar"
                aria-label="Borrar de guardados"
                onClick={() => onBorrar(it.id)}
              >
                <Trash2 size={16} strokeWidth={1.9} />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

// ── Componentes de gráficos (SVG puro, sin librerías) ───────────────────────

// Un anillo de progreso: dibuja un círculo y "rellena" el porcentaje con
// stroke-dasharray (el truco clásico para gráficos circulares en SVG).
function Anillo({
  porcentaje,
  nombre,
  nota,
}: {
  porcentaje: number;
  nombre: string;
  nota: string;
}) {
  const r = 32;
  const circunferencia = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, Math.round(porcentaje)));
  const offset = circunferencia * (1 - pct / 100);
  return (
    <div className="anillo">
      <svg
        viewBox="0 0 80 80"
        className="anillo-svg"
        role="img"
        aria-label={`${nombre}: ${pct}%`}
      >
        <circle cx="40" cy="40" r={r} className="anillo-fondo" />
        <circle
          cx="40"
          cy="40"
          r={r}
          className="anillo-progreso"
          strokeDasharray={circunferencia}
          strokeDashoffset={offset}
          transform="rotate(-90 40 40)"
        />
        <text
          x="40"
          y="40"
          textAnchor="middle"
          dominantBaseline="central"
          className="anillo-pct"
        >
          {pct}%
        </text>
      </svg>
      <p className="anillo-nombre">{nombre}</p>
      <p className="anillo-nota">{nota}</p>
    </div>
  );
}

// Una dona: cada segmento es un círculo con un "trozo" de borde pintado,
// colocado con stroke-dashoffset para que se acomoden uno tras otro.
function Dona({ segmentos }: { segmentos: SegmentoContenido[] }) {
  const r = 30;
  const circunferencia = 2 * Math.PI * r;
  const colores = ["#dd3c2d", "#ef7a68", "#f7b0a4", "#9a9aa2", "#c9c7c0"];
  let inicio = 0; // fracción acumulada (0 a 1) donde empieza cada segmento
  return (
    <div className="dona-wrap">
      <svg
        viewBox="0 0 80 80"
        className="dona-svg"
        role="img"
        aria-label="Mezcla de contenido recomendada"
      >
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke="var(--borde)"
          strokeWidth="14"
        />
        {segmentos.map((s, i) => {
          const frac = Math.max(0, s.porcentaje) / 100;
          const trazo = frac * circunferencia;
          const segmento = (
            <circle
              key={i}
              cx="40"
              cy="40"
              r={r}
              fill="none"
              stroke={colores[i % colores.length]}
              strokeWidth="14"
              strokeDasharray={`${trazo} ${circunferencia}`}
              strokeDashoffset={-inicio * circunferencia}
              transform="rotate(-90 40 40)"
            />
          );
          inicio += frac;
          return segmento;
        })}
      </svg>
      <ul className="dona-leyenda">
        {segmentos.map((s, i) => (
          <li key={i}>
            <span
              className="dona-punto"
              style={{ background: colores[i % colores.length] }}
            />
            {s.etiqueta} <strong>{s.porcentaje}%</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
