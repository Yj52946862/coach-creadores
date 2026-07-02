# Proyecto: Coach personalizado para creadores principiantes

> Este documento es el contexto maestro del proyecto. Léelo completo antes de
> escribir cualquier línea de código. Define **qué tiene valor**, **qué es el
> núcleo estrella**, **qué construir primero** y **qué NO construir todavía**.
> Cuando tengas dudas de prioridad, regresa aquí.

---

## 1. Qué es el producto (en una frase)

Una web que toma el contexto real de una persona que quiere empezar como creador
de contenido y le devuelve un **plan personalizado, ordenado por fases, paso a
paso**, anclado en su nicho, su zona y sus límites reales — y que después la
acompaña a sostenerlo.

No es un menú de herramientas sueltas. Es un **coach** que diagnostica, decide
por el usuario lo difícil, le ordena la ruta y lo mantiene avanzando.

---

## 2. LO MÁS IMPORTANTE: el producto estrella (leer dos veces)

El valor NO está en las funciones individuales. Generadores de ideas, de nichos,
de títulos, de nombres y editores de imágenes **ya existen gratis por todos
lados** y no se puede competir contra ellos.

El valor —lo único que nadie está resolviendo bien— es la **orquestación
personalizada**: tomar el contexto de alguien y convertirlo en una ruta clara,
ordenada y realista que le quite la parálisis y lo mantenga consistente. Los dos
problemas reales del creador principiante son:

1. **Parálisis**: no sabe por dónde empezar ni en qué orden (demasiadas
   plataformas, demasiadas opciones).
2. **Falta de seguimiento**: no sostiene el ritmo y abandona.

**El núcleo estrella ataca exactamente esos dos problemas.** Todo lo demás son
satélites que se conectan después.

El corazón técnico del núcleo es **el prompt maestro** (sección 8): la pieza que
convierte el diagnóstico en plan. Si el plan que genera es genuinamente bueno y
se siente hecho a la medida, el producto funciona. Si es genérico, no hay código
ni diseño que lo salve. **Toda la energía del MVP va aquí.**

---

## 3. Alcance del MVP — el bucle central (construir SOLO esto primero)

Un único flujo funcionando de punta a punta:

```
Usuario contesta el diagnóstico  →  el motor genera el plan  →  se muestra en pantalla
```

Eso es todo. El MVP termina cuando ese bucle produce planes que dan ganas de
seguir. Feo pero funcional está bien. La prioridad absoluta es la **calidad del
plan**, no la estética.

### Qué NO construir todavía (anti-alcance — respetar estrictamente)

No toques nada de esto hasta que el bucle central esté validado:

- ❌ Sistema de login / cuentas de usuario
- ❌ Base de datos (el plan se genera y se muestra; no se guarda aún)
- ❌ Pagos / planes de suscripción
- ❌ Editor de imágenes / generación de portadas con IA
- ❌ Generador de nombres de canal y de títulos como módulos sueltos
- ❌ Guías para abrir cuentas de YouTube/Instagram/etc.
- ❌ App móvil nativa

Todo eso son **capas posteriores** (ver sección 9). Construirlas antes de
validar el cerebro es el error que hunde el proyecto.

---

## 4. Stack técnico

- **Framework**: Next.js (App Router). Frontend y backend en un solo proyecto.
- **Cerebro**: API de Anthropic (Claude) llamada desde una API route del servidor.
  La API key vive solo en el servidor, nunca en el cliente.
- **Base de datos**: ninguna en el MVP. Se agrega después.
- **Estilos**: lo mínimo para que se entienda. Sin pulir todavía.
- **Despliegue**: local primero; Vercel cuando haya algo que mostrar.

> Nota de aprendizaje: explícame cada archivo y cada decisión a medida que
> construyes. Quiero entender el código, no solo que funcione.

---

## 5. Arquitectura del bucle central

```
app/
  page.tsx                  → formulario del diagnóstico (sección 7)
  resultado/page.tsx        → renderiza el plan (las fases en tarjetas)
  api/generar-plan/route.ts → recibe el diagnóstico, llama a la API de Claude
                              con el PROMPT MAESTRO, devuelve el plan en JSON
lib/
  prompt-maestro.ts         → el system prompt de la sección 8
  tipos.ts                  → los tipos del diagnóstico y del plan (schema JSON)
```

Flujo:
1. El usuario llena el formulario → se arma un objeto `Diagnostico`.
2. Se envía a `/api/generar-plan`.
3. La ruta llama a la API de Claude con el prompt maestro + el diagnóstico.
4. Claude devuelve el plan **en JSON** (schema de la sección 8).
5. El frontend parsea el JSON y lo renderiza como tarjetas por fase.

---

## 6. El diagnóstico: por qué importa tanto

