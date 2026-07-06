// ============================================================================
// tipos.ts — Las "formas" de los datos de la app.
//
// TypeScript nos deja describir cómo luce cada objeto. Si más adelante
// escribimos mal un campo, el editor nos avisa ANTES de ejecutar.
//
// Definimos dos cosas:
//   1) Diagnostico → lo que el usuario responde en el formulario (la ENTRADA).
//   2) Plan        → lo que Claude devuelve en JSON (la SALIDA).
//
// Truco que usamos abajo: declaramos las opciones como un arreglo `as const` y
// derivamos el tipo de ese arreglo. Así el formulario y el tipo salen de la
// MISMA fuente y nunca se desincronizan.
// ============================================================================

// ── Capa 0: Sobre ti ────────────────────────────────────────────────────────
export const GENEROS = ["Mujer", "Hombre", "Otro / prefiero no decir"] as const;
export type Genero = (typeof GENEROS)[number];

export const EDADES = [
  "Menos de 18",
  "18-24",
  "25-34",
  "35-44",
  "45-54",
  "55 o más",
] as const;
export type Edad = (typeof EDADES)[number];

// ── Capa 1: Quién eres ──────────────────────────────────────────────────────
export const TIPOS_CONTENIDO = [
  "enseñar",
  "entretener",
  "mostrar mi vida",
  "opinar",
  "inspirar",
  "reseñar productos o servicios",
  "documentar un reto o proceso",
  "hacer comedia o sketches",
  "debatir o reaccionar",
  "tutoriales paso a paso",
  "contar historias",
  "vlogs de rutina diaria",
  "hacer unboxing o pruebas",
  "dar consejos prácticos",
  "hacer listas o rankings",
  "responder preguntas (Q&A)",
  "comparar opciones",
  "hacer ASMR o contenido relajante",
] as const;
export type TipoContenido = (typeof TIPOS_CONTENIDO)[number];

export const COMODIDADES_CAMARA = [
  "muy cómodo",
  "con práctica",
  "prefiero no mostrar la cara",
] as const;
export type ComodidadCamara = (typeof COMODIDADES_CAMARA)[number];

export const ESTILOS_COMUNICAR = [
  "energético",
  "calmado",
  "gracioso",
  "analítico",
  "cercano",
] as const;
export type EstiloComunicar = (typeof ESTILOS_COMUNICAR)[number];

// ── Capa 3: Contexto y zona ─────────────────────────────────────────────────
export const ALCANCES = ["mi zona local", "mi país", "global"] as const;
export type Alcance = (typeof ALCANCES)[number];

// ── Capa 4: Meta y porqué ───────────────────────────────────────────────────
export const OBJETIVOS = [
  "ganar dinero",
  "pasión / hobby",
  "autoridad y marca personal",
  "construir comunidad",
] as const;
export type Objetivo = (typeof OBJETIVOS)[number];

export const PLATAFORMAS = [
  "YouTube",
  "Instagram",
  "TikTok",
  "Facebook",
  "no sé, ayúdame a decidir",
] as const;
export type Plataforma = (typeof PLATAFORMAS)[number];

export const TIEMPOS_ESPERADOS = [
  "en 1 mes",
  "en 3 meses",
  "en 6 meses",
  "en 1 año o más",
  "no tengo prisa",
] as const;
export type TiempoEsperado = (typeof TIEMPOS_ESPERADOS)[number];

// ── Capa 5: Límites reales ──────────────────────────────────────────────────
export const HORAS_POR_SEMANA = [
  "menos de 2 horas",
  "2 a 5 horas",
  "5 a 10 horas",
  "más de 10 horas",
] as const;
export type HorasPorSemana = (typeof HORAS_POR_SEMANA)[number];

export const PRESUPUESTOS = ["nada", "poco", "algo"] as const;
export type Presupuesto = (typeof PRESUPUESTOS)[number];

