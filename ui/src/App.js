import React, { Component } from "react";
import {
  BrowserRouter,
  Switch,
  Route,
  Link,
  withRouter
} from "react-router-dom";
import { Store, withState } from "./Store";
// import * as R from "ramda";

import "./App.css";

export class App extends Component {
  render() {
    return (
      <Store
        initialState={{
          local: {
            room: null
          },
          remote: {
            rooms: {}
          }
        }}
        loadingComponent={<div style={{ padding: 20 }}>Loading...</div>}
      >
        <BrowserRouter>
          <Switch>
            <Route exact path="/" component={withRouter(withState(Lobby))} />
            <Route path="/:roomName" component={withRouter(withState(Room))} />
          </Switch>
        </BrowserRouter>
      </Store>
    );
  }
}

class Lobby extends Component {
  state = {
    roomInput: ""
  };

  render() {
    const { state } = this.props;

    return (
      <div className="Lobby" style={{ padding: 20 }}>
        <ConnectionIndicator connected={state.connection.connected} />
        <div>New room:</div>
        <input
          value={state.roomInput}
          onChange={e =>
            this.setState({
              roomInput: e.target.value.replace(/[^\d\w_-]+/g, "")
            })
          }
          onKeyPress={e => {
            if (e.key === "Enter") {
              this.props.history.push(`/${this.state.roomInput}`);
              e.preventDefault();
            }
          }}
        />
        <div className="Rooms" style={{ marginTop: 20 }}>
          {Object.values(state.remote.rooms).map(room => (
            <div key={room.name}>
              <Link to={`/${room.name}`}>#{room.name}</Link>
            </div>
          ))}
        </div>
      </div>
    );
  }
}

class Room extends Component {
  state = {};

  componentDidMount() {
    const { state, remotely, match } = this.props;
    const name = match.params.roomName;

    remotely({
      rooms: {
        [name]: {
          name: name,
          users: {
            [state.local.sid]: {
              sid: state.local.sid,
              joined: Date.now(),
              active: true
            }
          }
        }
      }
    });
  }

  componentWillUnmount() {
    const { state, remotely, match } = this.props;
    const name = match.params.roomName;

    remotely({
      rooms: {
        [name]: {
          users: {
            [state.local.sid]: {
              active: false
            }
          }
        }
      }
    });
  }

  render() {
    const { state, match } = this.props;
    const name = match.params.roomName;
    const room = state.remote.rooms[name];
    if (!room) {
      return <div>Please wait...</div>;
    }

    return (
      <div className="Room" style={{ padding: 20 }}>
        <div>
          #{room.name}
          <div style={{ float: "right" }}>
            <Link to={"/"}>Lobby</Link>
            <ConnectionIndicator connected={state.connection.connected} />
          </div>
        </div>
        <div style={{ display: "none" }}>
          Users here:
          {Object.values(room.users)
            .filter(u => u.active)
            .map(u => <span key={u.sid}>{u.sid}&nbsp;</span>)}
        </div>
      </div>
    );
  }
}

const ConnectionIndicator = ({ connected }) => (
  <div
    className="ConnectionIndicator"
    style={{
      position: "absolute",
      top: 5,
      right: 5,
      width: 10,
      height: 10,
      backgroundColor: connected ? "green" : "red",
      borderRadius: 10
    }}
  />
);
