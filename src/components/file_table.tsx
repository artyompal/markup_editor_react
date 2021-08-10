import fs from 'fs';
import path from 'path';
import React from 'react';

import * as settings from '../logic/settings';
import {save_songs_table} from '../logic/editor';

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
  constructor(props: FileTableProps) {
    super(props);

    const content = fs.readFileSync(path.join(settings.RESULTS_PATH, 'scores_database.json'));
    const songs = JSON.parse(content.toString());
    save_songs_table(songs);
    this.state = {songs: songs};
  }

  on_double_click(idx: number, e: React.SyntheticEvent) {
    e.preventDefault();

    this.props.main_window.open_file(
      this.state.songs[idx].tags[0],
      this.state.songs[idx].tags[1],
      this.state.songs[idx].mp3,
      this.state.songs[idx].tab);
  }

  render(): React.ReactNode {
    return (
      <div className="file-table-outer">
        <div className="file-table-inner">
          <table>
            <thead><tr><td>Author</td><td>Song</td><td>MP3</td><td>Score</td></tr></thead>
            <tbody>
              {this.state.songs.map((item, idx) => (
                <tr key={idx} onDoubleClick={(e) => this.on_double_click(idx, e)}>
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
