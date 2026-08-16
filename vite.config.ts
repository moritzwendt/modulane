import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [".ngrok-free.dev"],
  },
  preview: {
    allowedHosts: [".ngrok-free.dev"],
  },
})
