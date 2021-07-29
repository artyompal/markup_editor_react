import React from 'react';

const SCALE_STEP = 0.5;
const MIN_SCALE = 1.0;
const MAX_SCALE = 50.0;


interface SpectrogramProps {
  spectrum_file: string;
  bars: number[];
  duration: number;
  time: number;
  main_window: any;
  width: number;
  height: number;
}

interface SpectrogramState {
  scale: number;
}

export default class Spectrogram extends React.Component<SpectrogramProps, SpectrogramState> {
  scroll_holder: any;

  constructor(props: SpectrogramProps) {
    super(props);
    this.state = {scale: 1};
    this.scroll_holder = React.createRef();
  }

  on_wheel(e: React.SyntheticEvent) {
    // @ts-ignore
    let new_scale = this.state.scale + (e.deltaY > 0 ? -SCALE_STEP : SCALE_STEP);
    new_scale = Math.min(Math.max(new_scale, MIN_SCALE), MAX_SCALE);

    if (new_scale != this.state.scale) {
      this.setState({scale: new_scale});
    }
  }

  on_double_click(e: React.SyntheticEvent) {
    e.preventDefault();

    const rect = this.scroll_holder.current.getBoundingClientRect();
    // @ts-ignore
    const time = (this.scroll_holder.current.scrollLeft + e.clientX - rect.left) /
                 (this.props.width * this.state.scale) * this.props.duration;

    this.props.main_window.seek(time);
  }

  render() {
    if (!this.props.spectrum_file || !this.props.duration) {
      return null;
    }

    const scale = this.state.scale;
    const w = this.props.width * scale, h = this.props.height;
    const pos = w * this.props.time / this.props.duration;

    return (
      <div className="svg-outer-holder" onWheel={(e) => this.on_wheel(e)}>
        <div className="svg-holder" ref={this.scroll_holder}>
          <svg className="svg-block" width={w} onDoubleClick={(e) => this.on_double_click(e)}>
            <image href={this.props.spectrum_file} preserveAspectRatio="none"
              x={0} y={0} width={w} height={h} />
            { this.render_marks() }
            <line className="cursor" y1={0} y2={10000} x1={pos} x2={pos} />
          </svg>
        </div>
      </div>
    );
  }

  render_marks() {
    if (!this.props.bars) {
      return null;
    }

    return this.props.bars.map((coord, idx) => {
      if (coord < 0 || coord >= this.props.duration) {
        return null;
      }

      const x = coord * this.props.width * this.state.scale  / this.props.duration;
      return (
        <line className="mark" key={idx} x1={x} x2={x} y1={0} y2={10000} />
      );
    });
  }
}
