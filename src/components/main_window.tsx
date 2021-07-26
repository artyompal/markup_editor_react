import fs from 'fs';
import os from 'os';
import path from 'path';

import React from 'react';
import AudioPlayer from 'react-h5-audio-player';
import { Helmet } from 'react-helmet'

import child_process from 'child_process';
import image_size from 'image-size';

import 'react-h5-audio-player/lib/styles.css'

import Spectrogram from 'components/spectrogram';
import FileTable from 'components/file_table';

import {CACHE_PATH, MP3_BASE_PATH} from 'settings/constants';


export default class MainWindow extends React.Component {
  constructor(props) {
    super(props);
    this.state = {mp3_file: undefined, spectrum_file: undefined, marks: undefined,
      duration: undefined, time: 0,
      spectrum_width: 0, spectrum_height: 0};

    this.player = React.createRef();
  }

  /* open_audio(mp3_file: string) {
    console.log('opening audio', mp3_file);

    const spectrum_file = tmpNameSync({postfix: '.png'});
    console.log('writing spectrogram to', spectrum_file);
    spawnSync('python', ['gen_spectrogram.py', spectrum_file, mp3_file],
      {cwd: '../ml_auto_scores/'});

    const spectrum_sz = image_size(spectrum_file);
    this.setState({...this.state,
      mp3_file: 'file://' + mp3_file, spectrum_file: 'file://' + spectrum_file,
      spectrum_width: spectrum_sz.width, spectrum_height: spectrum_sz.height});
  }

  open_markup(markup_file: string) {
    console.log('opening markup', markup_file);
    const content = JSON.parse(fs.readFileSync(markup_file));
    this.setState({...this.state, marks: content['measure_times']});
  }*/

  get_cache_path(file_path: string, suffix: string) {
    file_path = fs.realpathSync(file_path);

    if (file_path.startsWith(MP3_BASE_PATH)) {
      file_path = file_path.substr(MP3_BASE_PATH.length)
    }

    return path.join(CACHE_PATH, file_path + suffix);
  }

  generate_beats(beats_path: string, mp3_path: string) {
    if (fs.existsSync(beats_path)) {
      const beats = JSON.parse(fs.readFileSync(beats_path));
      this.setState({...this.state, marks: beats});
      return;
    }

    console.log('launching beat detector for', mp3_path);
    let child = child_process.spawn('tools/streaming_rhythmextractor_multifeature', [mp3_path]);

    child.on('exit', (code) => {
      if (code == 0) {
        child.stdout.read().toString().split('\n').forEach((line) => {
          console.log(line);
          if (line.startsWith('ticks: ')) {
            const beats = JSON.parse(line.substr(7));

            fs.mkdirSync(path.dirname(beats_path), {recursive: true});
            fs.writeFileSync(beats_path, JSON.stringify(beats));

            this.setState({...this.state, marks: beats});
          }
        });
      }
    });
  }

  open_song(artist: string, title: string, mp3_path: string, tab_path: string) {
    const beats_path = this.get_cache_path(mp3_path, '.beats');
    this.generate_beats(beats_path, mp3_path);
  }

  on_playing() {
    if (this.player && this.player.current && this.player.current.audio) {
      this.setState({...this.state,
                     duration: this.player.current.audio.current.duration,
                     time: this.player.current.audio.current.currentTime});
    }
  }

  render_title(hint) {
    let title = 'Music Markup Editor' + hint;
    return (
      <Helmet>
        <title>{title}</title>
      </Helmet>
    );
  }

  render() {
    if (!this.state.mp3_file) {
      return (
        <div>
          {this.render_title(' | Select song to continue')}
          <FileTable main_window={this}/>
        </div>
      );
    } else {
      return (
        <div>
          {this.render_title(' | Author - Song')}
          <Spectrogram
            spectrum_file={this.state.spectrum_file} marks={this.state.marks}
            duration={this.state.duration} time={this.state.time}
            width={this.state.spectrum_width} height={this.state.spectrum_height} />
          <AudioPlayer
            className="player" autoPlayAfterSrcChange={false}
            src={this.state.mp3_file} ref={this.player}
            onLoadedData={() => this.on_playing()} onListen={() => this.on_playing()}
            listenInterval={16}
            />
        </div>
      );
    }
  }
}
