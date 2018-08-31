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

const COLORS = ["red", "green", "blue", "yellow"];

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

  toggleColor(room, color) {
    const current = (room.colors || {})[color];
    const { remotely } = this.props;

    remotely({
      rooms: {
        [room.name]: {
          colors: {
            [color]: {
              color,
              active: !current || !current.active
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

    const roomColors = Object.values(room.colors || {}).filter(c => c.active);

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
            .filter(u => u.sid && u.active)
            .map(u => <span key={u.sid}>{u.sid}&nbsp;</span>)}
        </div>

        {roomColors.map(c => (
          <div
            key={c.color}
            style={{
              margin: 10,
              width: roomColors.length < 2 ? "80vh" : "100px",
              height: roomColors.length < 2 ? "80vh" : "100px",
              borderRadius: "100%",
              backgroundColor: c.color
            }}
          />
        ))}

        {COLORS.map(color => (
          <Color
            key={color}
            color={color}
            active={roomColors.map(c => c.color).includes(color)}
            onClick={() => this.toggleColor(room, color)}
          />
        ))}
      </div>
    );
  }
}

const Color = ({ color, active, onClick }) => (
  <span
    style={{
      display: "inline-block",
      backgroundColor: color,
      cursor: "pointer",
      width: 50,
      height: 50,
      marginRight: 20,
      border: !active ? "none" : "solid 5px black"
    }}
    onClick={onClick}
  />
);

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
