"use client";
import { Moon, Sun } from "lucide-react";

// Passa da chiaro a scuro e viceversa (data-theme su <html>, ricordato sul dispositivo).
// Senza scelta salvata vale il tema di sistema. Icona e testo cambiano solo via CSS (variante dark:): nessuno stato React.
function cambiaTema() {
  const html = document.documentElement;
  const scuro = (html.dataset.theme ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")) === "dark";
  html.dataset.theme = scuro ? "light" : "dark";
  try { localStorage.setItem("tema", html.dataset.theme); } catch {}
}

export function TemaToggle({ className }: { className?: string }) {
  return (
    <button type="button" onClick={cambiaTema} className={className}>
      <Moon size={24} strokeWidth={2} aria-hidden className="dark:hidden" />
      <Sun size={24} strokeWidth={2} aria-hidden className="hidden dark:block" />
      <span className="dark:hidden">Tema scuro</span>
      <span className="hidden dark:inline">Tema chiaro</span>
    </button>
  );
}
