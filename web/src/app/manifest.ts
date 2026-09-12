import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kept", short_name: "Kept", description: "Every promise an AI agent makes, enforceable.",
    start_url: "/", display: "standalone", background_color: "#0a0a0b", theme_color: "#0a0a0b",
    icons: [{ src: "/icon", sizes: "64x64", type: "image/png" }, { src: "/apple-icon", sizes: "180x180", type: "image/png" }],
  };
}
