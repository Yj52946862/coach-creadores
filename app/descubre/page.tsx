"use client";

// ============================================================================
// app/page.tsx — El onboarding del coach: una conversación guiada PASO A PASO.
//
// "use client" porque usa estado (useState) y eventos. En vez de mostrar todo
// el formulario de golpe, mostramos UN paso a la vez (con barra de progreso y
// botones Atrás/Continuar), para que se sienta como un coach que te acompaña.
// Ninguna pregunta es obligatoria.
// ============================================================================

import { createContext, useContext, useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, ArrowRight, Check, Globe, Pencil } from "lucide-react";
import {
  GENEROS,
  EDADES,
  TIPOS_CONTENIDO,
  COMODIDADES_CAMARA,
  ESTILOS_COMUNICAR,
  ALCANCES,
  OBJETIVOS,
  PLATAFORMAS,
  TIEMPOS_ESPERADOS,
  HORAS_POR_SEMANA,
  PRESUPUESTOS,
  EQUIPOS,
  type Diagnostico,
  type PlanParte1,
  type PlanParte2,
  type PlanParte3,
} from "@/lib/tipos";
import { leerIdioma, nombreIdioma } from "@/lib/idioma";
import ProgresoCarga from "../ProgresoCarga";
import RequiereSesion from "../RequiereSesion";

// Respuestas rápidas para las preguntas de texto libre.
const SUGERENCIAS_TEMAS = [
  "Cocina y recetas",
  "Finanzas personales",
  "Fitness y salud",
  "Tecnología",
  "Videojuegos",
  "Belleza y moda",
  "Crianza y familia",
  "Estudio e idiomas",
  "Negocios y emprender",
  "Viajes",
  "Arte y manualidades",
  "Desarrollo personal",
  "Mascotas",
  "Marketing digital",
  "Programación",
  "Diseño gráfico",
  "Música",
  "Fotografía",
  "Cine y series",
  "Historia",
  "Psicología",
  "Deportes",
  "Autos y motos",
  "Comedia y humor",
];

const SUGERENCIAS_AYUDA = [
  "Recomendaciones de qué comprar",
  "Resolver dudas o problemas",
  "Consejos prácticos",
  "Organizarse mejor",
  "Aprender algo nuevo",
  "Ahorrar dinero o invertir",
  "Motivación y ánimo",
  "Opiniones honestas",
  "Elegir qué ver o escuchar",
  "Resolver problemas técnicos",
  "Consejos de relaciones",
  "Rutinas de ejercicio",
  "Recetas rápidas y fáciles",
  "Cómo vestir o combinar looks",
  "Crianza y familia",
  "Viajar gastando poco",
  "Estudiar o prepararse para exámenes",
  "Conseguir trabajo o mejorar el CV",
  "Emprender o vender algo",
  "Cuidar su piel o rutina de belleza",
];

// Estado inicial: género y edad sin elegir; el resto, la primera opción.
const INICIAL: Diagnostico = {
  genero: "",
  edad: "",
  edadExacta: "",
  tipoContenido: TIPOS_CONTENIDO[0],
  comodidadCamara: COMODIDADES_CAMARA[0],
  estiloComunicar: ESTILOS_COMUNICAR[0],
  temasQueSabes: "",
  teBuscanPara: "",
  experienciaDistintiva: "",
  ubicacion: "",
  idioma: "español",
  alcance: ALCANCES[0],
  objetivo: OBJETIVOS[0],
  tiempoEsperado: TIEMPOS_ESPERADOS[0],
  plataformaDeseada: PLATAFORMAS[0],
  horasPorSemana: HORAS_POR_SEMANA[0],
  presupuesto: PRESUPUESTOS[0],
  equipo: EQUIPOS[0],
};

const TOTAL_PASOS = 6;

// Comparte el id del texto de la pregunta con los controles que van adentro
// (para etiquetar cada control con aria-labelledby).
const IdEtiquetaContext = createContext<string | undefined>(undefined);

