import '@testing-library/jest-dom';
import * as editor from '../logic/editor';

describe('undo/redo', () => {
  it('should not allow undo/redo for an empty document', () => {
    expect(editor.can_undo()).toBeFalsy();
    expect(editor.can_undo()).toBeFalsy();
  });

  it('undo should work properly', () => {
    editor.save_songs_table([{ mp3: 'some_song.mp3', tags: ['some', 'song'] }]);

    let res = editor.create_file('some_song.mp3', [1, 2, 3, 4, 5], false);
    expect(res).toStrictEqual({ bars: [1, 2, 3, 4, 5], final: false, start_offset: 0 });

    expect(editor.can_undo()).toBeFalsy();
    expect(editor.can_redo()).toBeFalsy();

    res = editor.filter_bars(1, 2);
    expect(res).toStrictEqual({ bars: [2, 4], final: false, start_offset: 0 });

    expect(editor.can_undo()).toBeTruthy();
    expect(editor.can_redo()).toBeFalsy();

    res = editor.undo();
    expect(res).toStrictEqual({ bars: [1, 2, 3, 4, 5], final: false, start_offset: 0 });

    expect(editor.can_undo()).toBeFalsy();
    expect(editor.can_redo()).toBeTruthy();

    res = editor.redo();
    expect(res).toStrictEqual({ bars: [2, 4], final: false, start_offset: 0 });

    expect(editor.can_undo()).toBeTruthy();
    expect(editor.can_redo()).toBeFalsy();
  });
});
