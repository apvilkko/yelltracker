import {h} from 'preact';
import {connect} from 'unistore/preact';
import {renderView} from './view';
import FileInput from './FileInput';
import {actions} from './store';

export default connect('currentView,view', actions)(
  ({view, currentView, changeView}) => (
    <div>
      <FileInput />
      <button onClick={() => changeView('orderList')}>orderList</button>
      <button onClick={() => changeView('pattern')}>pattern</button>
      <div className="view">{renderView(currentView, view)}</div>
    </div>
  )
);