export const EQUIPOS = [
  "solo celular",
  "celular + micrófono",
  "cámara",
  "otro",
] as const;
export type Equipo = (typeof EQUIPOS)[number];

// ── El diagnóstico completo (las capas de la sección 6 del CLAUDE.md) ────────
// Nota: ningún campo es obligatorio en el formulario. Los de texto pueden venir
// vacíos ("") y el cerebro trabaja con lo que haya.
export interface Diagnostico {
  // Capa 0 — Sobre ti (vacío "" si el usuario no elige)
  genero: Genero | "";
  edad: Edad | "";
  edadExacta: string; // opcional: la edad exacta en número, si la quiere precisar

  // Capa 1 — Quién eres
  tipoContenido: TipoContenido;
  comodidadCamara: ComodidadCamara;
  estiloComunicar: EstiloComunicar;

  // Capa 2 — Qué ya traes (texto libre)
  temasQueSabes: string;
  teBuscanPara: string;
  experienciaDistintiva: string;

  // Capa 3 — Contexto y zona
  ubicacion: string;
  idioma: string;
  alcance: Alcance;

  // Capa 4 — Meta y porqué
  objetivo: Objetivo;
  tiempoEsperado: TiempoEsperado;
  plataformaDeseada: Plataforma;

  // Capa 5 — Límites reales
  horasPorSemana: HorasPorSemana;
  presupuesto: Presupuesto;
  equipo: Equipo;
}

// ── El plan que devuelve Claude ─────────────────────────────────────────────
// Estos nombres están en snake_case porque así los escribe Claude en el JSON
// (ver el schema del prompt maestro, sección 8). Al coincidir exactamente,
// usamos la respuesta sin tener que renombrar nada.
export interface Paso {
  que: string;
  como: string;
  tiempo_estimado: string;
}

export interface Fase {
  numero: number;
  titulo: string;
  objetivo: string;
  pasos: Paso[];
}

// Una métrica = un número/objetivo concreto, para que el plan sea medible.
export interface Metrica {
  etiqueta: string; // ej. "Cadencia", "Meta a 30 días"
  valor: string; // ej. "3 Reels por semana", "300-500 seguidores"
  detalle: string; // por qué ese número es realista para esta persona
}

// Un segmento de guion: un momento con su marca de tiempo y lo que se dice o
// muestra en ese instante. Los guiones se piden SIEMPRE como una lista de
// estos segmentos (nunca un bloque de texto continuo), para poder mostrarlos
// como una lista ordenada por tiempos.
export interface SegmentoGuion {
  tiempo: string; // ej. "0-3s", "4-10s"
  texto: string; // lo que se dice o se muestra en ese momento
}

// Un guion = un ejemplo de diálogo listo para grabar.
export interface Guion {
  titulo: string; // el tema/título del video
  guion: SegmentoGuion[]; // el diálogo concreto, por momentos
}

// Un indicador = un porcentaje (0-100) para dibujar como anillo.
export interface Indicador {
  nombre: string; // ej. "Interés del público", "Ventaja por tu zona"
  porcentaje: number; // 0 a 100
  nota: string; // media frase específica
}

// Un segmento de la mezcla de contenido (los porcentajes suman ~100).
export interface SegmentoContenido {
  etiqueta: string; // ej. "Reseñas", "Educativo", "Personal"
  porcentaje: number; // 0 a 100
}

// El análisis visual: estimaciones del coach para graficar (NO datos reales).
export interface Analisis {
  indicadores: Indicador[];
  mezcla_contenido: SegmentoContenido[];
  publico_potencial: string;
}

// Una herramienta/app que el usuario necesita. El link lo pone la app (ver
// lib/herramientas.ts), NO la IA.
export interface Herramienta {
  nombre: string; // ej. "TikTok", "CapCut", "Canva"
  para: string; // para qué la usa, 1 frase corta
}

