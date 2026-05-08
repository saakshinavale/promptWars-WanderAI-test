import { defineConfig } from 'vite';

export default defineConfig({
  root: 'app',
  envDir: '..',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: 'app/index.html',
        results: 'app/results.html'
      }
    }
  },
  server: {
    open: true,
    port: 3000
  },
  test: {
    root: '.',
    environment: 'node'
  }
});
