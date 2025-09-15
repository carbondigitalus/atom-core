/**
 * afterMount lifecycle management
 * Handles the afterMount phase of component mounting (after DOM insertion)
 */

export default interface AfterMountCapableComponent {
  __canInvokeAfterMount?: () => boolean;
  __markAfterMountCalled?: () => void;
  afterMount?: () => void | Promise<void>;
}
