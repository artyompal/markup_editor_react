import fs from 'fs';
import path from 'path';
import React from 'react';

import {CACHE_PATH} from 'logic/settings';


export default class FileTable extends React.Component {
  constructor(props) {
    super(props);

    const songs = JSON.parse(fs.readFileSync(path.join(CACHE_PATH, 'scores_database.json')));
    this.state = {songs: songs};
  }

  on_double_click(idx, e) {
    e.preventDefault();

    // Prevent Chrome drag selection bug
    const windowSelection: Selection | null = window.getSelection()
    if (windowSelection && windowSelection.type === 'Range') {
      windowSelection.empty()
    }

    this.props.main_window.open_file(
      this.state.songs[idx].tags[0],
      this.state.songs[idx].tags[1],
      this.state.songs[idx].mp3,
      this.state.songs[idx].tab);
  }

  render() {
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
