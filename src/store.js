import createStore from 'unistore';
import {createCharView, setupView, setModData} from './view';
import loadS3m from './load-s3m';
import {operations, tick} from './player';
import startTick from './worker';

const bindOperations = (obj, operations) => {
  Object.keys(operations).forEach(key => {
    obj[key] = (...rest) => operations[key](obj, ...rest);
  });
};

const runtime = {};
bindOperations(runtime, operations);
runtime.setupAudio();
startTick(runtime, tick);

const store = createStore({
  currentView: 'pattern',
});

store.subscribe(console.log);
store.setState({view: setupView(createCharView())});

export const actions = store => ({
  play: () => {
    runtime.play();
  },
  stop: () => {
    runtime.stop();
  },
  playSample: (state, index) => {
    runtime.playSample(index);
    return Object.assign({}, state, {
      playing: index,
    });
  },
  changeView: (state, nextView) =>
    Object.assign({}, state, {
      currentView: nextView,
    }),
  loadModule: (state, data, filename) => {
    const mod = loadS3m(data);
    mod.filename = filename.replace(/(.+)[\\/](.+)/, '$2');
    runtime.mod = mod;
    runtime.setupBuffers();
    runtime.setupSequencer();
    const view = setModData(state.view)(mod);
    return Object.assign({}, state, {mod, view: Object.assign({}, view)});
  },
});

export default store;
