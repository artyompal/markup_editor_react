import os from 'os';
import path from 'path';

import React from 'react';
import AudioPlayer from 'react-h5-audio-player';

import { ipcRenderer } from 'electron';
import { spawnSync } from 'child_process';
import { tmpNameSync } from 'tmp';

import 'react-h5-audio-player/lib/styles.css'


export class MainWindow extends React.Component {
  constructor(props) {
    super(props);
    this.state = {mp3_file: undefined, spectrum_file: undefined};
    ipcRenderer.on('open_audio', (event, message) => this.open_audio(message));
  }

  open_audio(mp3_file: string) {
      console.log('opening', mp3_file);

      const spectrum_file = tmpNameSync({postfix: '.png'});
      console.log('writing spectrogram to', spectrum_file);
      spawnSync('python', ['gen_spectrogram.py', spectrum_file, mp3_file],
        {cwd: '../ml_auto_scores/'});

      this.setState({...this.state,
        mp3_file: 'file://' + mp3_file, spectrum_file: 'file://' + spectrum_file});
  }

  render() {
    if (!this.state.mp3_file) {
      return null;
    }

    return (
      <div>
        <svg>
          <image href={this.state.spectrum_file} />
        </svg>
        <div className="Application">
          <AudioPlayer style={styles.player} src={this.state.mp3_file}/>
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
