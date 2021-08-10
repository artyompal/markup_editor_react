import fs from 'fs';
import path from 'path';
import React from 'react';

import CheckBoxIcon from '@material-ui/icons/CheckBox';
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';

import * as settings from '../logic/settings';
import * as editor from '../logic/editor';

interface FileTableProps {
  main_window: any;
}

interface SongInfo {
  tags: string[];
  mp3: string;
  tab: string;
}

interface FileTableState {
  songs: SongInfo[];
}

export default class FileTable extends React.Component<FileTableProps, FileTableState> {
  final_status: Map<string, boolean> = new Map();

  constructor(props: FileTableProps) {
    super(props);

    const content = fs.readFileSync(path.join(settings.RESULTS_PATH, 'scores_database.json'));
    const songs = JSON.parse(content.toString());
    editor.save_songs_table(songs);
    this.state = {songs: songs};
    this.refresh_final_status();
  }

  refresh_final_status(): void {
    for (const song of this.state.songs) {
      if (editor.have_file(song.mp3)) {
        this.final_status.set(song.mp3, editor.is_final(song.mp3));
      }
    }
  }

  on_double_click(idx: number, e: React.SyntheticEvent) {
    e.preventDefault();

    this.props.main_window.open_file(
      this.state.songs[idx].tags[0],
      this.state.songs[idx].tags[1],
      this.state.songs[idx].mp3,
      this.state.songs[idx].tab);
  }

  render_status(mp3_path: string): React.ReactNode {
    if (!this.final_status.has(mp3_path)) {
      return null;
    } else if (this.final_status.get(mp3_path)) {
      return (<CheckBoxIcon className="file-icon" />);
    } else {
      return (<CheckBoxOutlineBlankIcon className="file-icon" />);
    }
  }

  render(): React.ReactNode {
    this.refresh_final_status();
    return (
      <div className="file-table-outer">
        <div className="file-table-inner">
          <table>
            <thead><tr>
              <td>Final</td>
              <td>Author</td>
              <td>Song</td>
              <td>MP3</td>
              <td>Score</td>
            </tr></thead>
            <tbody>
              {this.state.songs.map((item, idx) => (
                <tr key={idx} onDoubleClick={(e) => this.on_double_click(idx, e)}>
                  <td>{this.render_status(item.mp3)}</td>
                  <td>{item.tags[0]}</td>
                  <td>{item.tags[1]}</td>
                  <td>{item.mp3}</td>
                  <td>{item.tab}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}
