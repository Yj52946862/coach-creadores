# Coach para creadores

Una web que toma el diagnóstico de alguien que quiere empezar como creador de
contenido y le devuelve un **plan personalizado, por fases, paso a paso** —
anclado en su nicho, su zona y sus límites reales— y lo acompaña a avanzar.

El contexto maestro del proyecto está en [`CLAUDE.md`](./CLAUDE.md). La pieza
estrella es el **prompt maestro** en [`lib/prompt-maestro.ts`](./lib/prompt-maestro.ts).

## Cómo correrlo

1. Instala dependencias (una sola vez):
   ```bash
   npm install
   ```
2. Crea el archivo `.env.local` con tu API key de Anthropic:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```
   La obtienes en <https://console.anthropic.com/> → Settings → API Keys.
   La API es de pago por uso: necesitas agregar saldo.
3. Arranca el servidor de desarrollo:
   ```bash
   npm run dev
   ```
4. Abre <http://localhost:3000>.

## Mapa del código

- `app/page.tsx` — el formulario del diagnóstico.
- `app/api/generar-plan/route.ts` — llama a Claude con el prompt maestro y
  devuelve el plan en JSON. **Aquí vive la API key (solo en el servidor).**
- `app/resultado/page.tsx` — dibuja el plan (tarjetas, gráficos, herramientas)
  y el calculador de avance.
- `lib/prompt-maestro.ts` — **el cerebro**: las instrucciones del coach. Edítalo
  para mejorar la calidad de los planes.
- `lib/tipos.ts` — las "formas" de los datos (diagnóstico y plan).
- `lib/herramientas.ts` — links oficiales de descarga de las apps.

## Notas

- **Sin base de datos:** el plan y el avance se guardan en `localStorage` (en tu
  navegador), así que persisten en ese dispositivo sin cuentas.
- **Modelo:** Claude Opus 4.8.

Hecho con [Next.js](https://nextjs.org).
