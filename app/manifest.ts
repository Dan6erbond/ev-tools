import { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EV Tools - Utilities for Electric Vehicle Owners",
    short_name: "EV Tools",
    description: "Open-source calculators and utilities for EV owners.",
    start_url: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#059669",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
      {
        src: "/og-image.png",
        sizes: "1200x630",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
