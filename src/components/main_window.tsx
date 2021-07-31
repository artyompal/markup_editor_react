import fs from 'fs';
import path from 'path';

import React from 'react';
import AudioPlayer from 'react-h5-audio-player';
import { Helmet } from 'react-helmet'

import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';

import NoteAddIcon from '@material-ui/icons/NoteAdd';
import CloseIcon from '@material-ui/icons/Close';
import UndoIcon from '@material-ui/icons/Undo';
import RedoIcon from '@material-ui/icons/Redo';
import FilterListIcon from '@material-ui/icons/FilterList';
import AddIcon from '@material-ui/icons/Add';
import RemoveIcon from '@material-ui/icons/Remove';

import Modal from 'react-bootstrap/Modal'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'

import child_process from 'child_process';
import image_size from 'image-size';

import 'react-h5-audio-player/lib/styles.css'

import Spectrogram from './spectrogram';
import FileTable from './file_table';
import * as editor from '../logic/editor';

import {CACHE_PATH, MP3_BASE_PATH} from '../logic/settings';


interface MainWindowProps {
}

interface MainWindowState {
  mp3_url: string;
  spectrum_url: string;
  bars: number[],
  duration: number;
  show_filter_dialog: boolean;
  spectrum_width: number;
  spectrum_height: number;
  artist: string;
  song_name: string;
}

export default class MainWindow extends React.Component<MainWindowProps, MainWindowState> {
  mp3_path: string = '';
  player: any;
  ref_filter_start: any;
  ref_filter_freq: any;
  num_processes: number;

  constructor(props: MainWindowProps) {
    super(props);
    this.state = {mp3_url: '', spectrum_url: '', bars: [],
      duration: 0, show_filter_dialog: false,
      spectrum_width: 0, spectrum_height: 0, artist: '', song_name: ''};

    this.player = React.createRef();
    this.ref_filter_start = React.createRef();
    this.ref_filter_freq = React.createRef();
    this.num_processes = 0;
  }

  get_cache_path(file_path: string, suffix: string): string {
    file_path = fs.realpathSync(file_path);

    if (file_path.startsWith(MP3_BASE_PATH)) {
      file_path = file_path.substr(MP3_BASE_PATH.length)
    }

    return path.join(CACHE_PATH, file_path + suffix);
  }

  generate_spectrogram(mp3_path: string) {
    const load_spectrogram = () => {
      console.log('loading spectrogram', spectrum_path);
      const spectrum_sz = image_size(spectrum_path);
      this.setState({mp3_url: 'file://' + mp3_path,
                     spectrum_url: 'file://' + spectrum_path, // @ts-ignore
                     spectrum_width: spectrum_sz.width, // @ts-ignore
                     spectrum_height: spectrum_sz.height});
    }

    const spectrum_path = this.get_cache_path(mp3_path, '.cqt.png');

    if (fs.existsSync(spectrum_path)) {
      load_spectrogram();
      return;
    }

    console.log('generating spectrogram for', mp3_path);
    const child = child_process.spawn('python', ['gen_spectrogram.py', spectrum_path, mp3_path],
      {cwd: '../ml_auto_scores/'});
    this.num_processes++;

    child.on('exit', (code: number) => {
      this.num_processes--;

      if (code == 0) {
        load_spectrogram();
      } else {
        console.error('spectrogram generator returned an error', code);
      }
    });
  }

  generate_beats(mp3_path: string, handler: (bars: number[]) => any) {
    const beats_path = this.get_cache_path(mp3_path, '.beats.json');

    if (fs.existsSync(beats_path)) {
      const bars = JSON.parse(fs.readFileSync(beats_path).toString());
      handler(bars);
      return;
    }

    console.log('launching beat detector for', mp3_path);
    let child = child_process.spawn('tools/streaming_rhythmextractor_multifeature', [mp3_path]);
    this.num_processes++;

    child.on('exit', (code) => {
      this.num_processes--;

      if (code == 0) {
        child.stdout.read().toString().split('\n').forEach((line: string) => {
          if (line.startsWith('ticks: ')) {
            const bars = JSON.parse(line.substr(7));

            fs.mkdirSync(path.dirname(beats_path), {recursive: true});
            fs.writeFileSync(beats_path, JSON.stringify(bars));

            handler(bars);
          }
        });
      } else {
        console.error('beat detector returned an error', code);
      }
    });
  }

  create_new() {
    this.generate_beats(this.mp3_path, (bars: number[]) => {
      this.setState(editor.create_file(this.mp3_path, bars));
    });
  }

  // @ts-ignore
  open_file(artist: string, song_name: string, mp3_path: string, tab_path: string) {
    this.mp3_path = mp3_path;
    this.generate_spectrogram(mp3_path);

    if (editor.have_file(mp3_path)) {
      this.setState(editor.open_file(mp3_path));
    } else {
      this.create_new();
    }

    const capitalize = (s: string) => s.substring(0, 1).toUpperCase() + s.substr(1);
    this.setState({artist: capitalize(artist), song_name: capitalize(song_name)});
  }