export default function PaginaDiagnostico() {
  const router = useRouter();
  const [d, setD] = useState<Diagnostico>(INICIAL); // "d" = el diagnóstico actual
  const [paso, setPaso] = useState(0); // paso del onboarding (0 a 5)
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [idiomaActual, setIdiomaActual] = useState("es");
  const [editando, setEditando] = useState(false);
  const [planViejoSinDiagnostico, setPlanViejoSinDiagnostico] = useState(false);

  // El plan se arma en 3 partes más chicas (en vez de una sola llamada
  // grande) para que cada una tarde menos y no arriesgue el límite de tiempo
  // de Vercel. "etapa" cuenta cuántas partes ya están listas (0, 1, 2 o 3);
  // entre cada una, la persona le da a "Ver más de mi plan" para pedir la
  // siguiente. Al completar la 3 armamos el Plan completo y navegamos a
  // /proyecto exactamente como antes.
  const [etapa, setEtapa] = useState<0 | 1 | 2 | 3>(0);
  const [parte1, setParte1] = useState<PlanParte1 | null>(null);
  const [parte2, setParte2] = useState<PlanParte2 | null>(null);
  const [parte3, setParte3] = useState<PlanParte3 | null>(null);
  const [diagnosticoEnviado, setDiagnosticoEnviado] = useState<Diagnostico | null>(null);

  // Solo para mostrar la nota informativa del Paso 4 — el idioma real ya no
  // se pregunta aquí, se decide con el selector global del Nav (ver enviar()).
  useEffect(() => {
    setIdiomaActual(leerIdioma());
    const refrescar = () => setIdiomaActual(leerIdioma());
    window.addEventListener("idioma-cambio", refrescar);
    return () => window.removeEventListener("idioma-cambio", refrescar);
  }, []);

  // Si ya contestaste antes, precargamos tus respuestas para que puedas
  // editarlas en vez de empezar en blanco (se guardan al enviar, ver enviar()).
  useEffect(() => {
    const guardado = localStorage.getItem("coach-diagnostico");
    if (guardado) {
      try {
        const previo = JSON.parse(guardado) as Diagnostico;
        setD({ ...INICIAL, ...previo });
        setEditando(true);
        return;
      } catch {
        // Datos corruptos: seguimos con el formulario en blanco, sin avisar.
      }
    }
    // No hay respuestas guardadas. Si YA existe un plan, es porque se generó
    // antes de que empezáramos a guardar el diagnóstico (función nueva) — se
    // lo avisamos para que no piense que el formulario se vació solo.
    if (localStorage.getItem("plan")) {
      setPlanViejoSinDiagnostico(true);
    }
  }, []);

  // Sugerimos la zona automáticamente (por IP, sin pedir permiso de
  // ubicación) para no hacerla escribir algo tan obvio. Sigue siendo 100%
  // editable: si el campo ya tiene algo (porque la persona ya escribió o
  // porque se precargó de una respuesta anterior) no lo pisamos. Si el
  // servicio falla o tarda, el campo simplemente se queda en blanco, igual
  // que antes de este cambio.
  useEffect(() => {
    fetch("https://ipapi.co/json/")
      .then((r) => (r.ok ? r.json() : null))
      .then((info: { city?: string; country_name?: string } | null) => {
        if (!info?.city || !info?.country_name) return;
        const zona = `${info.city}, ${info.country_name}`;
        setD((previo) => (previo.ubicacion ? previo : { ...previo, ubicacion: zona }));
      })
      .catch(() => {
        // Sin internet, servicio caído o bloqueado: se queda en blanco.
      });
  }, []);

  function actualizar<K extends keyof Diagnostico>(
    campo: K,
    valor: Diagnostico[K],
  ) {
    setD((previo) => ({ ...previo, [campo]: valor }));
  }

  function siguiente() {
    setPaso((p) => Math.min(TOTAL_PASOS - 1, p + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function anterior() {
    setPaso((p) => Math.max(0, p - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    // El idioma ya no se pregunta en el formulario: se toma del selector
    // global del Nav en el momento de enviar (ver useEffect de arriba).
    const diagnosticoFinal: Diagnostico = { ...d, idioma: leerIdioma() };
    setDiagnosticoEnviado(diagnosticoFinal);
    pedirParte(1, diagnosticoFinal);
  }

  // Pide UNA parte del plan (1, 2 o 3). Se llama sola al enviar el
  // diagnóstico (parte 1) y de nuevo cada vez que la persona le da a "Ver más
  // de mi plan" (parte 2, luego 3). `diagnosticoOverride` solo hace falta en
  // la primera llamada: `setDiagnosticoEnviado` de arriba todavía no se
  // reflejó en el estado cuando esta función arranca, así que se lo pasamos
  // directo para no leer un valor viejo.
  async function pedirParte(numero: 1 | 2 | 3, diagnosticoOverride?: Diagnostico) {
    const diagnosticoActual = diagnosticoOverride ?? diagnosticoEnviado;
    if (!diagnosticoActual) return; // no debería pasar: no hay parte sin haber enviado antes
    setError(null);
    setCargando(true);
    try {
      // A partir de la parte 2 le mandamos lo ya decidido antes, para que
      // Claude no contradiga el nicho, la plataforma o las fases ya generadas.
      const previo =
        numero === 2 ? parte1 : numero === 3 ? { ...parte1, ...parte2 } : undefined;
      const respuesta = await fetch("/api/generar-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ diagnostico: diagnosticoActual, parte: numero, previo }),
      });
      if (!respuesta.ok) {
        const detalle = await respuesta.json().catch(() => null);
        throw new Error(detalle?.error ?? "No se pudo generar esa parte del plan.");
      }
      const datos = await respuesta.json();
      if (numero === 1) setParte1(datos);
      if (numero === 2) setParte2(datos);
      if (numero === 3) setParte3(datos);
      setEtapa(numero);

      if (numero === 3) {
        // Ya están las 3 partes: armamos el Plan completo y seguimos EXACTO
        // igual que antes (localStorage + redirigir a Mi Proyecto).
        const planCompleto = { ...parte1, ...parte2, ...datos };
        localStorage.setItem("plan", JSON.stringify(planCompleto));
        localStorage.setItem("coach-diagnostico", JSON.stringify(diagnosticoActual));
        router.push("/proyecto");
        return; // dejamos "cargando" en true a propósito hasta que cambie de página
      }
      setCargando(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal.");
      setCargando(false);
    }
  }

  const esUltimo = paso === TOTAL_PASOS - 1;
  // Mientras se arma el plan (desde que se manda el diagnóstico hasta que las
  // 3 partes están listas) se oculta el formulario y se muestra el panel de
  // generación por etapas en su lugar. OJO: se basa en si YA se envió el
  // diagnóstico (no en "etapa"/"cargando"), porque si la parte 1 falla, etapa
  // sigue en 0 y cargando vuelve a false — si el chequeo fuera por esos dos,
  // el formulario reaparecería en vez de mostrar el error con su reintentar.
  const mostrarFormulario = diagnosticoEnviado === null;
  // Si algo falla a medio camino, "reintentar" vuelve a pedir la MISMA parte
  // que falló (etapa todavía no avanza en un error, así que etapa+1 es
  // siempre la parte pendiente).
  const proximaParte = Math.min(etapa + 1, 3) as 1 | 2 | 3;

  function mensajeCarga(): string {
    if (etapa === 0) return "Tu coach está pensando tu diagnóstico y tu dirección…";
    if (etapa === 1) return "Tu coach está armando tu ruta, fase por fase…";
    if (etapa === 2) return "Tu coach está preparando ejemplos y herramientas…";
    return "¡Ya casi! Preparando tu proyecto…";
  }

  return (
    <RequiereSesion>
    <main className="contenedor">
      <header className="encabezado">
        <h1>Tu coach para empezar a crear</h1>
        <p className="subtitulo">
          Te haré unas preguntas para armar tu plan. Responde lo que quieras —no
          tienes que llenar todo— y avanza a tu ritmo.
        </p>
        {editando && (
          <p className="nota-idioma">
            <Pencil size={15} strokeWidth={1.9} />
            Precargamos tus respuestas anteriores — cambia lo que quieras y
            genera un plan nuevo al final.
          </p>
        )}
        {planViejoSinDiagnostico && (
          <p className="nota-idioma">
            <AlertCircle size={15} strokeWidth={1.9} />
            Tu proyecto actual se generó antes de que empezáramos a guardar
            tus respuestas, así que no podemos precargarlas aquí — contesta de
            nuevo para actualizar tu plan. De ahora en adelante sí vamos a
            poder recordarlas.
          </p>
        )}
      </header>

      {mostrarFormulario && (
      <>
      {/* Progreso del onboarding */}
      <div className="onboarding-progreso">
        <div className="onboarding-pasos-texto">
          Paso {paso + 1} de {TOTAL_PASOS}
        </div>
        <div
          className="onboarding-barra"
          role="progressbar"
          aria-valuenow={paso + 1}
          aria-valuemin={1}
          aria-valuemax={TOTAL_PASOS}
        >
          <div
            className="onboarding-relleno"
            style={{ width: `${((paso + 1) / TOTAL_PASOS) * 100}%` }}
          />
        </div>
      </div>

      <form onSubmit={enviar} className="formulario">
        {/* PASO 1 — Sobre ti */}
        {paso === 0 && (
          <fieldset className="capa">
            <legend>Sobre ti</legend>
            <p className="paso-intro">
              Empecemos por lo básico. Nos ayuda a ajustar el tono y los ejemplos.
            </p>

            <Pregunta etiqueta="¿Con qué género te identificas?">
              <GrupoBotones
                valor={d.genero}
                opciones={GENEROS}
                onChange={(v) => actualizar("genero", v)}
              />
            </Pregunta>

            <Pregunta etiqueta="¿Qué edad tienes?">
              <GrupoBotones
                valor={d.edad}
                opciones={EDADES}
                onChange={(v) => actualizar("edad", v)}
              />
            </Pregunta>

            <Pregunta etiqueta="¿Prefieres poner tu edad exacta? (opcional)">
              <input
                type="text"
                inputMode="numeric"
                maxLength={3}
                className="edad-exacta"
                aria-label="Edad exacta"
                value={d.edadExacta}
                onChange={(e) =>
                  actualizar("edadExacta", e.target.value.replace(/[^0-9]/g, ""))
                }
                placeholder="Ej. 27"
              />
            </Pregunta>
          </fieldset>
        )}

        {/* PASO 2 — Quién eres */}
        {paso === 1 && (
          <fieldset className="capa">
            <legend>Quién eres</legend>
            <p className="paso-intro">
              ¿Cómo te sientes frente a la cámara y cómo comunicas? Esto define el
              formato que sí vas a sostener.
            </p>

            <Pregunta etiqueta="¿Qué tipo de contenido disfrutas más?">
              <Selector
                valor={d.tipoContenido}
                opciones={TIPOS_CONTENIDO}
                onChange={(v) => actualizar("tipoContenido", v)}
              />
            </Pregunta>

            <Pregunta etiqueta="¿Qué tan cómodo te sientes frente a cámara?">
              <Selector
                valor={d.comodidadCamara}
                opciones={COMODIDADES_CAMARA}
                onChange={(v) => actualizar("comodidadCamara", v)}
              />
            </Pregunta>

            <Pregunta etiqueta="¿Cómo te describirías comunicando?">
              <Selector
                valor={d.estiloComunicar}
                opciones={ESTILOS_COMUNICAR}
                onChange={(v) => actualizar("estiloComunicar", v)}
              />
            </Pregunta>
          </fieldset>
        )}

        {/* PASO 3 — Qué ya traes */}
        {paso === 2 && (
          <fieldset className="capa">
            <legend>Qué ya traes</legend>
            <p className="paso-intro">
              Lo más importante: lo que ya sabes. De aquí sale tu ventaja real.
            </p>

            <Pregunta etiqueta="¿En qué temas sabes más que la persona promedio?">
              <ChipsSugerencia
                valor={d.temasQueSabes}
                sugerencias={SUGERENCIAS_TEMAS}
                onChange={(v) => actualizar("temasQueSabes", v)}
              />
              <CampoArea
                valor={d.temasQueSabes}
                onChange={(v) => actualizar("temasQueSabes", v)}
                placeholder="Toca arriba o escribe lo tuyo. Ej. cocina rápida y barata, finanzas para jóvenes…"
              />
            </Pregunta>

            <Pregunta etiqueta="¿Para qué te pide ayuda o consejo la gente?">
              <ChipsSugerencia
                valor={d.teBuscanPara}
                sugerencias={SUGERENCIAS_AYUDA}
                onChange={(v) => actualizar("teBuscanPara", v)}
              />
              <CampoArea
                valor={d.teBuscanPara}
                onChange={(v) => actualizar("teBuscanPara", v)}
                placeholder="Toca arriba o escribe lo tuyo. Ej. para elegir una laptop, para organizar sus gastos…"
              />
            </Pregunta>

            <Pregunta etiqueta="¿Tienes alguna experiencia o historia que te distinga? (opcional)">
              <CampoArea
                valor={d.experienciaDistintiva}
                onChange={(v) => actualizar("experienciaDistintiva", v)}
                placeholder="Ej. salí de deudas en un año, trabajé 10 años en restaurantes…"
              />
            </Pregunta>
          </fieldset>
        )}

        {/* PASO 4 — Contexto y zona */}
        {paso === 3 && (
          <fieldset className="capa">
            <legend>Contexto y zona</legend>
            <p className="paso-intro">
              ¿Desde dónde creas? Tu zona puede ser tu ventaja injusta.
            </p>

            <Pregunta etiqueta="¿Dónde vives? (ciudad y país)">
              <CampoTexto
                valor={d.ubicacion}
                onChange={(v) => actualizar("ubicacion", v)}
                placeholder="Ej. Guadalajara, México"
              />
              <span className="campo-ayuda">
                Detectamos tu zona aproximada — cámbiala si no es correcta.
              </span>
            </Pregunta>

            <p className="nota-idioma">
              <Globe size={15} strokeWidth={1.9} />
              Vas a crear en <strong>{nombreIdioma(idiomaActual)}</strong> —
              cámbialo arriba, en la navegación.
            </p>

            <Pregunta etiqueta="¿Para quién es tu contenido?">
              <Selector
                valor={d.alcance}
                opciones={ALCANCES}
                onChange={(v) => actualizar("alcance", v)}
              />
            </Pregunta>
          </fieldset>
        )}

        {/* PASO 5 — Meta y porqué */}
        {paso === 4 && (
          <fieldset className="capa">
            <legend>Meta y porqué</legend>
            <p className="paso-intro">
              ¿Qué buscas con esto? Nos sirve para calibrar el plan y las
              expectativas.
            </p>

            <Pregunta etiqueta="¿Cuál es tu objetivo principal?">
              <Selector
                valor={d.objetivo}
                opciones={OBJETIVOS}
                onChange={(v) => actualizar("objetivo", v)}
              />
            </Pregunta>

            <Pregunta etiqueta="¿En cuánto tiempo te gustaría ver tus primeros resultados?">
              <Selector
                valor={d.tiempoEsperado}
                opciones={TIEMPOS_ESPERADOS}
                onChange={(v) => actualizar("tiempoEsperado", v)}
              />
            </Pregunta>

            <Pregunta etiqueta="¿Qué plataforma te llama más?">
              <Selector
                valor={d.plataformaDeseada}
                opciones={PLATAFORMAS}
                onChange={(v) => actualizar("plataformaDeseada", v)}
              />
            </Pregunta>
          </fieldset>
        )}

        {/* PASO 6 — Tus límites reales */}
        {paso === 5 && (
          <fieldset className="capa">
            <legend>Tus límites reales</legend>
            <p className="paso-intro">
              Por último, seamos realistas con tu tiempo y tus recursos. Un plan
              que cabe en tu vida sí se cumple.
            </p>

            <Pregunta etiqueta="¿Cuántas horas por semana puedes dedicar de forma realista?">
              <Selector
                valor={d.horasPorSemana}
                opciones={HORAS_POR_SEMANA}
                onChange={(v) => actualizar("horasPorSemana", v)}
              />
            </Pregunta>

            <Pregunta etiqueta="¿Cuánto puedes invertir al inicio?">
              <Selector
                valor={d.presupuesto}
                opciones={PRESUPUESTOS}
                onChange={(v) => actualizar("presupuesto", v)}
              />
            </Pregunta>

            <Pregunta etiqueta="¿Con qué equipo cuentas?">
              <Selector
                valor={d.equipo}
                opciones={EQUIPOS}
                onChange={(v) => actualizar("equipo", v)}
              />
            </Pregunta>
          </fieldset>
        )}

        {error && (
          <p className="error">
            <AlertCircle size={16} strokeWidth={2} />
            {error}
          </p>
        )}

        {/* Navegación del onboarding */}
        <div className="onboarding-nav">
          {paso > 0 ? (
            <button
              type="button"
              className="boton boton-secundario"
              onClick={anterior}
              disabled={cargando}
            >
              <ArrowLeft size={18} strokeWidth={2} /> Atrás
            </button>
          ) : (
            <span />
          )}

          {esUltimo ? (
            <button type="submit" className="boton" disabled={cargando}>
              {cargando ? "Tu coach está armando tu plan…" : "Generar mi plan"}
            </button>
          ) : (
            <button type="button" className="boton" onClick={siguiente}>
              Continuar <ArrowRight size={18} strokeWidth={2} />
            </button>
          )}
        </div>
      </form>
      </>
      )}

      {!mostrarFormulario && (
        <div className="panel-generacion">
          {cargando ? (
            <>
              <div className="barra-carga-top" aria-hidden="true" />
              <div className="onboarding-progreso">
                <div className="onboarding-pasos-texto">
                  Armando tu plan — parte {Math.min(etapa + 1, 3)} de 3
                </div>
                <div
                  className="onboarding-barra"
                  role="progressbar"
                  aria-valuenow={etapa}
                  aria-valuemin={0}
                  aria-valuemax={3}
                >
                  <div
                    className="onboarding-relleno"
                    style={{ width: `${(etapa / 3) * 100}%` }}
                  />
                </div>
              </div>
              <ProgresoCarga mensaje={mensajeCarga()} />
            </>
          ) : error ? (
            <>
              <p className="error">
                <AlertCircle size={16} strokeWidth={2} />
                {error}
              </p>
              <button className="boton" onClick={() => pedirParte(proximaParte)}>
                Reintentar
              </button>
            </>
          ) : etapa === 1 && parte1 ? (
            <div className="etapa-lista">
              <p className="etapa-check">
                <Check size={16} strokeWidth={2.5} /> Ya tengo tu nicho:{" "}
                <strong>{parte1.nicho.definicion}</strong>
              </p>
              <p className="etapa-check">
                <Check size={16} strokeWidth={2.5} /> Tu plataforma:{" "}
                <strong>{parte1.plataforma_principal.red}</strong>,{" "}
                {parte1.plataforma_principal.formato}
              </p>
              <button className="boton" onClick={() => pedirParte(2)}>
                Ver mi ruta paso a paso <ArrowRight size={18} strokeWidth={2} />
              </button>
            </div>
          ) : etapa === 2 && parte2 ? (
            <div className="etapa-lista">
              <p className="etapa-check">
                <Check size={16} strokeWidth={2.5} /> Ya tengo tu ruta:{" "}
                {parte2.fases.length} fases, con tus primeros pasos listos
              </p>
              <button className="boton" onClick={() => pedirParte(3)}>
                Ver ejemplos y herramientas <ArrowRight size={18} strokeWidth={2} />
              </button>
            </div>
          ) : null}
        </div>
      )}
    </main>
    </RequiereSesion>
  );
}

// ── Piezas reutilizables del formulario ─────────────────────────────────────

// Una pregunta = su texto arriba (con un id único) y su control debajo. El id
// se comparte por Context para etiquetar el control con aria-labelledby. Usamos
// un <div> (no <label>) a propósito: envolver botones en <label> haría que tocar
// el texto active el primer botón sin querer.
function Pregunta({
  etiqueta,
  children,
}: {
  etiqueta: string;
  children: React.ReactNode;
}) {
  const id = useId();
  return (
    <div className="pregunta">
      <span className="pregunta-texto" id={id}>
        {etiqueta}
      </span>
      <IdEtiquetaContext.Provider value={id}>
        {children}
      </IdEtiquetaContext.Provider>
    </div>
  );
}

// Menú desplegable (para preguntas con varias opciones fijas).
function Selector<T extends string>({
  valor,
  opciones,
  onChange,
}: {
  valor: T;
  opciones: readonly T[];
  onChange: (valor: T) => void;
}) {
  const idEtiqueta = useContext(IdEtiquetaContext);
  return (
    <select
      aria-labelledby={idEtiqueta}
      value={valor}
      onChange={(e) => onChange(e.target.value as T)}
    >
      {opciones.map((opcion) => (
        <option key={opcion} value={opcion}>
          {opcion}
        </option>
      ))}
    </select>
  );
}

// Campo de texto de una línea.
function CampoTexto({
  valor,
  onChange,
  placeholder,
}: {
  valor: string;
  onChange: (valor: string) => void;
  placeholder?: string;
}) {
  const idEtiqueta = useContext(IdEtiquetaContext);
  return (
    <input
      type="text"
      aria-labelledby={idEtiqueta}
      value={valor}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

// Campo de texto de varias líneas.
function CampoArea({
  valor,
  onChange,
  placeholder,
}: {
  valor: string;
  onChange: (valor: string) => void;
  placeholder?: string;
}) {
  const idEtiqueta = useContext(IdEtiquetaContext);
  return (
    <textarea
      aria-labelledby={idEtiqueta}
      value={valor}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

// Grupo de botones: UNA sola respuesta, de un toque. `valor` puede estar vacío
// ("") hasta que el usuario elija. Cada botón anuncia si está activo (aria-pressed).
function GrupoBotones<T extends string>({
  valor,
  opciones,
  onChange,
}: {
  valor: T | "";
  opciones: readonly T[];
  onChange: (valor: T) => void;
}) {
  const idEtiqueta = useContext(IdEtiquetaContext);
  return (
    <div className="grupo-botones" role="group" aria-labelledby={idEtiqueta}>
      {opciones.map((opcion) => (
        <button
          type="button"
          key={opcion}
          className={"chip" + (valor === opcion ? " chip-activo" : "")}
          aria-pressed={valor === opcion}
          onClick={() => onChange(opcion)}
        >
          {opcion}
        </button>
      ))}
    </div>
  );
}

// Sugerencias para texto libre: cada chip se agrega/quita del texto (separado
// por comas). El usuario también puede escribir libremente en el campo.
function ChipsSugerencia({
  valor,
  sugerencias,
  onChange,
}: {
  valor: string;
  sugerencias: string[];
  onChange: (valor: string) => void;
}) {
  const partes = valor
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  function alternar(sugerencia: string) {
    if (partes.includes(sugerencia)) {
      onChange(partes.filter((s) => s !== sugerencia).join(", "));
    } else {
      onChange([...partes, sugerencia].join(", "));
    }
  }

  return (
    <div
      className="grupo-botones sugerencias"
      role="group"
      aria-label="Respuestas rápidas"
    >
      {sugerencias.map((s) => {
        const activo = partes.includes(s);
        return (
          <button
            type="button"
            key={s}
            className={"chip chip-sugerencia" + (activo ? " chip-activo" : "")}
            aria-pressed={activo}
            onClick={() => alternar(s)}
          >
            {activo ? "✓ " : "+ "}
            {s}
          </button>
        );
      })}
    </div>
  );
}
