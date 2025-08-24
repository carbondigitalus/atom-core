// NPM Modules
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'AtomJS',
      fileName: 'atomjs'
    }
  },
  esbuild: {
    jsx: 'transform',
    jsxFactory: 'AtomJS.createElement'
  }
});
