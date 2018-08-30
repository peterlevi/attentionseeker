import React, { Component } from 'react';
import './App.css';
import io from 'socket.io-client';
import * as R from 'ramda';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      local: {
        input_value: '',
      },
      remote: {
        echo: '',
      }
    }
  }

  componentWillMount() {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const port = !process.env.NODE_ENV || process.env.NODE_ENV === 'development'
      ? 3001
      : window.location.port;
    this.socket = io.connect(protocol + '://' + document.domain + ':' + port, {
      transports: ['websocket'],
    });
    this.socket.on('full_state', this.onFullState);
    this.socket.on('merge_state', this.onMergeState);
  }

  onFullState = full_state => {
    console.log('full_state', full_state);
    this.setState({
      remote: full_state,
      local: {
        input_value: full_state.echo,
      }
    });
  };

  onMergeState = patch => {
    console.log('Merging remote patch: ', patch);
    this.setState({
      remote: R.mergeDeepRight(this.state.remote, patch)
    });
  };

  applyRemotePatch = (patch) => {
    this.setState({
      remote: R.mergeDeepRight(this.state.remote, patch)
    });
    console.log('Sending remote patch: ', patch);
    this.socket.emit('merge_state', patch);
  };

  applyLocalPatch = (patch) => {
    console.log('Applying local patch: ', patch);
    this.setState({
      local: R.mergeDeepRight(this.state.local, patch)
    });
  };

  onSend = () => {
    this.applyRemotePatch({
      echo: this.state.local.input_value
    });
  };

  render() {
    return (
      <div>
        <div className="input">
          <form>
            <textarea
              cols={80}
              rows={5}
              placeholder="Send a message to the server..."
              value={this.state.local.input_value}
              onChange={e => this.applyLocalPatch({
                input_value: e.target.value
              })}
            />
            <br/>
            <button type="button" onClick={this.onSend}>Send</button>
          </form>
        </div>
        <pre id="response">
          {this.state.remote.echo}
        </pre>
      </div>
    );
  }
}

export default App;
