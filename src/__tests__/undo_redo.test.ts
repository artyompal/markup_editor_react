import '@testing-library/jest-dom';
import * as editor from '../logic/editor';

describe('undo/redo', () => {
  it('should not allow undo/redo for an empty document', () => {
    expect(editor.can_undo()).toBeFalsy();
    expect(editor.can_undo()).toBeFalsy();
  });

  it('undo should work properly', () => {
    let res = editor.create_file('package.json', [1, 2, 3, 4, 5], false);
    expect(res).toStrictEqual({ bars: [1, 2, 3, 4, 5] });

    expect(editor.can_undo()).toBeFalsy();
    expect(editor.can_redo()).toBeFalsy();

    res = editor.filter_bars(1, 2);
    expect(res).toStrictEqual({ bars: [2, 4] });

    expect(editor.can_undo()).toBeTruthy();
    expect(editor.can_redo()).toBeFalsy();

    res = editor.undo();
    expect(res).toStrictEqual({ bars: [1, 2, 3, 4, 5] });

    expect(editor.can_undo()).toBeFalsy();
    expect(editor.can_redo()).toBeTruthy();

    res = editor.redo();
    expect(res).toStrictEqual({ bars: [2, 4] });

    expect(editor.can_undo()).toBeTruthy();
    expect(editor.can_redo()).toBeFalsy();
  });
});
