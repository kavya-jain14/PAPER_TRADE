import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // 👈 Yeh nayi line add ki hai

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // 👈 Aur yeh yahan add kiya hai
  ],
})