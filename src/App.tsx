import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import icon from '../assets/icon.svg';
import './App.css';

import { MainWindow } from 'components/MainWindow';

const Application = () => {
  return (
    <div className="Application">
      <MainWindow/>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <Switch>
        <Route path="/" component={Application} />
      </Switch>
    </Router>
  );
}
