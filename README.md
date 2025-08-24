# @atomjs/core

A tiny, framework-native **JSX runtime + DOM renderer**. No React dependency. Uses the **automatic JSX runtime** (`jsx: "react-jsx"`) with `jsxImportSource: "@atomjs/core"`.

> **Status:** MVP (v0.1.0-alpha). Good for experimentation and internal examples.

---

## What works today

- **Automatic JSX runtime** (React-17 style)
  - `@atomjs/core/jsx-runtime`: `jsx`, `jsxs`, `Fragment`
  - `@atomjs/core/jsx-dev-runtime`: `jsxDEV`, `Fragment` (+ dev metadata)
  - Proper `key` handling
- **DOM renderer**
  - `render(element: Children, container: HTMLElement)`
  - Intrinsic elements (string tags) create real DOM nodes
  - Props:
    - `on*` props become event listeners (`onClick`, `onInput`, …)
    - Non-event props become attributes (stringified)
  - Children:
    - Arrays and nested arrays are flattened
    - `null`, `undefined`, and `false` are skipped
    - `Fragment` works
- **Types**
  - `VNode`, `ElementType`, `Props`, `Key`, `Child`, `Children`
  - Global `JSX` namespace with permissive `IntrinsicElements`

> **Not implemented (yet):**
> - Function/class components (only intrinsic elements render)
> - Reconciliation/diffing (each `render` clears the container)
> - SSR/hydration
> - Keyed lists, event delegation
> - Attribute/prop normalization (`className`, style objects, boolean attrs)
> - Tight HTML/SVG intrinsic typings (currently permissive)

---

## Install

Local development (consuming source from `/src`):

```bash
# inside the repo
pnpm install
```

When you publish a build, consumers will install from npm and import from `@atomjs/core`.

---

## Quick start (example app)

`examples/basic/index.html`
```html
<!doctype html>
<html>
  <head><title>AtomJS Test</title></head>
  <body>
    <div id="root"></div>
    <script type="module" src="./main.tsx"></script>
  </body>
</html>
```

`examples/basic/main.tsx`
```tsx
import { render } from '@atomjs/core';

const app = (
  <div>
    <h1>Hello AtomJS!</h1>
    <p>This is a test of our framework</p>
    <button onClick={() => alert('AtomJS works!')}>Click me!</button>
  </div>
);

const root = document.getElementById('root');
if (root) render(app, root);
```

Run with Vite (dev):

```bash
# from examples/basic/
pnpm vite
```

---

## TypeScript configuration

**Root `tsconfig.json` (excerpt)**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "lib": ["DOM", "ES2020"],
    "sourceMap": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",

    "jsx": "react-jsx",
    "jsxImportSource": "@atomjs/core",

    "baseUrl": ".",
    "paths": {
      "@atomjs/core": ["./src"],
      "@atomjs/core/*": ["./src/*"],
      "@atomjs/core/jsx-runtime": ["./src/runtime/jsx-runtime.ts"],
      "@atomjs/core/jsx-dev-runtime": ["./src/runtime/jsx-dev-runtime.ts"]
    }
  },
  "include": ["src/**/*", "examples/**/*"]
}
```

**Example `tsconfig.json`**
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@atomjs/core",
    "moduleResolution": "Bundler",
    "isolatedModules": true,
    "lib": ["ES2020", "DOM"],
    "baseUrl": ".",
    "paths": {
      "@atomjs/core": ["../../src"],
      "@atomjs/core/*": ["../../src/*"],
      "@atomjs/core/jsx-runtime": ["../../src/runtime/jsx-runtime.ts"],
      "@atomjs/core/jsx-dev-runtime": ["../../src/runtime/jsx-dev-runtime.ts"]
    }
  },
  "include": ["./**/*"]
}
```

> The example maps `@atomjs/core` to `/src` so you can develop without publishing.  
> After publishing, you can remove the `paths` and keep `jsxImportSource: "@atomjs/core"`.

---

## Vite configuration (example)

`examples/basic/vite.config.ts`
```ts
import { defineConfig } from 'vite';

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: '@atomjs/core'
  },
  resolve: {
    alias: {
      '@atomjs/core': new URL('../../src', import.meta.url).pathname
    }
  }
});
```

