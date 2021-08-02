import React from 'react';


interface BarsProps {
  bars: number[];
  logical_width: number;
  duration: number;
}

interface BarsState {
}


export default class Bars extends React.Component<BarsProps, BarsState> {
  constructor(props: BarsProps) {
    super(props);
    // this.state = { time: 0 };
  }

  render(): React.ReactNode {
    return this.props.bars.map((coord, idx) => {
      if (coord < 0 || coord >= this.props.duration) {
        return null;
      }

      const x = coord * this.props.logical_width / this.props.duration;
      return (
        <line className="mark" key={idx} x1={x} x2={x} y1={0} y2={10000} />
      );
    });
  }
}
