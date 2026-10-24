import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // dev raggiunto dalla rete locale (senza, Next blocca HMR e chunk e la pagina non si idrata)
  allowedDevOrigins: ["192.168.178.*"],
};

export default nextConfig;
