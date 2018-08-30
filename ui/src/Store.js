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
      local: (props.initialState || {}).local || {},
      remote: (props.initialState || {}).remote || {}
    };

    this.initSocket();
  }

  initSocket = () => {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const port =
      !process.env.NODE_ENV || process.env.NODE_ENV === "development"
        ? 3001
        : window.location.port;
    this.socket = io.connect(
      protocol + "://" + document.domain + ":" + port,
      {
        transports: ["websocket"]
      }
    );
    this.socket.on("full_state", this.onFullState);
    this.socket.on("merge_patch", this.onMergePatch);
  };

  onFullState = full_state => {
    console.log("full_state", full_state);
    const newState = {
      remote: full_state
    };
    if (this.props.hydrateLocalFromRemote) {
      newState.local = this.props.hydrateLocalFromRemote(full_state);
    }
    this.setState(newState);
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
        {this.props.children}
      </Provider>
    );
  }
}
