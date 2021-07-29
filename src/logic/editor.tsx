import fs from 'fs';
import path from 'path';

import {MP3_BASE_PATH, RESULTS_PATH} from '../logic/settings';

let history = [];
let file = {};


function get_result_path(file_path: string, suffix: string): string {
  file_path = fs.realpathSync(file_path);

  if (file_path.startsWith(MP3_BASE_PATH)) {
    file_path = file_path.substr(MP3_BASE_PATH.length)
  }

  return path.join(RESULTS_PATH, file_path + suffix);
}


export function have_file(mp3_path: string): boolean {
  return fs.existsSync(get_result_path(mp3_path, '.markup.json'));
}

export function create_file(mp3_path: string) {
}

export function open_file(mp3_path: string) {
}

export function save_file() {
}

export function close_file() {
}


export function undo() {
}

export function redo() {
}


export function filter_bars(start: number, divider: number) {
}

export function add_bar() {
}

export function remove_bar() {
}
