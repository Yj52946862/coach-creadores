// ============================================================================
// app/LogoYoTrend.tsx — La marca de YoTrend: una línea de tendencia ascendente
// que termina en un punto. Combina "Yo" (identidad personal) con "Trend"
// (ascenso). Se dibuja en color heredado (currentColor) para vivir dentro de
// la insignia coral ya existente (.nav-marca-icono), igual que antes hacía el
// ícono Sparkles.
// ============================================================================

export default function LogoYoTrend({ size = 17 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <polyline
        points="3.6,16.8 9.6,10.8 13.2,13.9 20.4,3.6"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="20.4" cy="3.6" r="2.2" fill="currentColor" />
    </svg>
  );
}
