import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { createApi } from "./server/api.mjs";

const withRooms = (server) => {
  server.middlewares.use("/api", createApi());
};
export default defineConfig({
  plugins: [
    react(),
    {
      name: "private-room-server",
      configureServer: withRooms,
      configurePreviewServer: withRooms,
    },
  ],
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    allowedHosts: true,
    fs: {
      deny: [
        ".env",
        ".env.*",
        "*.{crt,pem}",
        "**/.git/**",
        "**/.data/**",
        "**/server/**",
      ],
    },
    watch: { ignored: ["**/.data/**"] },
  },
  preview: { host: "0.0.0.0", allowedHosts: true },
});
