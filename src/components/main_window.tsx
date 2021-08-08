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
import OpenInBrowserIcon from '@material-ui/icons/OpenInBrowser';

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
  cur_measure: number;
}

export default class MainWindow extends React.Component<MainWindowProps, MainWindowState> {
  mp3_path: string = '';
  player: any;
  ref_filter_start: any;
  ref_filter_freq: any;
  num_processes: number;
  cur_measure: number = 1;
  scores_wildcard: string = '';
  full_scores: string = '';

  constructor(props: MainWindowProps) {
    super(props);
    this.state = {mp3_url: '', spectrum_url: '', bars: [],
      duration: 0, show_filter_dialog: false,
      spectrum_width: 0, spectrum_height: 0, artist: '', song_name: '', cur_measure: 1};

    this.player = React.createRef();
    this.ref_filter_start = React.createRef();
    this.ref_filter_freq = React.createRef();
    this.num_processes = 0;
  }

  componentWillUnmount(): void {
    if (this.state.mp3_url) {
      this.close_file();
    }
  }

  get_cache_path(file_path: string, suffix: string): string {
    file_path = fs.realpathSync(file_path);

    if (file_path.startsWith(MP3_BASE_PATH)) {
      file_path = file_path.substr(MP3_BASE_PATH.length)
    }

    return path.join(CACHE_PATH, file_path + suffix);
  }

  safe_tostring = (s: any): string => { return (s ? s.toString() : '') }

  get_scores_wildcard(file_path: string): string {
    return path.join(CACHE_PATH, 'scores', file_path + '-%d.png');
  }


  generate_spectrogram(mp3_path: string): void {
    const load_spectrogram = (): void => {
      console.log('loading spectrogram', spectrum_path);
      const spectrum_sz = image_size(spectrum_path);
      this.setState({mp3_url: 'file://' + mp3_path,
                     spectrum_url: 'file://' + spectrum_path,
                     spectrum_width: spectrum_sz.width,
                     spectrum_height: spectrum_sz.height});
    }

    const spectrum_path = this.get_cache_path(mp3_path, '.cqt.png');

    if (fs.existsSync(spectrum_path)) {
      load_spectrogram();
      return;
    }

    console.log('generating spectrogram for', mp3_path);

    const child = child_process.spawn('python',
                                      ['gen_spectrogram.py', spectrum_path, mp3_path],
                                      {cwd: 'src/python'});
    this.num_processes++;

    child.on('exit', (code: number) => {
      this.num_processes--;

      if (code === 0) {
        load_spectrogram();
      } else {
        console.error('spectrogram generator returned an error', code);
        console.error('stderr');
        console.error(this.safe_tostring(child.stderr.read()));
        console.error('stdout');
        console.error(this.safe_tostring(child.stdout.read()));
      }
    });
  }

  launch_scores_renderer(tab_path: string): void {
    this.scores_wildcard = this.get_scores_wildcard(tab_path);
    console.log('running scores generator for', tab_path, this.scores_wildcard);
    const child = child_process.spawn('python',
                                      ['scores_worker.py', this.scores_wildcard, tab_path],
                                      {cwd: 'src/python'});

    child.on('exit', (code: number) => {
      console.log('scores generator exited');

      if (code !== 0) {
        console.error('score renderer generator returned an error', code);
        console.error('stderr');
        console.error(this.safe_tostring(child.stderr.read()));
        console.error('stdout');
        console.error(this.safe_tostring(child.stdout.read()));
      }
    });

    this.seek_to_measure(1);
  }

