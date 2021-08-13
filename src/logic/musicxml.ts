import * as utils from './utils';


const logical_measures: number[] = [];

export function parse_scores(tab_path: string): void {
  const parser = new DOMParser();
  const dom = parser.parseFromString(utils.read_from_disk_or_archive(tab_path), "application/xml");

  const part = dom.getElementsByTagName('part')[0];
  let last_repeat: number = 0;
  let last_ending: number = 0;
  let logical_idx: number = 0;

  // @ts-ignore
  for (const measure of part.getElementsByTagName('measure')) {
    logical_idx += 1;

    const measure_idx = parseInt(measure.attributes['number'].value);
    logical_measures[logical_idx] = measure_idx;

    const barlines = measure.getElementsByTagName('barline');

    if (barlines.length) {
      const repeats = measure.getElementsByTagName('repeat');
      if (repeats.length) {
        const repeat_dir = repeats[0].attributes['direction'].value;

        if (repeat_dir === 'forward') {
          last_repeat = measure_idx;
        } else if (repeat_dir === 'backward') {
          // unroll repeated measures
          if (last_repeat < last_ending) {
            for (let idx = last_repeat; idx < last_ending; idx += 1) {
              logical_idx += 1;
              logical_measures[logical_idx] = idx;
            }
          }
        }
      }

      const endings = measure.getElementsByTagName('ending');
      if (endings.length) {
        const ending_type = endings[0].attributes['type'].value;

        if (ending_type == 'start') {
          last_ending = measure_idx;
        }
      }
    }
  }
}

export function logical_measure_idx_to_real(logical_idx: number): number {
  const res = logical_measures[logical_idx];
  return (res !== undefined) ? res : 0;
}
