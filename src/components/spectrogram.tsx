import React from 'react';

export default class Spectrogram extends React.Component {
  render() {
    if (!this.props.spectrum_file) {
      return null;
    }

    const scale = 1, offset = 0;
    const transform = `scale(1, ${scale}) translate(${-offset},0)`;
    const w = this.props.width, h = this.props.height;

    return (
      <div className="svg-outer-holder">
        <div className="svg-holder">
          <svg className="svg-block" width={w} >
            <image href={this.props.spectrum_file} preserveAspectRatio="none"
              x={0} y={0} width={w} height={h} transform={transform} />
          </svg>
        </div>
      </div>
    );
  }
}
