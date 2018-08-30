import React, { Component } from "react";
import { Store, Consumer } from "./Store";
import "./App.css";

class App extends Component {
  render() {
    return (
      <Store
        initialState={{
          local: {
            input_value: ""
          },
          remote: {
            echo: ""
          }
        }}
        hydrateLocalFromRemote={({ echo }) => ({ input_value: echo })}
      >
        <Consumer>
          {({ state, applyLocalPatch, applyRemotePatch }) => (
            <div>
              <div className="input">
                <form>
                  <textarea
                    cols={80}
                    rows={5}
                    placeholder="Send a message to the server..."
                    value={state.local.input_value}
                    onChange={e =>
                      applyLocalPatch({
                        input_value: e.target.value
                      })
                    }
                  />
                  <br />
                  <button
                    type="button"
                    onClick={() =>
                      applyRemotePatch({
                        echo: state.local.input_value
                      })
                    }
                  >
                    Send
                  </button>
                </form>
              </div>
              <pre id="response">{state.remote.echo}</pre>
            </div>
          )}
        </Consumer>
      </Store>
    );
  }
}

export default App;
