import {h, render} from 'preact';
import {Provider} from 'unistore/preact';
import App from './App';
import store from './store';

const mountNode = document.getElementById('root');

render(
  <div id="app">
    <Provider store={store}>
      <App />
    </Provider>
  </div>,
  mountNode,
  mountNode.lastChild
);
