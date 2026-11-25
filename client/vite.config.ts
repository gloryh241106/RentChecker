import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  root: import.meta.dirname,
  plugins: [react(), tailwindcss()],
  server: { proxy: { '/api': 'http://localhost:3001' } },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
