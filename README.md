# AtomJS Core

> Build with Atom - The fundamental building blocks of UI

AtomJS is a class-based React alternative that combines the best aspects of React's component model with Vue's simplicity, built from the ground up with TypeScript.

## Current Status

**Phase**: Core Runtime Development

### What's Built

- ✅ **Virtual DOM Engine** - Lightweight object representation of UI
- ✅ **JSX Runtime** - Full JSX transformation support (`jsx`, `jsxs`, `jsxDEV`)
- ✅ **Element Creation** - `createElement` with proper TypeScript types
- ✅ **DOM Rendering** - Mount virtual elements to real DOM
- ✅ **Event Handling** - onClick, onInput, and other DOM events
- ✅ **Fragment Support** - Render multiple elements without wrapper
- ✅ **Development Tools** - Source maps, TypeScript integration

### What's Missing

- ⏳ **Class Components** - Stateful components with lifecycle methods
- ⏳ **State Management** - setState and re-rendering logic
- ⏳ **Computed Properties** - Vue-style reactive computations
- ⏳ **Watchers** - Explicit side effect handling
- ⏳ **Component Library** - Pre-built UI components
- ⏳ **Build Tools** - CLI, bundling, optimization

## Architecture

### Core Modules

```
src/
├── core/
│   ├── createElement.ts    # Virtual DOM creation
│   ├── render.ts          # DOM mounting
│   └── createDOMNode.ts   # DOM manipulation utilities
├── runtime/
│   ├── jsx-runtime.ts     # JSX transformation (jsx, jsxs)
│   └── jsx-dev-runtime.ts # Development JSX with debugging
└── utils/
    ├── interfaces/        # TypeScript interfaces (VNode)
    └── types/            # Type definitions (Children, Props, etc.)
```

### Type System

**VNode** - Virtual DOM node structure

```typescript
interface VNode<P = any> {
  readonly type: ElementType<P>;
  readonly props: P & { key?: Key; children?: Children };
}
```

**Children** - Flexible child element types

```typescript
type Children = Child | Child[];
type Child = VNode<any> | PrimitiveChild | boolean | null | undefined;
```

## Usage

### Basic Example

```typescript
import { render } from '@atomjs/core';

// JSX automatically transforms to createElement calls
const app = (
  <div>
    <h1>Hello AtomJS!</h1>
    <button onClick={() => alert('Works!')}>
      Click me
    </button>
  </div>
);

// Mount to DOM
render(app, document.getElementById('root'));
```

### Manual Element Creation

```typescript
import { createElement, render } from '@atomjs/core';

const element = createElement(
  'div',
  { className: 'app' },
  createElement('h1', null, 'Hello World'),
  createElement('p', null, 'Built with AtomJS')
);

render(element, document.getElementById('root'));
```

## Development Setup

### Prerequisites

- Node.js v18+
- TypeScript 5.0+

### Installation

```bash
git clone <repository>
cd atomjs
npm install
```

### Available Scripts

```bash
npm run start:dev        # Vite development server
npm run start:dev:types  # TypeScript type checking (watch mode)
npm run build           # Build for production
npm run code:lint       # ESLint code linting
npm run code:format     # Prettier code formatting
```

### Project Structure

```
atomjs/
├── src/              # Source code
├── examples/         # Test applications
├── dist/            # Built output
└── vite.config.ts   # Vite configuration
```

## Design Philosophy

**Class-Based Components** - Predictable, object-oriented approach without hooks complexity

**Vue-Inspired Reactivity** - Computed properties and watchers for clear side effect management

**React-Compatible JSX** - Familiar syntax with improved underlying architecture

**Enterprise-Ready** - Stable APIs, comprehensive TypeScript support, minimal breaking changes

**Developer Experience** - Fast builds, excellent debugging, clear error messages

## Detailed Roadmap

### Phase 2: Component System (Q3-Q4 2025)

**Foundation: Stateful Class Components**

**2.1 Base Component Class (4-6 weeks)**

- `Component` base class with constructor, props, and state
- Lifecycle methods: `componentDidMount`, `componentDidUpdate`, `componentWillUnmount`
- Abstract `render()` method requirement
- Instance method binding and `this` context management
- Props validation and TypeScript generic support

**2.2 State Management (3-4 weeks)**

- `setState()` implementation with batching
- State diffing and selective re-rendering
- Async state updates and callback support
- State mutation detection and warnings
- Performance optimizations for large state objects

**2.3 Vue-Inspired Reactivity (6-8 weeks)**

- `@computed` decorator for derived properties
- Automatic dependency tracking for computed values
- `@watch` decorator for side effect handling
- Reactive property getters and setters
- Invalidation and re-computation strategies

**2.4 Component Lifecycle Enhancement (2-3 weeks)**

- Error boundaries with `componentDidCatch`
- `shouldComponentUpdate` for manual optimization
- `getSnapshotBeforeUpdate` for DOM measurements
- Development mode lifecycle warnings and debugging

**Milestone: Complete counter app with class component, state, and computed properties**

### Phase 3: Developer Experience & Tooling (Q3-Q4 2025)

**Foundation: Professional Development Workflow**

**3.1 AtomJS CLI (8-10 weeks)**

