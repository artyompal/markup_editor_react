import '@testing-library/jest-dom';
import * as musicxml from '../logic/musicxml';

describe('musicxml', () => {
  it('logical measure mapping should work properly', () => {
    musicxml.parse_scores('src/__tests__/repeats.xml')

    const answers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 5, 6, 9, 10, 11, 12];
    answers.forEach((val, idx) => {
      const res = musicxml.logical_measure_idx_to_real(idx);
      expect(res).toEqual(val);
    });
  });
});
