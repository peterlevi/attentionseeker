import React, { Component } from "react";
import {
  BrowserRouter,
  Switch,
  Route,
  Link,
  withRouter
} from "react-router-dom";
import { Store, withState } from "./Store";
import * as R from "ramda";

import "./Bar.css";
import "./App.css";

const COLORS = ["red", "orange", "yellow", "green", "blue"];

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
            [state.connection.sid]: {
              sid: state.connection.sid,
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

  clearAll(room) {
    const { remotely } = this.props;
    const colors = R.map(c => ({ ...c, active: false }), room.colors || {});

    remotely({
      rooms: {
        [room.name]: { colors }
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

    const roomColors = R.sortBy(c => COLORS.indexOf(c.color))(
      Object.values(room.colors || {}).filter(c => c.active)
    );

    return (
      <div
        className="Room"
        style={{ display: "flex", flexDirection: "column" }}
      >
        <div
          className="Header Bar"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 40,
            padding: "0 20px",
            backgroundColor: "#eee",
            textAlign: "center"
          }}
        >
          <span className="RoomName Center">#{room.name}</span>

          <Link to="/" style={{ marginRight: 20 }} className="Left">
            Back to Lobby
          </Link>

          <span className="Right">
            <ConnectionIndicator connected={state.connection.connected} />
          </span>
        </div>

        <div className="Content" style={{ padding: 20, marginTop: 40 }}>
          <div>
            Joined users:&nbsp;{
              Object.values(room.users).filter(u => u.sid && u.active).length
            }
          </div>

          <div style={{ marginTop: 20, marginBottom: 20 }}>
            {COLORS.map(color => (
              <Color
                key={color}
                color={color}
                active={roomColors.map(c => c.color).includes(color)}
                onClick={() => this.toggleColor(room, color)}
              />
            ))}

            <a
              href="#clear-all"
              onClick={e => {
                e.preventDefault();
                this.clearAll(room);
              }}
            >
              Clear all
            </a>
          </div>

          <div style={{ flex: "auto" }}>
            {roomColors.length >= 2 &&
              roomColors.map(c => (
                <span
                  key={c.color}
                  style={{
                    margin: 10,
                    width: 250,
                    height: 250,
                    display: "inline-block",
                    borderRadius: "100%",
                    backgroundColor: c.color,
                    cursor: "pointer"
                  }}
                  onClick={() => this.toggleColor(room, c.color)}
                />
              ))}

            {roomColors.length === 1 &&
              roomColors.map(c => (
                <span
                  key={c.color}
                  style={{
                    margin: 10,
                    width: "80vh",
                    height: "80vh",
                    display: "inline-block",
                    borderRadius: "100%",
                    backgroundColor: c.color,
                    cursor: "pointer"
                  }}
                  onClick={() => this.toggleColor(room, c.color)}
                />
              ))}
          </div>
        </div>
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
      outline: !active ? "none" : "solid 5px black"
    }}
    onClick={onClick}
  />
);

const ConnectionIndicator = ({ connected }) => (
  <span
    className="ConnectionIndicator"
    style={{
      display: "inline-block",
      width: 10,
      height: 10,
      backgroundColor: connected ? "green" : "red",
      borderRadius: 10
    }}
  />
);
