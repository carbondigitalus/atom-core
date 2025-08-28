import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'AtomDev',
      fileName: 'atomdev'
    }
  },
  esbuild: {
    jsx: 'transform',
    jsxFactory: 'AtomDev.createElement'
  }
});
