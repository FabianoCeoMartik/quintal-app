import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' => os scripts/CSS são carregados com caminho relativo (./assets/...),
// necessário para o WebView do Capacitor (Android) não ficar em tela branca.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { port: 5173 },
})