La calidad del plan depende 100% de la calidad de lo que recopilamos. No basta
con "¿qué red social quieres?". El diagnóstico captura **cinco capas**. Cada capa
existe porque alimenta una decisión del cerebro.

| Capa | Qué captura | Para qué sirve |
|------|-------------|----------------|
| 1. Quién es | gustos, comodidad ante cámara, personalidad | define el formato que SÍ va a sostener |
| 2. Qué trae | habilidades, conocimientos, experiencia | de aquí sale su ventaja real |
| 3. Contexto y zona | ubicación, idioma, alcance (local/país/global) | habilita ángulos locales que nadie más da |
| 4. Meta y porqué | objetivo, expectativa de tiempo, plataforma deseada | calibra el plan y las expectativas |
| 5. Límites reales | horas/semana, presupuesto, equipo | un plan que ignora esto no se cumple |

---

## 7. Preguntas del formulario (inputs del MVP)

Capturar esto y mapearlo al objeto `Diagnostico`:

**Capa 1 — Quién eres**
- ¿Qué tipo de contenido disfrutas más? (enseñar / entretener / mostrar tu vida / opinar / inspirar)
- ¿Qué tan cómodo te sientes frente a cámara? (muy cómodo / con práctica / prefiero no mostrar la cara)
- ¿Cómo te describirías comunicando? (energético / calmado / gracioso / analítico / cercano)

**Capa 2 — Qué ya traes**
- ¿En qué temas sabes más que la persona promedio? (texto libre)
- ¿Para qué te pide ayuda o consejo la gente? (texto libre)
- ¿Tienes alguna experiencia o historia que te distinga? (texto libre, opcional)

**Capa 3 — Contexto y zona**
- ¿Dónde vives? (ciudad / país — prellenar por geolocalización, editable)
- ¿En qué idioma quieres crear?
- ¿Para quién es tu contenido? (mi zona local / mi país / global)

**Capa 4 — Meta y porqué**
- ¿Cuál es tu objetivo principal? (ganar dinero / pasión-hobby / autoridad y marca personal / construir comunidad)
- ¿En cuánto tiempo te gustaría ver tus primeros resultados? (sirve para calibrar expectativas)
- ¿Qué plataforma te llama más? (YouTube / Instagram / TikTok / Facebook / no sé, ayúdame a decidir)

**Capa 5 — Límites reales**
- ¿Cuántas horas por semana puedes dedicar de forma realista?
- ¿Cuánto puedes invertir al inicio? (nada / poco / algo)
- ¿Con qué equipo cuentas? (solo celular / celular + micrófono / cámara / otro)

---

## 8. EL PROMPT MAESTRO (el cerebro — la pieza más importante del proyecto)

Este es el system prompt que se manda a la API de Claude junto con el objeto
`Diagnostico` serializado. Está diseñado para **reducir opciones, no agregar**.
Va literal en `lib/prompt-maestro.ts`.

```text
Eres un coach experto en creación de contenido digital, especializado en ayudar
a PRINCIPIANTES absolutos a empezar con claridad y sin abrumarse. Tu trabajo no
es darle mil opciones a la persona: es tomar decisiones difíciles POR ella y
entregarle una ruta clara, ordenada y realista que pueda ejecutar de verdad.

Vas a recibir un diagnóstico con el contexto de una persona. Con base en él,
generas un plan personalizado. Tu plan debe cumplir estos PRINCIPIOS:

1. REDUCE, NO AGREGUES. El principal problema del principiante es la parálisis
   por exceso de opciones. Tú decides por él: un solo nicho, una sola plataforma
   principal, un solo formato. Nunca le digas "haz YouTube, Instagram, TikTok y
   Facebook". Eso lo quema y no crece en ninguna.

2. NICHO ESTRECHO Y REAL. Cruza lo que la persona ya sabe hacer + lo que disfruta
   + lo que el mercado pide. Define un problema específico que su contenido
   resuelve, no un tema amplio. "Finanzas para freelancers en México" es nicho;
   "finanzas" no lo es.

3. UNA PLATAFORMA Y UN FORMATO. Elige la plataforma y el formato que la persona
   PUEDA SOSTENER según su comodidad ante cámara, su tiempo y su equipo. Justifica
   por qué esa y no otra. Si dijo que prefiere no mostrar la cara, no la mandes a
   formatos que exijan rostro.

4. APROVECHA SU ZONA. Si su contenido es local o nacional, propón ángulos
   específicos de su ubicación e idioma. Esta es su ventaja injusta frente a
   creadores genéricos.

5. RESPETA SUS LÍMITES. El plan debe caber en sus horas por semana, su presupuesto
   y su equipo. Un calendario de 3 videos por semana que sí puede mantener vale
   más que uno de 3 al día que va a abandonar.

6. CALIBRA EXPECTATIVAS CON HONESTIDAD. Si espera resultados en 2 semanas,
   corrígelo con cariño: el crecimiento se compone con el tiempo y la
   consistencia. La expectativa irreal es la causa #1 de abandono.

7. CONCRETO, NUNCA GENÉRICO. Cada paso dice QUÉ hacer, CÓMO y para CUÁNDO. Nada
   de "haz un video de presentación". Mejor: "Graba un video de 60s respondiendo
   [pregunta específica de su nicho] con este gancho: [gancho concreto]".

8. ANCLA EN LO QUE FUNCIONA HOY. Basa tus recomendaciones de formato y temas en
   lo que está funcionando actualmente en ese nicho y plataforma, no en consejos
   viejos. (En versiones futuras esto se conectará a datos de tendencias en
   tiempo real; por ahora razónalo con tu mejor criterio actualizado.)

IDIOMA Y TONO: responde en el idioma que indique el diagnóstico (por defecto,
español). Tono cercano, directo y motivador, sin humo ni promesas vacías.

ESTRUCTURA DEL PLAN POR FASES:
- Fase 0 — Cimientos: nicho cerrado, frase de posicionamiento, abrir la cuenta,
  bio que funcione como mini-embudo.
- Fase 1 — Primeras publicaciones: 5 a 10 piezas concretas, ya definidas, con
  ganchos específicos.
- Fase 2 — Motor de consistencia: un calendario realista y sostenible.
- Fase 3 — Leer y ajustar: cómo mirar sus números como retroalimentación, no como
  juicio, y qué ajustar.

FORMATO DE SALIDA: responde ÚNICAMENTE con un objeto JSON válido, sin texto antes
ni después, sin ```json ni markdown. Usa exactamente este schema:

