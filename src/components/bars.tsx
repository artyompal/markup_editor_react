import React from 'react';


interface BarsProps {
  bars: number[];
  logical_width: number;
  duration: number;
  active_bar: number;
}


export default class Bars extends React.Component<BarsProps> {
  constructor(props: BarsProps) {
    super(props);
  }

  render(): React.ReactNode {
    return this.props.bars.map((coord, idx) => {
      if (coord < 0 || coord >= this.props.duration) {
        return null;
      }

      const x = coord * this.props.logical_width / this.props.duration;
      const class_name = (idx == this.props.active_bar) ? ' active_bar' : 'bar';

      return (
        <line className={class_name} key={idx} x1={x} x2={x} y1={0} y2={10000} />
      );
    });
  }
}
