import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { RegistraSW } from "@/components/RegistraSW";

// scaricati al build e serviti dall'app: funzionano anche offline
const plexSans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-plex-sans" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: "500", variable: "--font-plex-mono" });

export const metadata: Metadata = {
  title: "Prenota",
  description: "Prenotazioni spettacoli teatrali",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icona.svg", apple: "/icona-512.png" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f5f7" },
    { media: "(prefers-color-scheme: dark)", color: "#111316" },
  ],
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning: data-theme lo imposta lo script qui sotto prima che React arrivi
    <html lang="it" className={`h-full antialiased ${plexSans.variable} ${plexMono.variable}`} suppressHydrationWarning>
      <head>
        {/* tema scelto con TemaToggle, applicato prima del disegno della pagina (niente lampo del tema sbagliato) */}
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem("tema");if(t)document.documentElement.dataset.theme=t}catch(e){}` }} />
      </head>
      <body className="flex min-h-full flex-col font-sans"><Providers>{children}</Providers><RegistraSW /></body>
    </html>
  );
}
