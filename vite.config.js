import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    rollupOptions: {
      preserveEntrySignatures: "strict",
      input: {
        App: "src/App.jsx",
        index: "src/index.jsx",
        Chatbot: "src/Chatbot.jsx",
      },
      output: {
        format: "es",
        entryFileNames: "[name].js",
      },
    },
  },
});
