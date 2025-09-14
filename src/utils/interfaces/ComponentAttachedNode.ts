/**
 * Interface for DOM nodes that may have attached component instances
 */
export default interface ComponentAttachedNode extends Node {
  __atomComponent?: {
    __canInvokeAfterMount?: () => boolean;
    __markAfterMountCalled?: () => void;
    afterMount?: () => void | Promise<void>;
  };
}
