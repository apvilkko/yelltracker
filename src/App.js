import {h} from 'preact';
import {connect} from 'unistore/preact';
import {renderView} from './view';
import FileInput from './FileInput';
import {actions} from './store';

const DebugPane = connect(null, actions)(
  ({changeView, playSample, play, stop}) => (
    <div className="debug-pane">
      <FileInput />
      <button onClick={() => changeView('orderList')}>orderList</button>
      <button onClick={() => changeView('pattern')}>pattern</button>{' '}
      <button onClick={() => play()}>play</button>
      <button onClick={() => stop()}>stop</button>{' '}
      <button onClick={() => playSample(0)}>smp0</button>
      <button onClick={() => playSample(1)}>smp1</button>
    </div>
  )
);

export default connect('currentView,view', actions)(({view, currentView}) => (
  <div>
    <DebugPane />
    <div className="view">{renderView(currentView, view)}</div>
  </div>
));
