import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import icon from '../assets/icon.svg';
import './app.css';

import MainWindow from 'components/main_window';


export default function App() {
  return (
    <Router>
      <Switch>
        <Route path="/" component={MainWindow} />
      </Switch>
    </Router>
  );
}
