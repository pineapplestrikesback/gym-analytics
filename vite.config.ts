import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@core': path.resolve(__dirname, './src/core'),
      '@db': path.resolve(__dirname, './src/db'),
      '@ui': path.resolve(__dirname, './src/ui'),
    },
  },
  server: {
    port: 3000,
  },
});
