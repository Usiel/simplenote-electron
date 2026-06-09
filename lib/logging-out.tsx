import React, { Component } from 'react';
import { createRoot } from 'react-dom/client';

import '../scss/style.scss';

class LoggingOut extends Component {
  systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';

  componentDidMount() {
    document.body.dataset.theme = this.systemTheme;
  }

  render() {
    return (
      <div className="app">
        <div
          style={{
            fontSize: '18px',
            alignSelf: 'center',
            margin: '0 auto',
          }}
        >
          Logging out…
        </div>
      </div>
    );
  }
}

export const boot = () => {
  const root = createRoot(document.getElementById('root')!);
  root.render(<LoggingOut />);
};
