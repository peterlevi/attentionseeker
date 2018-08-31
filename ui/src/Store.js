import React, { Component, createContext } from "react";
import io from "socket.io-client";
import * as R from "ramda";

// Initialize a context
const Context = createContext();
const { Provider } = Context;
export const { Consumer } = Context;

export class Store extends Component {
  constructor(props) {
    super(props);

    this.state = {
      connection: {
        connected: false,
        dataLoaded: false,
        sid: null
      },
      local: (props.initialState || {}).local || {},
      remote: (props.initialState || {}).remote || {}
    };

    // expose globally for debugging
    window.store = this;

    this.initSocket();
  }

  initSocket = () => {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const port =
      !process.env.NODE_ENV || process.env.NODE_ENV === "development"
        ? 3001
        : window.location.port;

    this.socket = io.connect(protocol + "://" + document.domain + ":" + port, {
      transports: ["websocket"]
    });

    this.socket.on("connect", () => {
      console.log("connected");
      this.updateConnection({
        connected: true,
        sid: this.socket.io.engine.id
      });
    });

    this.socket.on("disconnect", () => {
      console.log("disconnected");
      this.updateConnection({ connected: false });
    });

    this.socket.on("full_state", this.onFullState);

    this.socket.on("merge_patch", this.onMergePatch);
  };

  onFullState = remote_state => {
    console.log("full_state", remote_state);
    const actual =
      Object.keys(remote_state).length !== 0 ? remote_state : this.state.remote;
    const newState = {
      remote: actual
    };
    if (this.props.hydrateLocalFromRemote) {
      newState.local = this.props.hydrateLocalFromRemote(actual);
    }
    this.setState(newState);
    this.updateConnection({ dataLoaded: true });
  };

  onMergePatch = patch => {
    console.log("Merging remote patch: ", patch);

    const newRemote = R.mergeDeepRight(this.state.remote, patch);
    const newState = { remote: newRemote };
    if (this.props.updateLocalFromRemote) {
      newState.local = this.props.updateLocalFromRemote(newRemote);
    }

    this.setState(newState);
  };

  updateConnection = patch => {
    console.log("Updating connection info: ", patch);
    this.setState({
      connection: R.mergeDeepRight(this.state.connection, patch)
    });
  };

  locally = patch => {
    console.log("Applying local patch: ", patch);
    this.setState({
      local: R.mergeDeepRight(this.state.local, patch)
    });
  };

  remotely = patch => {
    // optimistically update our own remote state
    this.setState({
      remote: R.mergeDeepRight(this.state.remote, patch)
    });

    // then emit the patch
    console.log("Sending remote patch: ", patch);
    this.socket.emit("merge_patch", patch);
  };

  render() {
    return (
      <Provider
        value={{
          state: this.state,
          locally: this.locally,
          remotely: this.remotely
        }}
      >
        {this.state.connection.dataLoaded
          ? this.props.children
          : this.props.loadingComponent || <div />}
      </Provider>
    );
  }
}

export function withState(Component) {
  return function StatefulComponent(props) {
    // renders the wrapped component as a Consumer
    return (
      <Consumer>
        {({ state, locally, remotely }) => (
          <Component
            {...props}
            state={state}
            locally={locally}
            remotely={remotely}
          />
        )}
      </Consumer>
    );
  };
}
