import React, { Component } from "react";
import { Route, BrowserRouter, Link, withRouter } from "react-router-dom";
import { Store, Consumer } from "./Store";
import * as R from "ramda";

import "./App.css";

class Lobby extends Component {
  state = {
    roomInput: ""
  };

  render() {
    return (
      <Consumer>
        {({ state }) => (
          <div className="Lobby">
            <div>Join new room:</div>
            <input
              value={this.state.roomInput}
              onChange={e =>
                this.setState({
                  roomInput: e.target.value.replace(/[^\d\w_\-]+/g, "")
                })
              }
              onKeyPress={e => {
                if (e.key === "Enter") {
                  this.props.history.push(`/${this.state.roomInput}`);
                  e.preventDefault();
                }
              }}
            />
            <div className="Rooms">
              {Object.values(state.remote.rooms).map(room => (
                <Link to={`/${room.name}`}>{room.name}</Link>
              ))}
            </div>
          </div>
        )}
      </Consumer>
    );
  }
}

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
      >
        <BrowserRouter>
          <Route exact path="/" component={withRouter(Lobby)} />
        </BrowserRouter>
      </Store>
    );
  }
}
