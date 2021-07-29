import fs from 'fs';
import path from 'path';

import {MP3_BASE_PATH, RESULTS_PATH} from '../logic/settings';


const VERSION = 1;

interface DocumentState {
  bars: number[];
}

let history: DocumentState[] = [];
// let history_step = 0;

let document_state: DocumentState = { bars: [] };
let document_path = '';


function get_document_path(file_path: string, suffix: string): string {
  file_path = fs.realpathSync(file_path);

  if (file_path.startsWith(MP3_BASE_PATH)) {
    file_path = file_path.substr(MP3_BASE_PATH.length)
  }

  return path.join(RESULTS_PATH, file_path + suffix);
}


export function have_file(mp3_path: string): boolean {
  return fs.existsSync(get_document_path(mp3_path, '.markup.json'));
}

export function create_file(mp3_path: string, bars: number[]): DocumentState {
  document_path = get_document_path(mp3_path, '.markup.json');
  document_state.bars = bars;
  history = [];
  return document_state;
}

export function open_file(mp3_path: string): DocumentState {
  document_path = get_document_path(mp3_path, '.markup.json');
  const json = JSON.parse(fs.readFileSync(document_path).toString());
  document_state.bars = json.bars;
  history = [];
  return document_state;
}

function save_file() {
  const data = { version: VERSION, bars: document_state.bars };
  fs.writeFileSync(document_path, JSON.stringify(data));
}

export function close_file() {
  save_file();
  history = [];
  document_state.bars = [];
}


export function can_undo(): boolean {
  return history.length != 0;
}

export function can_redo(): boolean {
  return history.length != 0;
}

export function undo() {
}

export function redo() {
}


export function filter_bars(start: number, divider: number): DocumentState {
  let res = [];

  for (let idx = start; idx < document_state.bars.length; idx += divider) {
    res.push(document_state.bars[idx]);
  }

  history.push(document_state);
  document_state.bars = res;
  return document_state;
}

export function add_bar() {
}

export function remove_bar() {
}
