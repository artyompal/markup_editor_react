import os from 'os';
import path from 'path';

import React from 'react';
import AudioPlayer from 'react-h5-audio-player';

import { ipcRenderer } from 'electron';
import { spawnSync } from 'child_process';
import { tmpNameSync } from 'tmp';

import 'react-h5-audio-player/lib/styles.css'

import Spectrogram from 'components/spectrogram';


export default class MainWindow extends React.Component {
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

    const scale = 1, offset = 0;
    const transform = `scale(${scale},1) translate(${-offset},0)`;

    return (
      <div className="Application">
        <Spectrogram spectrum_file={this.state.spectrum_file} />
        <AudioPlayer className="player" src={this.state.mp3_file}/>
      </div>
    );
  }
}
