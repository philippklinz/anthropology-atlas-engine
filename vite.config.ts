import { defineConfig } from 'vite';
import { qaPreview } from './tools/qa-preview.ts';
export default defineConfig({ plugins:[qaPreview()], base: './', server: { allowedHosts: true }, build: { target: 'es2022', chunkSizeWarningLimit: 2000 } });
