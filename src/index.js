import {h, render} from 'preact';
import {Provider} from 'unistore/preact';
import App from './App';
import store from './store';

render(
  <div id="app">
    <Provider store={store}>
      <App />
    </Provider>
  </div>,
  document.body
);
