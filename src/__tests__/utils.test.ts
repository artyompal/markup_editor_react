import * as utils from '../logic/utils';

describe('utils', () => {
  it('lower_bound should work', () => {
    expect(utils.lower_bound([1,2,3,4,5], 3.5)).toEqual(3);
    expect(utils.lower_bound([1,2,3,4,5], .5)).toEqual(0);
    expect(utils.lower_bound([], .5)).toEqual(0);
    expect(utils.lower_bound([1], .5)).toEqual(0);
  });

  it('find_closest() should work properly', () => {
    expect(utils.find_closest([1,2,3,4,5], 3.3)).toEqual(2);
    expect(utils.find_closest([1,2,3,4,5], 3.6)).toEqual(3);
    expect(utils.find_closest([], .5)).toEqual(undefined);
    expect(utils.find_closest([100500], 333)).toEqual(0);
    expect(utils.find_closest([1,2,3,4,5], -3.3)).toEqual(0);
  });
});
