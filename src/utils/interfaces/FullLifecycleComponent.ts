// Custom Modules
import AfterMountCapableComponent from './AfterMountCapableComponent';
import BeforeMountCapableComponent from './BeforeMountCapableComponent';
import DidMountCapableComponent from './DidMountCapableComponent';

/**
 * Complete component interface that supports all lifecycle methods
 */
export default interface FullLifecycleComponent
  extends BeforeMountCapableComponent,
    DidMountCapableComponent,
    AfterMountCapableComponent {
  render(): any;
}
