// ============================================================================
// app/privacidad/page.tsx — Política de Privacidad.
//
// Server Component, contenido estático. Describe honestamente lo que la app
// hace hoy (localStorage, sin base de datos, uso de la API de Anthropic) — no
// es asesoría legal formal, ver aviso al final.
// ============================================================================

import Link from "next/link";

export default function Privacidad() {
  return (
    <main className="contenedor legal-pagina">
      <Link href="/" className="enlace-volver">
        ← Volver al inicio
      </Link>

      <h1>Política de Privacidad</h1>
      <p className="legal-fecha">Última actualización: {new Date().toLocaleDateString("es", { year: "numeric", month: "long" })}</p>

      <h2>Qué datos guardamos y dónde</h2>
      <p>
        YoTrend no tiene base de datos ni servidor donde se guarden tus datos.
        Todo lo que ingresas — tu nombre y correo para entrar, tus respuestas
        del diagnóstico, tu plan, tu avance y lo que guardas con las
        herramientas — se guarda únicamente en el almacenamiento local
        (localStorage) de tu propio navegador, en tu propio dispositivo.
      </p>
      <p>
        Esto significa que nosotros no tenemos acceso a esos datos: viven solo
        en tu navegador. Si borras el historial/datos del sitio, o usas otro
        dispositivo o navegador, esa información se pierde y no podemos
        recuperarla.
      </p>

      <h2>Qué se envía a la IA</h2>
      <p>
        Para generar tu plan, ideas, guiones y demás contenido, tus respuestas
        y el texto que escribas se envían a la API de Anthropic (Claude) para
        procesarlos y devolverte una respuesta. Anthropic procesa esa
        información según su propia política de privacidad. No enviamos tu
        nombre ni tu correo a Anthropic — solo el contenido necesario para
        generar cada respuesta (tu nicho, tus respuestas del diagnóstico, o el
        texto que quieras revisar).
      </p>

      <h2>Qué NO hacemos</h2>
      <ul>
        <li>No vendemos ni compartimos tus datos con terceros.</li>
        <li>No usamos cookies de rastreo ni de publicidad.</li>
        <li>No tenemos un sistema de cuentas con contraseña — el nombre y
          correo que pides al entrar son solo para identificarte dentro de tu
          propio navegador, no crean una cuenta real en ningún servidor.</li>
      </ul>

      <h2>Aviso importante</h2>
      <p className="legal-aviso">
        Este texto es una plantilla honesta sobre el funcionamiento actual de
        la app, no una asesoría legal formal. Si este producto crece o
        maneja datos más sensibles, se recomienda una revisión legal
        profesional antes de escalar.
      </p>
    </main>
  );
}
