import createStore from 'unistore';
import {createCharView, setupView, setModData} from './view';
import loadS3m from './load-s3m';

const store = createStore({
  currentView: 'pattern',
});

store.subscribe(console.log);
store.setState({view: setupView(createCharView())});

export const actions = store => ({
  changeView: (state, nextView) =>
    Object.assign({}, state, {
      currentView: nextView,
    }),
  loadModule: (state, data, filename) => {
    const mod = loadS3m(data);
    mod.filename = filename.replace(/(.+)[\\/](.+)/, '$2');
    const view = setModData(state.view)(mod);
    return Object.assign({}, state, {mod, view: Object.assign({}, view)});
  },
});

export default store;
