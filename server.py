import os
import json
import tempfile
import logging
from flask import Flask, send_from_directory
from flask_socketio import SocketIO, emit
from deepmerge import always_merger

# set up logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(levelname)s]  [%(asctime)s]  [%(filename)s:%(lineno)d]  %(message)s',
    datefmt='%H:%M:%S')
logging.info('Server starting...')

dir_path = os.path.dirname(os.path.realpath(__file__))

app = Flask(__name__, static_folder='ui/build')
socketio = SocketIO(app)

state = {}


def load():
    global state
    try:
        with open('snapshot.json') as f:
            state = json.load(f)
    except:
        logging.exception('Could not load snapshot.json, this is OK on first run')
        state = {}


def save():
    """
    Dump as json to a temporary file, flush, then replace the snapshot
    (this is an atomic OS operation)
    """
    global state
    fd, path = tempfile.mkstemp()
    f = os.fdopen(fd, mode='w')
    json.dump(state, f, ensure_ascii=True, indent=2)
    f.flush()
    os.fsync(fd)
    f.close()
    os.replace(path, 'snapshot.json')


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def index(path):
    return send_from_directory('ui/build/', 'index.html')


@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('ui/build/static', path)


@socketio.on('connect')
def on_connect():
    logging.info('on_connect')

    # send the current state to the connected client
    global state
    emit('full_state', state)


@socketio.on('merge_state')
def on_merge_state(patch):
    logging.info('on_merge_state: %s', json.dumps(patch))

    # merge and persist state
    global state
    state = always_merger.merge(state, patch)
    save()

    # broadcast the patch to all connected clients
    socketio.emit('merge_state', patch)


if __name__ == "__main__":
    load()
    port = 80 if os.environ.get('ENV') == 'production' else 3001
    socketio.run(app, port=port, log_output=True)
