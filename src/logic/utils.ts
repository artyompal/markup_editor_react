import child_process from 'child_process';
import fs from 'fs';
import path from 'path';


// Returns index of the first index that is greater than or equal to the given number,
// or arr.length if there's no such index.
// Expects sorted array.
export function lower_bound(arr: number[], val: number): number {
  let low = 0, high = arr.length;
  let count = high - low;

  while (count > 0) {
    let step = count >>> 2;
    var mid = low + step;

    if (arr[mid] < val) {
      low = mid + 1;
      count -= step + 1;
    } else {
      count = step;
    }
  }

  return low;
};

// Returns index of the closest element to the given number, by absolute value;
// returns undefined for empty arrays.
// Expects sorted array.
export function find_closest(arr: number[], val: number): number | undefined {
  const idx = lower_bound(arr, val);

  if (arr.length === 0) {
    return undefined;
  } else if (idx == arr.length) {
    return idx - 1;
  } else if (idx == 0) {
    return idx;
  } else {
    return (val - arr[idx - 1] < arr[idx] - val) ? idx - 1 : idx;
  }
}

export function event2time(holder: any, e: any, logical_width: number, duration: number): number {
  const rect = holder.current.getBoundingClientRect();
  return (holder.current.scrollLeft + e.clientX - rect.left) / logical_width * duration;
}

export function coord2time(holder: any, coord: number, logical_width: number,
                           duration: number): number {
  return (holder.current.scrollLeft + coord) / logical_width * duration;
}


export function safe_tostring(s: any): string {
  return (s ? s.toString() : '')
}

export function read_from_disk_or_archive(filename: string): string {
  if (fs.existsSync(filename)) {
    return fs.readFileSync(filename).toString();
  }

  const rel_path = filename.substr(filename.indexOf('MusicXML'));
  filename = path.join('/tmp', rel_path);

  try {
    fs.unlinkSync(filename);
  } catch (e) {
  }

  const child = child_process.spawnSync('unzip',
                                        ['data/guitar/musicxml.zip', rel_path, '-d', '/tmp']);

  if (child.status !== 0) {
    console.error('unzip returned an error');
    console.error('stderr');
    console.error(child.stderr.toString());
    console.error('stdout');
    console.error(child.stdout.toString());
  }

  return fs.readFileSync(filename).toString();
}
