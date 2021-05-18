import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import Player from './player';

function App() {
  return (
    <div id="app" style={{ height: '100%' }}>
      <Player />
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
