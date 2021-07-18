import React from 'react';

const SCALE_STEP = 0.5;
const MIN_SCALE = 1.0;
const MAX_SCALE = 50.0

export default class Spectrogram extends React.Component {
  constructor(props) {
    super(props);
    this.state = {scale: 1};
  }

  on_wheel(e) {
    let new_scale = this.state.scale + (e.deltaY > 0 ? -SCALE_STEP : SCALE_STEP);
    new_scale = Math.min(Math.max(new_scale, MIN_SCALE), MAX_SCALE);

    if (new_scale != this.state.scale) {
      // console.log('scale', new_scale);
      this.setState({scale: new_scale});
    }
  }

  render() {
    if (!this.props.spectrum_file) {
      return null;
    }

    const scale = this.state.scale;
    const w = this.props.width * scale, h = this.props.height;

    return (
      <div className="svg-outer-holder" onWheel={(e) => this.on_wheel(e)}>
        <div className="svg-holder">
          <svg className="svg-block" width={w} >
            <image href={this.props.spectrum_file} preserveAspectRatio="none"
              x={0} y={0} width={w} height={h} />
          </svg>
        </div>
      </div>
    );
  }
}
