// Custom Modules
import VNode from '../interfaces/VNode';

export abstract class Component<P = object, S = object> {
  props: P;
  state: S;

  constructor(props: P) {
    this.props = props;
    this.state = {} as S;
  }

  abstract render(): VNode<any> | null;
}
