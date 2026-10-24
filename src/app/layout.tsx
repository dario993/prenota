import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { RegistraSW } from "@/components/RegistraSW";

export const metadata: Metadata = {
  title: "Prenota",
  description: "Prenotazioni spettacoli teatrali",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icona.svg", apple: "/icona-512.png" },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it" className="h-full antialiased">
      <body className="min-h-full flex flex-col"><Providers>{children}</Providers><RegistraSW /></body>
    </html>
  );
}
