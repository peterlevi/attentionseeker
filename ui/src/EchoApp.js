import React, { Component } from "react";
import { Store, Consumer } from "./Store";

export class EchoApp extends Component {
  /**
   * Another app example, for "server echo"
   */
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
          {({ state, locally, remotely }) => (
            <div>
              <div className="input">
                <form>
                  <textarea
                    cols={80}
                    rows={5}
                    placeholder="Send a message to the server..."
                    value={state.local.input_value}
                    onChange={e =>
                      locally({
                        input_value: e.target.value
                      })
                    }
                  />
                  <br />
                  <button
                    type="button"
                    onClick={() =>
                      remotely({
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