  generate_beats(mp3_path: string, handler: (bars: number[]) => any): void {
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
        console.error('stderr');
        console.error(this.safe_tostring(child.stderr.read()));
        console.error('stdout');
        console.error(this.safe_tostring(child.stdout.read()));
      }
    });
  }

  create_new = (): void => {
    this.generate_beats(this.mp3_path, (bars: number[]): void => {
      this.setState(editor.create_file(this.mp3_path, bars));
    });
  }

  open_file(artist: string, song_name: string, mp3_path: string, tab_path: string): void {
    this.mp3_path = mp3_path;
    this.full_scores = tab_path;

    this.generate_spectrogram(mp3_path);
    this.launch_scores_renderer(tab_path);

    if (editor.have_file(mp3_path)) {
      this.setState(editor.open_file(mp3_path));
    } else {
      this.create_new();
    }

    const capitalize = (s: string) => s.substring(0, 1).toUpperCase() + s.substr(1);
    this.setState({artist: capitalize(artist), song_name: capitalize(song_name)});
  }

  close_file = (): void => {
    editor.close_file();
    this.setState({mp3_url: '', spectrum_url: '', bars: []});
  }

  on_loaded_data = (): void => {
    if (this.player.current.audio) {
      const audio = this.player.current.audio.current;
      this.setState({ duration: audio.duration });
    }
  }

  seek(time: number): void {
    if (time >= 0 && time < this.state.duration) {
      this.player.current.audio.current.currentTime = time;
    }
  }

  toggle_playback(): void {
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
        e.stopPropagation();
        this.toggle_playback();
        break;
    }
  }


  add_bar = (): void => {
    if (this.player.current && this.player.current.audio.current) {
      const time = this.player.current.audio.current.currentTime;
      this.setState(editor.add_bar(time));
    }
  }

  remove_bar = (): void => {
    if (this.player.current && this.player.current.audio.current) {
      const time = this.player.current.audio.current.currentTime;
      this.setState(editor.remove_bar(time));
    }
  }

  replace_bar = (bar: number, coord: number, move_all: boolean): void => {
    this.setState(editor.replace_bar(bar, coord, move_all));
  }

  seek_to_measure = (measure: number): void => {
    if (this.cur_measure != measure) {
      this.cur_measure = measure;
      const focus_time = this.state.bars[measure - 1];
      this.setState({ cur_measure: measure, focus_time });
    }
  }

  open_in_musescore = (): void => {
    console.log('trying to open', this.full_scores);

    if (fs.existsSync(this.full_scores)) {
      child_process.spawn('musescore', [this.full_scores]);
    } else {
      const rel_path = this.full_scores.substr(this.full_scores.indexOf('MusicXML'));
      const dst_path = '/tmp/markup_editor/';

      console.log('unzip', '-j', 'data/guitar/musicxml.zip', rel_path, dst_path);
      const child = child_process.spawn('unzip', ['-o', '-j', 'data/guitar/musicxml.zip',
                                                  rel_path, '-d', dst_path]);

      child.on('exit', (code: number) => {
        console.log('unzip exited');

        if (code === 0) {
          const result_path = path.join(dst_path, path.basename(rel_path));
          console.log('trying to open', result_path, fs.existsSync(rel_path));
          child_process.spawn('musescore', [result_path]);
        } else {
          console.error('unzip returned an error', code);
          console.error('stderr');
          console.error(this.safe_tostring(child.stderr.read()));
          console.error('stdout');
          console.error(this.safe_tostring(child.stdout.read()));
          }
        });
    }
  }

  render_title(status: string): React.ReactNode {
    let title = 'Music Markup Editor' + status;
    return (
      <Helmet>
        <title>{title}</title>
      </Helmet>
    );
  }

  render_toolbar(): React.ReactNode {
    return (
      <div>
        <div className="toolbar">
          <Tooltip title="Regenerate default bars">
            <IconButton aria-label="Create file" disableRipple={true} onClick={this.create_new}>
              <NoteAddIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Close file">
            <IconButton aria-label="Close file" disableRipple={true} onClick={this.close_file}>
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </div>
        <div className="toolbar">
          <Tooltip title="Undo">
            <span>
              <IconButton aria-label="Undo" disableRipple={true} disabled={!editor.can_undo()}
                onClick={() => {this.setState(editor.undo())}} >
                <UndoIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Redo">
            <span>
              <IconButton aria-label="Redo" disableRipple={true} disabled={!editor.can_redo()}
                onClick={() => {this.setState(editor.redo())}} >
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
            <IconButton aria-label="Add bar" disableRipple={true} onClick={this.add_bar}>
              <AddIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Remove bar">
            <IconButton aria-label="Remove bar" disableRipple={true} onClick={this.remove_bar}>
              <RemoveIcon />
            </IconButton>
          </Tooltip>
        </div>
        <div className="toolbar">
          <Tooltip title="Open in MuseScore">
            <IconButton aria-label="MuseScore" disableRipple={true}
              onClick={this.open_in_musescore}>
              <OpenInBrowserIcon />
            </IconButton>
          </Tooltip>
        </div>
      </div>
    );
  }

  render_filter_bars_dialog(): React.ReactNode {
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

  render_progress_window(): React.ReactNode {
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

  render_score(): React.ReactNode {
    const image_path = this.scores_wildcard.replace('%d', this.state.cur_measure.toString());

    return (
      <div className="scores">
        <span>{`Measure ${this.state.cur_measure}`}</span><br/>
        {(fs.existsSync(image_path)) ? (<img src={'file://' + image_path} />) : null}
      </div>
    );
  }

  render(): React.ReactNode {
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
          <div className="left-pane">
            <Spectrogram
              spectrum_url={this.state.spectrum_url} bars={this.state.bars}
              duration={this.state.duration} main_window={this}
              audio={this.player.current ? this.player.current.audio.current : null}
              width={this.state.spectrum_width} height={this.state.spectrum_height}
              main_win={this} focus_time={this.state.focus_time} />
            <AudioPlayer
              className="player" autoPlayAfterSrcChange={false}
              src={this.state.mp3_url} ref={this.player}
              onLoadedData={this.on_loaded_data}
              />
          </div>
          {this.render_score()}
          {this.state.show_filter_dialog ? this.render_filter_bars_dialog() : null}
        </div>
      );
    }
  }
}
