import fs from 'fs';
import path from 'path';

import * as utils from './utils';

import {MP3_BASE_PATH, RESULTS_PATH} from '../logic/settings';


const VERSION = 1;

interface DocumentState {
  bars: number[];
}

let history: Readonly<DocumentState>[] = [];
let history_step = 0;

let document_state: Readonly<DocumentState> = { bars: [] };
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
  document_state = { bars };
  history_reset();
  return document_state;
}

export function open_file(mp3_path: string): DocumentState {
  document_path = get_document_path(mp3_path, '.markup.json');
  const json = JSON.parse(fs.readFileSync(document_path).toString());
  document_state = { bars: json.bars };
  history_reset();
  return document_state;
}

function save_file(): void {
  const data = { version: VERSION, bars: document_state.bars };
  fs.writeFileSync(document_path, JSON.stringify(data));
}

export function close_file(): void {
  save_file();
  history = [];
  document_state = { bars: [] };
}


function history_reset(): void {
  history.length = 0;
  history.push(document_state);
  history_step = 0;
}

function history_push(new_state: DocumentState): void {
  document_state = new_state;
  history.length = history_step + 1;
  history.push(document_state);
  history_step += 1;
}

export function can_undo(): boolean {
  return history_step > 0; // && history.length > 1;
}

export function can_redo(): boolean {
  return history_step < history.length - 1;
}

export function undo(): DocumentState {
  if (can_undo()) {
    history_step -= 1;
    document_state = history[history_step];
  }

  return document_state;
}

export function redo(): DocumentState {
  if (can_redo()) {
    history_step += 1;
    document_state = history[history_step];
  }

  return document_state;
}


export function filter_bars(start: number, divider: number): DocumentState {
  let bars = [];

  for (let idx = start; idx < document_state.bars.length; idx += divider) {
    bars.push(document_state.bars[idx]);
  }

  history_push({ bars });
  return document_state;
}

export function add_bar(time: number): DocumentState {
  let bars = document_state.bars;
  const location = utils.lower_bound(bars, time);
  bars = [...bars.slice(0, location), time, ...bars.slice(location)];

  history_push({ bars });
  return document_state;
}

export function remove_bar() {
}
