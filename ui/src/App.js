import React, { Component } from 'react';
import './App.css';
import io from 'socket.io';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: '',
      echo: '',
    }
  }

  componentWillMount() {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    this.socket = io.connect(protocol + '://' + document.domain + ':' + window.location.port, {
      transports: ['websocket'],
    });
    this.socket.on('echo', this.onEcho);
  }

  onEcho = (data) => {
    this.setState({echo: data.echo});
  };

  send = () => {
    this.socket.emit('send_message', {message: this.state.value});
  };

  render() {
    return (
      <div>
        <div className="input">
          <form>
            <textarea
              placeholder="Send a message to the server..."
              value={this.state.value}
              onChange={e => this.setState({value: e.target.value})}
            />
            <button type="button" onClick={this.send}>Send</button>
          </form>
        </div>
        <p id="response">
          {this.state.echo}
        </p>
      </div>
    );
  }
}

export default App;
