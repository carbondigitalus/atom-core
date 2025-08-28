import { render } from '@atomdev/core';

const app = (
  <div>
    <h1>Hello AtomDev!</h1>
    <p>This is a test of our framework</p>
    <button onClick={() => alert('AtomDev works!')}>Click me!</button>
  </div>
);

const rootElement = document.getElementById('root');
if (rootElement) {
  render(app, rootElement);
} else {
  console.error('Root element not found');
}
