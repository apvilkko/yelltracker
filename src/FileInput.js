import {h, Component} from 'preact';
import {connect} from 'unistore/preact';
import {actions} from './store';

class FileInput extends Component {
  handleChange = evt => {
    const loadModule = this.props.loadModule;
    const files = evt.target.files;
    const filename = evt.target.value;
    const reader = new window.FileReader();
    reader.onload = function () {
      const arrayBuffer = this.result;
      const array = new Uint8Array(arrayBuffer);
      loadModule(array, filename);
    };
    reader.readAsArrayBuffer(files[0]);
  };

  render () {
    return <input type="file" accept=".s3m" onChange={this.handleChange} />;
  }
}

export default connect(null, actions)(FileInput);
