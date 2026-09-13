import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Knight Ads · Plataforma de Publicidad Descentralizada en Solana",
  description:
    "Knight Ads conecta anunciantes que buscan visibilidad real con usuarios que desean ganar recompensas en el token nativo $Knight (Red Solana). 100% transparente, pagos automáticos, control total del administrador.",
  keywords: [
    "Knight Ads",
    "Solana",
    "$Knight",
    "publicidad descentralizada",
    "Web3 ads",
    "crypto rewards",
    "Jupiter Aggregator",
  ],
  authors: [{ name: "Knight Ads" }],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/knight-logo.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon.ico",
  },
  openGraph: {
    title: "Knight Ads · Plataforma de Publicidad Descentralizada en Solana",
    description:
      "Anunciantes pagan por visualizaciones reales. Visitantes ganan $Knight. Todo en la red Solana.",
    siteName: "Knight Ads",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Knight Ads",
    description: "Publicidad descentralizada en Solana con $Knight.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
