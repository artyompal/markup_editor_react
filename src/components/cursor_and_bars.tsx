import React from 'react';

import Bars from './bars';


interface CursorAndBarsProps {
  logical_width: number;
  duration: number;
  audio?: HTMLAudioElement;
  bars: number[];
}

interface CursorAndBarsState {
  time: number;
}


export default class CursorAndBars extends React.Component<CursorAndBarsProps, CursorAndBarsState> {
  raf_handle?: number;

  constructor(props: CursorAndBarsProps) {
    super(props);
    this.state = { time: 0 };
  }

  componentDidMount(): void {
    if (this.props.audio) {
      this.props.audio.addEventListener('play', this.on_play);
      this.props.audio.addEventListener('pause', this.on_pause);
      this.props.audio.addEventListener('seeked', this.on_seek);
    }
  }

  // @ts-ignore
  shouldComponentUpdate(next_props: CursorAndBarsProps, next_state: CursorAndBarsState): boolean {
    if (next_props.audio && !this.props.audio) {
      next_props.audio.addEventListener('play', this.on_play);
      next_props.audio.addEventListener('pause', this.on_pause);
      next_props.audio.addEventListener('seeked', this.on_seek);
    }

    return true;
  }

  componentWillUnmount(): void {
    this.on_pause();

    if (this.props.audio) {
      this.props.audio.removeEventListener('play', this.on_play);
      this.props.audio.removeEventListener('pause', this.on_pause);
      this.props.audio.removeEventListener('seeked', this.on_seek);
    }
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
      <>
        <line className="cursor" y1={0} y2={10000} x1={pos} x2={pos} />
        <Bars bars={this.props.bars} logical_width={this.props.logical_width}
          duration={this.props.duration} / >
      </>
    );
  }
}
