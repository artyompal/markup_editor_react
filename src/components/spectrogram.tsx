import React from 'react';

export default class Spectrogram extends React.Component {
  render() {
    if (!this.props.spectrum_file) {
      return null;
    }

    const scale = 1, offset = 0;
    const transform = `scale(${scale},1) translate(${-offset},0)`;

    return (
      <div className="svg-holder">
        <svg className="svg-block" viewBox="0 0 100 100">
          <defs>
            <clipPath id="cut-off">
              <rect x="0" y="0" width="100" height="100" />
            </clipPath>
          </defs>
          <image href={this.props.spectrum_file} preserveAspectRatio="none"
             clipPath="url(#cut-off)" transform={transform} />
        </svg>
      </div>
    );
  }
}
