import type { Metadata, Viewport } from "next";
import { Fraunces, Public_Sans } from "next/font/google";
import { Suspense } from "react";
import { PWARegister } from "@/components/PWARegister";
import { TopProgressBar } from "@/components/TopProgressBar";
import "./globals.css";

// UI / corpo: grotesca neutra e legível.
const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-public-sans",
  display: "swap",
});

// Display / números: serifa editorial de moda (dá a cara de boutique).
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Almeida Closet · Gestão de Lançamentos",
  description:
    "Sistema de gestão de vendas, recebimentos e despesas da Almeida Closet.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Almeida Closet",
  },
  icons: {
    icon: "/icon.svg", // vestido (src/app/icon.svg)
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#1a2130",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // Necessário para que env(safe-area-inset-*) funcione (notch/home-indicator).
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${publicSans.variable} ${fraunces.variable}`}>
      <body className="min-h-dvh bg-app text-ink antialiased">
        <Suspense fallback={null}>
          <TopProgressBar />
        </Suspense>
        <PWARegister />
        {children}
      </body>
    </html>
  );
}