- Project scaffolding: `atomjs create my-app`
- Template system: basic, with-router, enterprise
- Component generation: `atomjs generate component UserCard`
- Build optimization and bundling
- Development server with hot reload
- Production builds with tree-shaking and minification

**3.2 Browser Development Tools (10-12 weeks)**

- Chrome/Firefox extension for AtomJS debugging
- Component tree visualization and inspection
- State and props inspection with live editing
- Performance profiler for render cycles
- Time-travel debugging for state changes
- Integration with React DevTools protocol

**3.3 Build System & Optimization (4-6 weeks)**

- Fast refresh implementation for instant updates
- Source map generation for production debugging
- Bundle analysis and size optimization
- CSS-in-JS support and extraction
- Asset optimization and CDN preparation
- TypeScript declaration bundling

**3.4 Testing Framework (6-8 weeks)**

- Component testing utilities similar to React Testing Library
- Jest integration and custom matchers
- Snapshot testing for components
- Mock utilities for lifecycle methods
- Performance testing and benchmarking tools

**Milestone: Full-stack development workflow comparable to Create React App**

### Phase 4: Core Ecosystem (Q4-Q1 2025-2026)

**Foundation: Production-Ready Platform**

**4.1 UI Component Library - AtomUI (12-16 weeks)**

- 40+ production-ready components (Button, Input, Modal, etc.)
- Consistent design system with theme support
- Accessibility compliance (ARIA, keyboard navigation)
- Comprehensive Storybook documentation
- Dark mode and customization APIs
- Performance-optimized implementations

**4.2 Routing System - AtomRouter (6-8 weeks)**

- File-based routing system inspired by Next.js
- Nested routes and layout components
- Dynamic route parameters and query handling
- Route guards and authentication integration
- Code splitting and lazy loading
- Server-side rendering preparation

**4.3 State Management Library - AtomState (8-10 weeks)**

- Global state management with class-based stores
- Computed properties across components
- Action/mutation pattern for predictable updates
- DevTools integration for state inspection
- Middleware system for logging and persistence
- TypeScript-first API design

**4.4 Documentation Platform - AtomDocs (10-12 weeks)**

- Auto-generated documentation from TypeScript comments
- Interactive component playground
- Code examples with live editing
- API reference with search and filtering
- Tutorial and guide system
- Community contribution workflow

**Milestone: Complete development platform competitive with Vue/React ecosystems**

### Phase 5: Advanced Features & Scaling (Q1-Q2 2026)

**Foundation: Enterprise and Performance**

**5.1 Server-Side Rendering (10-12 weeks)**

- Node.js SSR runtime for AtomJS components
- Hydration system for client-side takeover
- Static site generation capabilities
- Streaming SSR for improved TTFB
- SEO optimization and meta tag management
- Integration with existing Node.js frameworks

**5.2 Performance & Optimization (8-10 weeks)**

- Virtual scrolling for large lists
- Memoization system for expensive computations
- Bundle splitting and progressive loading
- Web Workers integration for background processing
- Memory leak detection and prevention
- Performance monitoring and analytics

**5.3 Advanced Developer Tools (6-8 weeks)**

- Visual component editor with drag-and-drop
- Performance profiler with flame graphs
- Bundle analyzer with dependency visualization
- Accessibility auditing tools
- Automated testing generation
- Code migration tools from React/Vue

**Milestone: Enterprise-ready framework with advanced performance characteristics**

### Phase 6: Ecosystem & Community (Q2-Q3 2026 And Beyond)

**Foundation: Sustainable Open Source Project**

**6.1 Figma Integration Suite (12-16 weeks)**

- Design token synchronization
- Component generation from Figma designs
- Design system maintenance tools
- Designer-developer handoff automation
- Version control for design changes
- Real-time collaboration features

**6.2 AtomCloud Hosting Platform (16-20 weeks)**

- One-click deployment for AtomJS applications
- Edge computing and CDN integration
- Serverless functions compatible with AtomJS
- Database integration and ORM
- Authentication and user management
- Analytics and monitoring dashboard

**6.3 Community & Marketplace (8-12 weeks)**

- Component marketplace for sharing AtomUI extensions
- Plugin system for third-party integrations
- Community templates and starter kits
- Certification program for AtomJS developers
- Conference and meetup organization
- Open source contribution guidelines

**Success Metrics by Phase:**

- Phase 2: 1,000+ GitHub stars, basic app demos
- Phase 3: 10,000+ weekly npm downloads, CLI adoption
- Phase 4: 50+ production websites, enterprise pilots
- Phase 5: Performance parity with React, major company adoption
- Phase 6: Self-sustaining community, profitable hosting platform

**Risk Mitigation:**

- Maintain React compatibility layer throughout development
- Regular performance benchmarking against competitors
- Community feedback integration at each phase
- Enterprise customer development partnerships
- Fallback plans for feature delays or technical challenges

## Contributing

AtomJS is in active development. The core runtime is functional but the component system is not yet implemented.

Current development priorities:

1. Component class with lifecycle methods
2. State management and re-rendering
3. Basic example applications
4. Test suite and CI/CD

## License

ISC - See LICENSE file for details