export interface Plan {
  diagnostico_resumen: string;
  nicho: {
    definicion: string;
    porque_para_ti: string;
    frase_posicionamiento: string;
  };
  plataforma_principal: {
    red: string;
    formato: string;
    porque: string;
  };
  que_funciona_ahora: string[];
  metricas: Metrica[];
  analisis: Analisis;
  fases: Fase[];
  ejemplos_titulos: string[];
  ejemplos_guiones: Guion[];
  consejos: string[];
  herramientas: Herramienta[];
  expectativa_realista: string;
  primer_paso_hoy: string;
}

// El plan se genera en 3 llamadas más chicas en vez de una sola grande, para
// que cada una tarde menos y no arriesgue el límite de tiempo de Vercel. Cada
// "Parte" es un pedazo de Plan (Pick, no una copia) — así, si Plan cambia,
// estas quedan sincronizadas solas. El reparto sigue un orden de PRIORIDAD,
// no solo de peso: la Parte 1 trae SOLO lo más importante para la persona
// (quién es, su nicho, su plataforma y qué hacer HOY) — nada de eso espera a
// las otras dos llamadas. "fases" (la ruta) queda SOLA en la Parte 2 por ser
// lo más pesado de generar. Todo lo demás (análisis, métricas, ejemplos,
// consejos, herramientas) es contenido de apoyo, no crítico para arrancar, y
// se deja para la Parte 3.
export type PlanParte1 = Pick<
  Plan,
  "diagnostico_resumen" | "nicho" | "plataforma_principal" | "primer_paso_hoy"
>;
export type PlanParte2 = Pick<Plan, "fases">;
export type PlanParte3 = Pick<
  Plan,
  | "que_funciona_ahora"
  | "metricas"
  | "analisis"
  | "ejemplos_titulos"
  | "ejemplos_guiones"
  | "consejos"
  | "herramientas"
  | "expectativa_realista"
>;

// ── Asistente "tu primer video" ─────────────────────────────────────────────
// Una idea de video (la IA propone 3; el usuario elige una).
export interface IdeaVideo {
  titulo: string;
  gancho: string; // qué decir/mostrar en los primeros 3 segundos
  porque: string; // por qué funciona para esta persona
}

// El paquete para grabar la idea elegida.
export interface PaqueteVideo {
  guion: SegmentoGuion[]; // el diálogo concreto, por momentos
  titulos: string[]; // opciones de título listas para publicar
  edicion: string[]; // pasos concretos para editarlo
}

// ── Imágenes del canal ──────────────────────────────────────────────────────
// Lo que Claude entrega para una imagen (NO la dibuja: da el concepto + prompt).
export interface ImagenCanal {
  concepto: string; // el concepto visual, específico del nicho
  medidas: string; // medidas recomendadas para ese asset
  prompt: string; // prompt en inglés, listo para pegar en un generador
  consejos: string[];
}

// ── Revisión de contenido ───────────────────────────────────────────────────
// El feedback de la IA sobre algo que el usuario pegó (idea/guion/título/...).
export interface RevisionContenido {
  veredicto: string; // 1-2 frases: qué tan listo está
  puntaje: number; // 0 a 100 (para la barra)
  fortalezas: string[]; // qué ya funciona
  mejoras: string[]; // qué cambiar, concreto y accionable
  version_mejorada: string; // una versión lista para usar
}

// ── Herramientas de "crear" (/api/crear) ────────────────────────────────────
// Cada herramienta de creación devuelve una de estas formas. El componente sabe
// qué pidió, así que sabe qué forma esperar.
export interface IdeaContenido {
  titulo: string;
  angulo: string; // el ángulo específico/diferenciador
  gancho: string; // qué decir o mostrar en los primeros segundos
}

export interface GuionCreado {
  titulo: string;
  duracion: string; // ej. "45-60s"
  guion: SegmentoGuion[]; // el guion completo, por momentos
  notas: string[]; // notas de producción / edición
}

export interface DescripcionCreada {
  descripcion: string; // lista para pegar
  alternativas: string[]; // variantes (más corta, más comercial)
  hashtags: string[];
}