  close_file()  {
    editor.close_file();
    this.setState({mp3_url: '', spectrum_url: '', bars: []});
  }

  on_loaded_data() {
    if (this.player.current.audio) {
      const audio = this.player.current.audio.current;
      this.setState({ duration: audio.duration });
    }
  }

  seek(time: number) {
    if (time >= 0 && time < this.state.duration) {
      this.player.current.audio.current.currentTime = time;
    }
  }

  toggle_playback() {
    if (this.player.current && this.player.current.audio.current) {
      const audio = this.player.current.audio.current;

      if ((audio.paused || audio.ended) && audio.src) {
        audio.play();
      } else if (!audio.paused) {
        audio.pause();
      }
    }
  }

  on_key_down = (e: React.KeyboardEvent): void => {
    switch (e.key) {
      case ' ':
        e.preventDefault() // Prevent scrolling page by pressing Space key
        e.stopPropagation();
        this.toggle_playback();
        break;
    }
  }

  render_title(status: string) {
    let title = 'Music Markup Editor' + status;
    return (
      <Helmet>
        <title>{title}</title>
      </Helmet>
    );
  }

  render_toolbar() {
    return (
      <>
        <div className="toolbar">
          <Tooltip title="Regenerate default bars">
            <IconButton aria-label="Create file" disableRipple={true}
              onClick={() => this.create_new()}>
            <NoteAddIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Close file">
            <IconButton aria-label="Close file" disableRipple={true}
              onClick={() => this.close_file()}>
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </div>
        <div className="toolbar">
          <Tooltip title="Undo">
            <span>
              <IconButton aria-label="Undo" disableRipple={true} disabled={!editor.can_undo()}>
                <UndoIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Redo">
            <span>
              <IconButton aria-label="Redo" disableRipple={true} disabled={!editor.can_redo()}>
                <RedoIcon />
              </IconButton>
            </span>
          </Tooltip>
        </div>
        <div className="toolbar">
          <Tooltip title="Filter bars">
            <IconButton aria-label="Filter" disableRipple={true}
              onClick={() => {this.setState({show_filter_dialog: true})}}>
              <FilterListIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Add bar">
            <IconButton aria-label="Add bar" disableRipple={true}>
              <AddIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Remove bar">
            <IconButton aria-label="Remove bar" disableRipple={true}>
              <RemoveIcon />
            </IconButton>
          </Tooltip>
        </div>
      </>
    );
  }

  render_filter_bars_dialog() {
    const on_submit = () => {
      const start = parseInt(this.ref_filter_start.current.value);
      const freq = parseInt(this.ref_filter_freq.current.value);

      this.setState({
        bars: editor.filter_bars(start, freq).bars,
        show_filter_dialog: false,
      });
    }

    return (
      <Modal show={true} centered onHide={() => {
        this.setState({show_filter_dialog: false})}} >
        <Modal.Header>
          <Modal.Title>Filter Bars - please enter parameters:</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={() => on_submit()}>
            <Row className="mb-3">
              <Form.Group as={Col}>
                <Form.Label>Start offset</Form.Label>
                <Form.Control type="number" placeholder="Enter a number"
                  ref={this.ref_filter_start}
                  />
              </Form.Group>

              <Form.Group as={Col}>
                <Form.Label>Frequency</Form.Label>
                <Form.Control type="number" placeholder="Enter a number"
                  ref={this.ref_filter_freq} />
              </Form.Group>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
            <Button variant="primary" onClick={on_submit}>OK</Button>
            <Button variant="secondary"
              onClick={() => {this.setState({show_filter_dialog: false})}}
              >Cancel</Button>
        </Modal.Footer>
      </Modal>
    );
  }

  render_progress_window() {
    return (
      <Modal show={true} backdrop="static" keyboard={false} centered>
        <Modal.Header >
          <Modal.Title>Sound data processing</Modal.Title>
        </Modal.Header>
        <Modal.Body>Sound data is being processed. Please wait...</Modal.Body>
        <Modal.Footer>
        </Modal.Footer>
      </Modal>
    );
  }

  render() {
    if (!this.state.mp3_url || !this.state.bars) {
      return (
        <div>
          {this.render_title(' | Select song to continue')}
          <FileTable main_window={this}/>
          {this.num_processes !== 0 ? this.render_progress_window() : null}
        </div>
      );
    } else {
      return (
        <div onKeyDown={this.on_key_down} tabIndex={0}>
          {this.render_title(` | ${this.state.artist} - ${this.state.song_name}`)}
          {this.render_toolbar()}
          <Spectrogram
            spectrum_url={this.state.spectrum_url} bars={this.state.bars}
            duration={this.state.duration} main_window={this}
            audio={this.player.current ? this.player.current.audio.current : null}
            width={this.state.spectrum_width} height={this.state.spectrum_height} />
          <AudioPlayer
            className="player" autoPlayAfterSrcChange={false}
            src={this.state.mp3_url} ref={this.player}
            onLoadedData={() => this.on_loaded_data()}
            />
          {this.state.show_filter_dialog ? this.render_filter_bars_dialog() : null}
        </div>
      );
    }
  }
}
