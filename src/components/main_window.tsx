import os from 'os';
import path from 'path';

import React from 'react';
import AudioPlayer from 'react-h5-audio-player';

import { ipcRenderer } from 'electron';
import { spawnSync } from 'child_process';
import { tmpNameSync } from 'tmp';
import image_size from 'image-size';

import 'react-h5-audio-player/lib/styles.css'

import Spectrogram from 'components/spectrogram';


export default class MainWindow extends React.Component {
  constructor(props) {
    super(props);
    this.state = {mp3_file: undefined, spectrum_file: undefined,
      duration: undefined, time: 0,
      spectrum_width: 0, spectrum_height: 0};
    this.player = React.createRef();
    ipcRenderer.on('open_audio', (event, message) => this.open_audio(message));
  }

  open_audio(mp3_file: string) {
    console.log('opening', mp3_file);

    const spectrum_file = tmpNameSync({postfix: '.png'});
    console.log('writing spectrogram to', spectrum_file);
    spawnSync('python', ['gen_spectrogram.py', spectrum_file, mp3_file],
      {cwd: '../ml_auto_scores/'});

    const spectrum_sz = image_size(spectrum_file);
    console.log('spectrum_sz', spectrum_sz);

    this.setState({...this.state,
      mp3_file: 'file://' + mp3_file, spectrum_file: 'file://' + spectrum_file,
      spectrum_width: spectrum_sz.width, spectrum_height: spectrum_sz.height});
  }

  on_playing() {
    this.setState({...this.state, duration: this.player.current.audio.current.duration,
                   time: this.player.current.audio.current.currentTime});
  }

  render() {
    if (!this.state.mp3_file) {
      return null;
    }

    return (
      <div>
        <Spectrogram spectrum_file={this.state.spectrum_file}
          duration={this.state.duration} time={this.state.time}
          width={this.state.spectrum_width} height={this.state.spectrum_height} />
        <AudioPlayer className="player" autoPlayAfterSrcChange={false}
          src={this.state.mp3_file} ref={this.player}
          onLoadedData={() => this.on_playing()} onListen={() => this.on_playing()}
          listenInterval={16}
          />
      </div>
    );
  }
}
