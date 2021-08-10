import fs from 'fs';
import path from 'path';

import * as utils from './utils';
import * as settings from '../logic/settings';


const VERSION = 2;
const AUTOSAVE_TIMEOUT = 5000;
const EXTENSION = '.markup.json'

interface DocumentState {
  bars: number[];
  final: boolean;
  start_offset: number;
}

let history: Readonly<DocumentState>[] = [];
let history_step = 0;

const DEFAULT_STATE: Readonly<DocumentState> = {
  bars: [],
  final: false,
  start_offset: 0
};

let document_state: Readonly<DocumentState> = Object.assign({}, DEFAULT_STATE);
let document_path = '';

let autosave_timeout_id: number | undefined;

let mp3_to_tags: Map<string, string> = new Map();


function get_document_path(mp3_path: string): string {
  if (!mp3_to_tags.has(mp3_path)) {
    console.error(mp3_path, 'not found');
    throw new Error(mp3_path);
  }

  return path.join(settings.RESULTS_PATH, mp3_to_tags.get(mp3_path) + EXTENSION);
}

export function save_songs_table(table: any) {
  for (const song of table) {
    mp3_to_tags.set(song.mp3, song.tags[0] + ' - ' + song.tags[1]);
  }
}

export function have_file(mp3_path: string): boolean {
  return fs.existsSync(get_document_path(mp3_path));
}

export function create_file(mp3_path: string, bars: number[],
                            autosave: boolean = true): DocumentState {
  document_path = get_document_path(mp3_path);
  document_state = { ...DEFAULT_STATE, bars };
  history_reset();

  if (autosave) {
    save_file();
  }

  return document_state;
}

export function open_file(mp3_path: string): DocumentState {
  document_path = get_document_path(mp3_path);
  const json = JSON.parse(fs.readFileSync(document_path).toString());

  if (json.version < 2) {
    document_state = { ...DEFAULT_STATE, bars: json.bars };
  } else {
    document_state = json.data;
  }

  history_reset();
  save_file();
  return document_state;
}

function save_file(): void {
  const dir_path = path.dirname(document_path);
  const json = {version: VERSION, data: document_state};

  if (!fs.existsSync(dir_path)) {
    fs.mkdirSync(dir_path, {recursive: true});
  }

  fs.writeFileSync(document_path, JSON.stringify(json, null, 2));

  if (autosave_timeout_id !== undefined) {
    window.clearTimeout(autosave_timeout_id);
  }

  autosave_timeout_id = window.setTimeout(save_file, AUTOSAVE_TIMEOUT);
}

export function close_file(): void {
  save_file();
  window.clearTimeout(autosave_timeout_id);
  history = [];
  document_state = Object.assign({}, DEFAULT_STATE);
}


function history_reset(): void {
  history.length = 0;
  history.push(document_state);
  history_step = 0;
}

function history_push(new_state: object): DocumentState {
  document_state = {...document_state, ...new_state};
  history.length = history_step + 1;
  history.push(document_state);
  history_step += 1;
  return document_state;
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

  return history_push({ bars });
}

export function add_bar(time: number): DocumentState {
  let bars = document_state.bars;
  const location = utils.lower_bound(bars, time);

  if (bars[location] == time) {
    return document_state;
  }

  bars = [...bars.slice(0, location), time, ...bars.slice(location)];
  return history_push({ bars });
}

export function remove_bar(time: number): DocumentState {
  let bars = document_state.bars;
  const location = utils.find_closest(bars, time);

  if (location === undefined) {
    return document_state;
  }

  bars = [...bars.slice(0, location), ...bars.slice(location + 1)];
  return history_push({ bars });
}

export function replace_bar(location: number, time: number, move_all: boolean): DocumentState {
  let bars = document_state.bars;
  let modify = (x: number): number => { return (move_all) ? time - bars[location] + x : x; };
  bars = [...bars.slice(0, location), time, ...bars.slice(location + 1).map(modify)]
  bars.sort((a, b) => a - b);
  return history_push({ bars });
}

export function set_start_offset(start_offset: number): DocumentState {
  return history_push({ start_offset });
}

export function make_final(final: boolean): DocumentState {
  return history_push({ final });
}

export function is_final(mp3_path: string): boolean {
  const doc = JSON.parse(fs.readFileSync(get_document_path(mp3_path)).toString());
  return (doc.version >= 2) ? doc.data.final : false;
}
