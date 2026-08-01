import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TK Proteger Salud — Soporte",
    short_name: "TK Proteger",
    description:
      "Sistema de tickets de Proteger Salud: Sistemas, E-Commerce y Mantenimiento",
    start_url: "/",
    display: "standalone",
    background_color: "#081428",
    theme_color: "#081428",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
