import React from 'react';

import AudioPlayer from 'react-h5-audio-player';
import {ipcRenderer} from 'electron';

import 'react-h5-audio-player/lib/styles.css'


export class MainWindow extends React.Component {
  constructor(props) {
    super(props);
    this.state = {'file': undefined};
    ipcRenderer.on('open_audio', (event, message) => this.open_audio(message));
  }

  open_audio(filename: string) {
      console.log('opening', filename);
      this.setState({...this.state, 'file': 'file://' + filename});
      // console.log('new state', this.state);
  }

  render() {
    // console.log('render(): state', this.state);

    if (!this.state.file) {
      return null;
    }

    return (
      <div>
        <div className="Application">
          <AudioPlayer style={styles.player} url={this.state.file}/>
        </div>
      </div>
    );
  }
}

const styles = {
  player: {
    width: '1000px',
    allgn: 'center',
  }
}
