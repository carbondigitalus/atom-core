/**
 * beforeMount lifecycle management
 * Handles the beforeMount phase of component mounting
 */

export default interface BeforeMountCapableComponent {
  __enterMountPhase?: () => void;
  __exitMountPhase?: () => void;
  __canInvokeBeforeMount?: () => boolean;
  __markBeforeMountCalled?: () => void;
  beforeMount?: () => void;
}
