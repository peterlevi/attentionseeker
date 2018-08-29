import os
from flask import Flask, send_from_directory
from flask_socketio import SocketIO

dir_path = os.path.dirname(os.path.realpath(__file__))

app = Flask(__name__, static_folder='ui/build')
socketio = SocketIO(app)


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def index(path):
    return send_from_directory('ui/build/', 'index.html')


@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('ui/build/static', path)


@socketio.on('send_message')
def handle_source(json_data):
    text = json_data['message'].encode('ascii', 'ignore')
    socketio.emit('echo', {'echo': 'Server Says: ' + text.decode()})


if __name__ == "__main__":
    port = 80 if os.environ.get('ENV') == 'production' else 3001
    socketio.run(app, port=port, log_output=True)
