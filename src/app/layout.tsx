import type { Metadata, Viewport } from "next";
import { Public_Sans } from "next/font/google";
import { PWARegister } from "@/components/PWARegister";
import "./globals.css";

const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-public-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Almeida Closet — Gestão de Lançamentos",
  description:
    "Sistema de gestão de vendas, recebimentos e despesas da Almeida Closet.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Almeida Closet",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#1c1a17",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={publicSans.variable}>
      <body className="min-h-screen bg-app text-ink antialiased">
        <PWARegister />
        {children}
      </body>
    </html>
  );
}
