import React from 'react';


interface CursorProps {
  logical_width: number;
  duration: number;
  audio?: HTMLAudioElement;
}

interface CursorState {
  time: number;
}


export default class Cursor extends React.Component<CursorProps, CursorState> {
  raf_handle?: number;

  constructor(props: CursorProps) {
    super(props);
    this.state = { time: 0 };
  }

  componentDidMount(): void {
    if (this.props.audio) {
      this.props.audio.addEventListener('play', this.on_play);
      this.props.audio.addEventListener('pause', this.on_pause);
      this.props.audio.addEventListener('seeked', this.on_seek);
    } else {
      console.error('this.props.audio is', this.props.audio);
    }
  }

  componentWillUnmount(): void {
    this.on_pause();
  }

  on_play = (): void => {
    const redraw = (): void => { // @ts-ignore
      this.setState({ time: this.props.audio.currentTime });
      this.raf_handle = window.requestAnimationFrame(redraw);
    }

    this.raf_handle = window.requestAnimationFrame(redraw);
  }

  on_pause = (): void => {
    if (this.raf_handle) {
      cancelAnimationFrame(this.raf_handle);
    }
  }

  on_seek = (): void => {
    // @ts-ignore
    this.setState({ time: this.props.audio.currentTime });
  }

  render(): React.ReactNode {
    const pos = this.props.logical_width * this.state.time / this.props.duration;

    return (
      <line className="cursor" y1={0} y2={10000} x1={pos} x2={pos} />
    );
  }
}
