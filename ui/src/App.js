import React, { Component } from 'react';
import './App.css';
import io from 'socket.io-client';

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
    const port = !process.env.NODE_ENV || process.env.NODE_ENV === 'development'
      ? 3001
      : window.location.port;
    this.socket = io.connect(protocol + '://' + document.domain + ':' + port, {
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
              cols={80}
              rows={5}
              placeholder="Send a message to the server..."
              value={this.state.value}
              onChange={e => this.setState({value: e.target.value})}
            />
            <br/>
            <button type="button" onClick={this.send}>Send</button>
          </form>
        </div>
        <pre id="response">
          {this.state.echo}
        </pre>
      </div>
    );
  }
}

export default App;
