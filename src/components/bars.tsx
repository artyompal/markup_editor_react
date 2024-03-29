import React from 'react';
import interact from 'interactjs'

import {event2time, find_closest} from '../logic/utils';
import MainWindow from './main_window';
import * as utils from '../logic/utils';

interface BarsProps {
  bars: number[];
  logical_width: number;
  duration: number;
  holder: React.RefObject<any>;
  main_win: MainWindow;
  time: number;
}

interface BarsState {
  dragged_bar?: number;
  drag_pos: number;
};

export default class Bars extends React.Component<BarsProps, BarsState> {
  alt_mode: boolean = false;

  constructor(props: BarsProps) {
    super(props);
    this.state = { dragged_bar: undefined, drag_pos: 0 };

    interact('.bar')
      .draggable({
        cursorChecker() { return 'col-resize'; },
        listeners: { start: this.on_drag_start, move: this.on_drag, end: this.on_drag_end, }
      })

  }

  on_drag_start = (e: React.MouseEvent): void => {
    this.alt_mode = e.shiftKey;
    const coord = event2time(this.props.holder, e, this.props.logical_width, this.props.duration);
    const idx = find_closest(this.props.bars, coord);
    this.setState({ dragged_bar: idx });
  }

  on_drag = (e: React.MouseEvent): void => {
    const pos = event2time(this.props.holder, e, this.props.logical_width, this.props.duration);
    this.setState({ drag_pos: pos });
  }

  on_drag_end = (e: React.MouseEvent): void => {
    if (this.state.dragged_bar !== undefined) {
      const coord = event2time(this.props.holder, e, this.props.logical_width, this.props.duration);
      this.props.main_win.replace_bar(this.state.dragged_bar, coord, this.alt_mode);
      this.setState({ dragged_bar: undefined });
    }
  }

  render(): React.ReactNode {
    const active_bar = utils.find_closest(this.props.bars, this.props.time);
    return this.props.bars.map((coord, idx) => {
      if (coord < 0 || coord >= this.props.duration) {
        return null;
      }

      let x = coord * this.props.logical_width / this.props.duration;
      let class_name = 'bar';

      if (idx == this.state.dragged_bar) {
        class_name += ' dragged-bar';
        x = this.state.drag_pos * this.props.logical_width / this.props.duration;
      } else if (idx == active_bar) {
        class_name += ' active-bar';
      } else {
        class_name += ' normal-bar';
      }

      return (
        <line className={class_name} key={idx} x1={x} x2={x} y1={0} y2={10000} />
      );
    });
  }
}
