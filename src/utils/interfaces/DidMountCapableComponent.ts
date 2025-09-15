/**
 * Interface for components with didMount capability
 */
export default interface DidMountCapableComponent {
  __canInvokeDidMount?: () => boolean;
  __markDidMountCalled?: () => void;
  __markMounted?: () => void;
  didMount?: () => void | Promise<void>;
}
