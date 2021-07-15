import React from 'react';

import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css'

export class MainWindow extends React.Component {
  render() {
    return (
      <div>
        <div className="Application">
          <AudioPlayer style={styles.player}/>
        </div>
      </div>
    );
  }
}

const styles = {
  player: {
    width: '1000px',
    allgn: 'center',
  }
}