---

## API

### `render(element: Children, container: HTMLElement): void`
Mounts the given JSX tree into the DOM.

- Clears `container.innerHTML` first (no diffing yet).
- Converts the tree to DOM via the internal `createDOMNode`.

### JSX runtime (automatic)
Imported implicitly by the compiler using `jsxImportSource: "@atomjs/core"`.

- Production: `@atomjs/core/jsx-runtime` exports `jsx`, `jsxs`, `Fragment`
- Dev: `@atomjs/core/jsx-dev-runtime` exports `jsxDEV`, `Fragment`  
  (attaches `__source`/`__self` metadata)

**Do not** import `jsx` manually; just write JSX.

### Props & events
- Props whose keys start with `on` (e.g. `onClick`) are added as event listeners.
- Other props become attributes: `setAttribute(key, String(value))`

### Children
- Arrays and nested arrays are flattened.
- `null`, `undefined`, `false` are skipped.
- `<Fragment>...</Fragment>` or `<>...</>` groups children without introducing a DOM element.

---

## Global JSX types

We provide permissive global JSX typings so `.tsx` compiles without React:

```ts
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elem: string]: Record<string, unknown>;
    }
    type Element = import('@atomjs/core/utils/interfaces/VNode').VNode<any>;
    interface ElementChildrenAttribute { children: {}; }
  }
}
export {};
```

As the renderer matures, we’ll tighten `IntrinsicElements` with HTML/SVG attributes.

---

## Scripts

From the repo root:

```bash
pnpm dev                 # Vite dev server (example)
pnpm lint                # ESLint + type-aware rules
pnpm build               # tsc → dist (emits runtime entries)
```

Build output includes:

```
dist/index.(js|d.ts)
dist/runtime/jsx-runtime.(js|d.ts)
dist/runtime/jsx-dev-runtime.(js|d.ts)
```

---

## ESLint

Flat config with type-aware rules. We enable the **Project Service** so each file uses the nearest `tsconfig.json` (source vs examples):

`eslint.config.js` (excerpt)
```js
import tsParser from '@typescript-eslint/parser';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import prettierConfig from 'eslint-config-prettier';
import prettier from 'eslint-plugin-prettier';

export default [
  { ignores: ['dist/**', 'node_modules/**'] },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        projectService: true,     // <- important
        tsconfigRootDir: import.meta.dirname,
        sourceType: 'module'
      }
    },
    plugins: { '@typescript-eslint': typescriptEslint, prettier },
    rules: {
      ...typescriptEslint.configs.recommended.rules,
      ...typescriptEslint.configs['recommended-requiring-type-checking'].rules,
      ...prettierConfig.rules,
      'prettier/prettier': 'error'
    }
  }
];
```

---

## Troubleshooting

- **TS2875: requires module path `…/jsx-runtime` to exist**  
  Ensure `jsxImportSource: "@atomjs/core"` and that your tsconfig `paths` map:
  `@atomjs/core/jsx-runtime` → `src/runtime/jsx-runtime.ts`  
  `@atomjs/core/jsx-dev-runtime` → `src/runtime/jsx-dev-runtime.ts`

- **ESLint `no-unsafe-call` on `render(...)`**  
  ESLint couldn’t resolve types for `@atomjs/core`. Use `projectService: true` (above) or include both `tsconfig.json` files in `parserOptions.project`.

- **“Cannot find module '@atomjs/core'” in the example**  
  Add `paths` in the example tsconfig mapping `@atomjs/core` to `../../src`, or use the published package.

---

## Roadmap

- Function components → evaluate to VNode, then render
- Reconciliation (diff props/children; keyed lists)
- Event delegation
- Attribute normalization (`className`, style objects, boolean attrs)
- Tight HTML/SVG intrinsic typings
- SSR/hydration experiments

---

## Contributing

PRs welcome! Please run:

```bash
pnpm lint
pnpm build
```

and include a focused reproduction when changing runtime/renderer behavior.

---

## License

ISC © Carbon Digital.
