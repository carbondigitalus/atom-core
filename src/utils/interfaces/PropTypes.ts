export default interface PropTypes {
  [key: string]: (
    value: any,
    propName: string,
    componentName: string
  ) => Error | null;
}
