
let history = [];
let file = {};


function get_result_path(file_path: string, suffix: string): string {
  file_path = fs.realpathSync(file_path);

  if (file_path.startsWith(MP3_BASE_PATH)) {
    file_path = file_path.substr(MP3_BASE_PATH.length)
  }

  return path.join(CACHE_PATH, file_path + suffix);
}

export function have_file() {
}

export function create_file() {
}

export function open_file() {
}

export function save_file() {
}

export function close_file() {
}


export function undo() {
}

export function redo() {
}


export function filter_bars(start: int, divider: int) {
}

export function add_bar() {
}

export function remove_bar() {
}
