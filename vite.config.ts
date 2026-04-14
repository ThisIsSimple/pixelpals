import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@data': path.resolve(__dirname, './data'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    target: 'ES2022',
    outDir: 'dist',
  },
  // SPA 라우팅: 모든 경로를 index.html로 폴백
  // (Vite dev 서버는 기본적으로 SPA 폴백을 지원하지만 명시적으로 설정)
  appType: 'spa',
});
