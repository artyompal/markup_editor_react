import fs from 'fs';
import React from 'react';

import {CACHE_PATH} from 'settings/constants';


export default class FileTable extends React.Component {
  constructor(props) {
    super(props);

    const songs = JSON.parse(fs.readFileSync(CACHE_PATH + 'mp3_to_tab2'));
    this.state = {songs: songs};
  }

  on_double_click(idx, e) {
    e.preventDefault();
    this.props.main_window.open_audio(this.state.songs[idx]['mp3']);
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
                  <td>{item['tags'][0]}</td>
                  <td>{item['tags'][1]}</td>
                  <td>{item['mp3']}</td>
                  <td>{item['tab']}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
}
