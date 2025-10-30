declare module 'rrweb-player' {
  interface RRWebPlayerProps {
    events: any[];
    width?: number | string;
    height?: number | string;
    autoPlay?: boolean;
    showController?: boolean;
  }

  interface RRWebPlayerOptions {
    target: HTMLElement;
    props: RRWebPlayerProps;
  }

  export default class rrwebPlayer {
    constructor(options: RRWebPlayerOptions);
    destroy(): void;
  }
}
