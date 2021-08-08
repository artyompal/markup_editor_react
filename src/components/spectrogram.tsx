import React from 'react';

import CursorAndBars from './cursor_and_bars';
import * as utils from '../logic/utils';
import MainWindow from './main_window';

const SCALE_STEP = 0.5;
const MIN_SCALE = 1.0;
const MAX_SCALE = 50.0;

interface SpectrogramProps {
  spectrum_url: string;
  bars: number[];
  duration: number;
  main_window: any;
  width: number;
  height: number;
  audio?: HTMLAudioElement;
  main_win: MainWindow;
  focus_time: number;
}

interface SpectrogramState {
  scale: number;
}

export default class Spectrogram extends React.Component<SpectrogramProps, SpectrogramState> {
  holder: React.RefObject<any>;
  focus_time: number = 0;

  constructor(props: SpectrogramProps) {
    super(props);
    this.state = {scale: 1};
    this.holder = React.createRef();
  }

  on_wheel = (e: React.SyntheticEvent): void => { // @ts-ignore
    let new_scale = this.state.scale + (e.deltaY > 0 ? -SCALE_STEP : SCALE_STEP);
    new_scale = Math.min(Math.max(new_scale, MIN_SCALE), MAX_SCALE);

    if (new_scale != this.state.scale) {
      this.setState({scale: new_scale});
    }
  }

  on_double_click = (e: React.SyntheticEvent): void => {
    e.preventDefault();
    const logical_width = this.props.width * this.state.scale;
    const time = utils.event2time(this.holder, e, logical_width, this.props.duration);
    this.props.main_window.seek(time);
  }

  render(): React.ReactNode {
    if (!this.props.spectrum_url || !this.props.duration) {
      return null;
    }

    const scale = this.state.scale;
    const w = this.props.width * scale, h = this.props.height;

    if (this.holder.current && this.props.focus_time != this.focus_time) {
      this.focus_time = this.props.focus_time;

      const start = utils.coord2time(this.holder, 0, w, this.props.duration);
      const end = utils.coord2time(this.holder, this.holder.current.clientWidth, w,
                                   this.props.duration);

      if (this.focus_time < start || this.focus_time >= end) {
        const coord = w * this.focus_time / this.props.duration;
        this.holder.current.scrollLeft = coord;
      }
    }

    return (
      <div className="svg-outer-holder" onWheel={this.on_wheel} >
        <div className="svg-holder" ref={this.holder}  >
          <svg className="svg-block" width={w} onDoubleClick={this.on_double_click} >
            <image href={this.props.spectrum_url} preserveAspectRatio="none"
             x={0} y={0} width={w} height={h} />
            <CursorAndBars logical_width={w} duration={this.props.duration} audio={this.props.audio}
             bars={this.props.bars} holder={this.holder} main_win={this.props.main_win} />
          </svg>
        </div>
      </div>
    );
  }
}
