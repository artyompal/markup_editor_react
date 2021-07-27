import fs from 'fs';
import os from 'os';
import path from 'path';

import React from 'react';
import AudioPlayer from 'react-h5-audio-player';
import { Helmet } from 'react-helmet'

import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';

import child_process from 'child_process';
import image_size from 'image-size';

import 'react-h5-audio-player/lib/styles.css'

import Spectrogram from 'components/spectrogram';
import FileTable from 'components/file_table';

import {CACHE_PATH, MP3_BASE_PATH} from 'settings/constants';


export default class MainWindow extends React.Component {
  constructor(props) {
    super(props);
    this.state = {mp3_file: undefined, spectrum_file: undefined, marks: [],
      duration: undefined, time: 0,
      spectrum_width: 0, spectrum_height: 0};

    this.player = React.createRef();
  }

  get_cache_path(file_path: string, suffix: string) {
    file_path = fs.realpathSync(file_path);

    if (file_path.startsWith(MP3_BASE_PATH)) {
      file_path = file_path.substr(MP3_BASE_PATH.length)
    }

    return path.join(CACHE_PATH, file_path + suffix);
  }

  generate_spectrogram(mp3_path: string) {
    let load_spectrogram = () => {
      console.log('loading spectrogram', spectrum_path);
      const spectrum_sz = image_size(spectrum_path);
      this.setState({mp3_file: 'file://' + mp3_path, spectrum_file: 'file://' + spectrum_path,
                     spectrum_width: spectrum_sz.width, spectrum_height: spectrum_sz.height});
    }

    const spectrum_path = this.get_cache_path(mp3_path, '.cqt.png');

    if (fs.existsSync(spectrum_path)) {
      load_spectrogram();
      return;
    }

    console.log('generating spectrogram for', mp3_path);
    let child = child_process.spawn('python', ['gen_spectrogram.py', spectrum_path, mp3_path],
      {cwd: '../ml_auto_scores/'});

    child.on('exit', (code) => {
      if (code == 0) {
        load_spectrogram();
      } else {
        console.error('spectrogram generator returned an error', code);
      }
    });
  }

  generate_beats(mp3_path: string) {
    const beats_path = this.get_cache_path(mp3_path, '.beats.json');

    if (fs.existsSync(beats_path)) {
      console.log('loading beats', beats_path);
      const beats = JSON.parse(fs.readFileSync(beats_path));
      this.setState({marks: beats});
      return;
    }

    console.log('launching beat detector for', mp3_path);
    let child = child_process.spawn('tools/streaming_rhythmextractor_multifeature', [mp3_path]);

    child.on('exit', (code) => {
      if (code == 0) {
        child.stdout.read().toString().split('\n').forEach((line) => {
          if (line.startsWith('ticks: ')) {
            const beats = JSON.parse(line.substr(7));

            fs.mkdirSync(path.dirname(beats_path), {recursive: true});
            fs.writeFileSync(beats_path, JSON.stringify(beats));

            this.setState({...this.state, marks: beats});
          }
        });
      } else {
        console.error('beat detector returned an error', code);
      }
    });
  }

  open_song(artist: string, song_name: string, mp3_path: string, tab_path: string) {
    this.generate_spectrogram(mp3_path);
    this.generate_beats(mp3_path);

    const capitalize = (s) => s.substring(0, 1).toUpperCase() + s.substr(1);
    this.setState({artist: capitalize(artist), song_name: capitalize(song_name)});
  }

  close_song() {
    this.setState({mp3_file: undefined, spectrum_file: undefined, marks: []});
  }

  on_playing() {
    if (this.player && this.player.current && this.player.current.audio) {
      this.setState({...this.state,
                     duration: this.player.current.audio.current.duration,
                     time: this.player.current.audio.current.currentTime});
    }
  }

  seek(time: float) {
    if (time >= 0 && time < this.state.duration) {
      this.player.current.audio.current.currentTime = time;
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

  render_toolbar() {
    return (
      <Toolbar>
        <IconButton aria-label="Close file" className="large_icon" disableRipple={true}
          onClick={() => this.close_song()}>
          <CloseIcon />
        </IconButton>
      </Toolbar>
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
          {this.render_title(` | ${this.state.artist} - ${this.state.song_name}`)}
          {this.render_toolbar()}
          <Spectrogram
            spectrum_file={this.state.spectrum_file} marks={this.state.marks}
            duration={this.state.duration} time={this.state.time} main_window={this}
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
