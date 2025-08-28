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
- ✅ **Testing Infrastructure** - Jest unit tests, WebDriverIO browser tests

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
cd atom-core
npm install
```

### Available Scripts

```bash
# Development
npm run start:dev        # Vite development server
npm run start:dev:types  # TypeScript type checking (watch mode)

# Building
npm run build           # Build for production

# Code Quality
npm run code:lint       # ESLint code linting
npm run code:format     # Prettier code formatting

# Testing
npm run test:unit       # Run Jest unit tests
npm run test:browser    # Run WebDriverIO browser tests

# Test Reporting
npm run report:unit:generate    # Generate Jest test reports
npm run report:unit:view        # View Jest test reports
npm run report:browser:generate # Generate WebDriverIO test reports
npm run report:browser:view     # View WebDriverIO test reports
```

### Project Structure

```
atom-core/
├── src/                    # Source code
├── test/
│   ├── unit/              # Jest unit tests
│   └── browser/           # WebDriverIO browser tests
│       ├── fixtures/      # Test HTML files
│       ├── pageobjects/   # Page Object Model classes
│       └── specs/         # Test specifications
├── dist/                  # Built output
├── reports/               # Test reports (Allure)
└── vite.config.ts        # Vite configuration
```

### Testing

**Unit Tests** - Fast, isolated tests for core functionality:

```bash
npm run test:unit
```

**Browser Tests** - End-to-end tests running in Chrome:

```bash
npm run test:browser
```

Tests use the Page Object Model pattern for maintainable browser automation and include detailed HTML reports via Allure.

## Design Philosophy

**Class-Based Components** - Predictable, object-oriented approach without hooks complexity

**Vue-Inspired Reactivity** - Computed properties and watchers for clear side effect management

**React-Compatible JSX** - Familiar syntax with improved underlying architecture

**Enterprise-Ready** - Stable APIs, comprehensive TypeScript support, minimal breaking changes

**Developer Experience** - Fast builds, excellent debugging, clear error messages

**Test-Driven Development** - Comprehensive test coverage at both unit and integration levels

## Contributing

AtomJS is in active development. The core runtime is functional but the component system is not yet implemented.

Current development priorities:

1. Component class with lifecycle methods
2. State management and re-rendering
3. Expanded test coverage
4. Basic example applications

### Running Tests

Before submitting changes, ensure all tests pass:

```bash
npm run test:unit && npm run test:browser
```

### Code Quality

Maintain code quality with linting and formatting:

```bash
npm run code:lint
npm run code:format
```

## License

ISC - See LICENSE file for details
