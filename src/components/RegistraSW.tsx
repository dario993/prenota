"use client";
import { useEffect } from "react";

// Solo in produzione: in sviluppo il service worker servirebbe file vecchi.
export function RegistraSW() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production")
      navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
