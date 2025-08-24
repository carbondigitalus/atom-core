import { render } from '@atomjs/core';

const app = (
  <div>
    <h1>Hello AtomJS!</h1>
    <p>This is a test of our framework</p>
    <button onClick={() => alert('AtomJS works!')}>Click me!</button>
  </div>
);

const rootElement = document.getElementById('root');
if (rootElement) {
  render(app, rootElement);
} else {
  console.error('Root element not found');
}
