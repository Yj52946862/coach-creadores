// ============================================================================
// app/layout.tsx — El "marco" que envuelve a TODAS las páginas.
// Carga Geist (una tipografía moderna y premium) y la deja disponible para toda
// la app por la variable --font-geist.
// ============================================================================

import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Nav from "./Nav";
import Footer from "./Footer";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

export const metadata: Metadata = {
  title: "YoTrend — Estás a punto de ser tendencia.",
  description:
    "Descubre qué contenido crear y usa herramientas de IA: ideas, guiones, descripciones, miniaturas y revisión de contenido, con un plan personalizado paso a paso. Estás a punto de ser tendencia.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={geist.variable}>
      <body>
        <Nav />
        {children}
        <Footer />
      </body>
    </html>
  );
}
