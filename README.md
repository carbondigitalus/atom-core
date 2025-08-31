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

---

## 🚀 Quick Start

```tsx
import { render } from '@atomdev/core';

function App() {
  return {
    type: 'div',
    props: { id: 'root', children: 'Hello, Atom!' }
  };
}

const container = document.getElementById('app')!;
render({ type: App, props: {} }, container);
```

---

## 🔁 Lifecycle: `beforeMount()`

**When it runs:** after the constructor, **before** the first `render()` and **before** any DOM is inserted.

**What it’s for:** non-DOM setup — subscriptions, timers, event listeners, config prep, and “fire-and-forget” async kickoffs.

**Signature**

```ts
beforeMount(): void
```

**Access inside the hook**

- `this.props` — already merged with `defaultProps` and validated by `propTypes` (if provided)
- `this.state` — initialized in your constructor
- `this.setState(partial)` — allowed; merges state for the **first render** and **does not schedule** an extra render during mounting

**Rules**

- Called **once** per component instance
- Runs **synchronously** (don’t `await` inside it)
- **No DOM access** here — the component’s DOM does not exist yet
- Errors are **caught** and do **not** prevent the initial render

---

## ✅ Common Patterns

### 1) Basic setup (socket + interval + global listener)

```ts
class MyComponent extends AtomComponent<
  { url: string },
  { connected: boolean }
> {
  private ws?: WebSocket;
  private timer?: number;

  constructor(props: { url: string }) {
    super(props);
    this.state = { connected: false };
  }

  beforeMount() {
    this.ws = new WebSocket(this.props.url);
    this.ws.onopen = () => this.setState({ connected: true });

    this.timer = setInterval(() => this.fetchData(), 5000);

    window.addEventListener('resize', this.handleResize);
  }

  beforeUnmount() {
    if (this.timer) clearInterval(this.timer);
    try {
      this.ws?.close();
    } catch {}
    window.removeEventListener('resize', this.handleResize);
  }

  handleResize = () => {
    /* ... */
  };
  fetchData() {
    /* ... */
  }

  render() {
    return {
      type: 'div',
      props: { children: this.state.connected ? 'Online' : 'Connecting…' }
    } as any;
  }
}
```

### 2) Async kickoff (non-blocking)

```ts
class DataComponent extends AtomComponent<
  {},
  { loading: boolean; data: unknown; error?: string }
> {
  constructor(p: {}) {
    super(p);
    this.state = { loading: true, data: null };
  }

  beforeMount() {
    // Fire and forget — do not await here
    this.loadInitialData();
  }

  private async loadInitialData() {
    try {
      const res = await fetch('/api/initial-data');
      const data = await res.json();
      this.setState({ data, loading: false });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.setState({ loading: false, error: msg });
    }
  }

  render() {
    if (this.state.loading)
      return { type: 'div', props: { children: 'Loading…' } } as any;
    return {
      type: 'pre',
      props: { children: JSON.stringify(this.state.data, null, 2) }
    } as any;
  }
}
```

### 3) Third-party config prep

```ts
class ChartComponent extends AtomComponent<
  {
    chartType?: string;
    initialData?: number[];
    chartOptions?: Record<string, unknown>;
  },
  { chartReady: boolean }
> {
  private chartConfig?: {
    type: string;
    data: number[];
    options: Record<string, unknown>;
  };

  constructor(p: any) {
    super(p);
    this.state = { chartReady: false };
  }

  beforeMount() {
    this.chartConfig = {
      type: this.props.chartType ?? 'line',
      data: this.props.initialData ?? [],
      options: { responsive: true, ...(this.props.chartOptions ?? {}) }
    };
    this.setState({ chartReady: true });
  }

  render() {
    return {
      type: 'div',
      props: {
        'data-ready': String(this.state.chartReady),
        children: 'Chart config ready'
      }
    } as any;
  }
}
```

### 4) Defensive setup (errors don’t block first render)

```ts
class RobustComponent extends AtomComponent<{}, { setupError?: string }> {
  beforeMount() {
    try {
      this.riskySetup();
    } catch (e) {
      // Logged by AtomJS too; you may still capture state for UI
      const msg = e instanceof Error ? e.message : String(e);
      this.setState({ setupError: msg });
    }
  }
  private riskySetup() {
    /* may throw */
  }
  render() {
    return {
      type: 'div',
      props: {
        children: this.state.setupError
          ? `Setup failed: ${this.state.setupError}`
          : 'OK'
      }
    } as any;
  }
}
```

---

## ⚠️ Do / Don’t

**Do**

- Start subscriptions, intervals, and global listeners
- Initialize configurations and kick off async requests
- Use `setState` to seed data for the first render (no extra render is scheduled)

**Don’t**

- Touch the DOM — use `afterMount` for DOM work
- Block the thread with heavy synchronous work
- Forget to clean up resources in `beforeUnmount`

---

## 🧪 Testing tips

- Use a **jsdom** environment for DOM-related tests.
- Assert order: constructor → `beforeMount` → `render`.
- Verify first render reflects `setState` done inside `beforeMount`.
- For async kickoffs, assert that rendering happens **before** the promise resolves.

---

## 📚 Documentation

Looking for the full guide and API docs? Head to the official docs:

\*\*➡️ https://atomjs.dev/

- Lifecycle overview
- `beforeMount()` usage & examples
- Testing patterns
- Gotchas & anti-patterns
