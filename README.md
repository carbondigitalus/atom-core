# AtomJS Core

> Build with Atom — the fundamental building blocks of UI

**AtomJS Core** is a lightweight, class-based UI library written in TypeScript. It embraces familiar JSX syntax and a React-style component model, with a simple, predictable lifecycle and minimal runtime.

---

## ✨ Features

- **Class Components** with a clear constructor lifecycle
  - `super(props)` required; initialize `this.state` directly
  - Optional `defaultProps` and `propTypes` for safer APIs
  - Lifecycle hooks: `beforeMount`, `afterMount`, `beforeUpdate`, `afterUpdate`, `shouldUpdate`, `beforeUnmount`
- **JSX Runtime** (`jsx`, `jsxs`, `jsxDEV`) and **Fragments**
- **Virtual DOM** with `createElement` and efficient child collection
- **DOM Rendering** via `render(vnode, container)`
- **TypeScript-first**: strong types for `VNode`, `Props`, `ElementType`, etc.
- **Testing-ready**: designed to be unit/integration test friendly

---

## 📦 Install

```bash
npm install @atomdev/core
# or
yarn add @atomdev/core
# or
pnpm add @atomdev/core
```
