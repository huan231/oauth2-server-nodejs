export const decodeFormURLComponent = (encodedFormURLComponent: string) => {
  return decodeURIComponent(encodedFormURLComponent.replace(/\+/g, '%20'));
};