{
  "diagnostico_resumen": "1-2 frases que le devuelven a la persona quién es y su ventaja, para que sienta que la entendiste",
  "nicho": {
    "definicion": "el nicho estrecho, en una frase",
    "porque_para_ti": "por qué este nicho encaja con SU contexto específico",
    "frase_posicionamiento": "una frase que resume lo que ofrece"
  },
  "plataforma_principal": {
    "red": "YouTube | Instagram | TikTok | Facebook",
    "formato": "el formato concreto (ej. Shorts verticales de 30-60s)",
    "porque": "por qué esta plataforma y formato para esta persona"
  },
  "que_funciona_ahora": [
    "insight concreto sobre lo que funciona en su nicho/plataforma hoy",
    "otro insight"
  ],
  "fases": [
    {
      "numero": 0,
      "titulo": "Cimientos",
      "objetivo": "qué se logra en esta fase",
      "pasos": [
        { "que": "qué hacer", "como": "cómo hacerlo, concreto", "tiempo_estimado": "ej. 30 min" }
      ]
    }
  ],
  "expectativa_realista": "qué esperar de forma honesta y en qué plazo",
  "primer_paso_hoy": "la única cosa que debe hacer HOY para empezar"
}

No incluyas ninguna explicación fuera del JSON.
```

---

## 9. Capas posteriores (el roadmap, NO construir todavía)

Una vez que el bucle central genera planes buenos y validados con gente real, se
agregan en este orden. Cada una se conecta DENTRO de un paso del plan, en el
momento justo en que el usuario la necesita — no como herramientas sueltas.

1. **Persistencia**: base de datos para guardar el perfil y el plan (requiere
   cuentas/login).
2. **Acompañamiento**: seguimiento de qué pasos cumplió, recordatorios, y
   **reajuste del plan** según resultados. Esta es la pieza que retiene usuarios.
3. **Datos de tendencias en tiempo real**: conectar búsqueda web / fuentes de
   tendencias para que "que_funciona_ahora" deje de depender solo del modelo.
4. **Generadores en contexto**: ideas, guiones, títulos y nombres, pero
   entregados DENTRO del paso correspondiente del plan.
5. **Guías de apertura de cuentas**: paso a paso por plataforma (guías, no
   automatización — las plataformas no permiten abrir cuentas por bot).
6. **Edición de imágenes con IA**: portadas y miniaturas. Es lo más caro y
   complejo; va al final.
7. **Monetización**: gratis con límites + plan de pago.

---

## 10. Principios de desarrollo

- Construye el bucle central completo antes que cualquier capa.
- Prioriza siempre la calidad del plan sobre la estética.
- Explica el código mientras lo escribes (el dueño está aprendiendo).
- Mantén el prompt maestro fácil de editar: se va a iterar mucho.
- Antes de dar por bueno el MVP, prueba el plan con 3-4 personas reales que
  quieran empezar y ajusta el prompt hasta que el resultado se sienta a la medida.

---

@AGENTS.md
