// Custom Modules
import { createDOMNode } from './createDOMNode';
import { Children } from '../utils/types/Children';

function render(element: Children, container: HTMLElement): void {
  // Clear container
  container.innerHTML = '';

  // Convert element to DOM node
  const domNode = createDOMNode(element);

  // Append to container
  container.appendChild(domNode);
}

export { render };
