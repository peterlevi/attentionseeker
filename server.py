import os
from flask import Flask
from flask_socketio import SocketIO

app = Flask(__name__, static_folder='ui/build', static_url_path='')
socketio = SocketIO(app)


@app.route('/')
def root():
    return app.send_static_file('index.html')


@socketio.on('send_message')
def handle_source(json_data):
    text = json_data['message'].encode('ascii', 'ignore')
    socketio.emit('echo', {'echo': 'Server Says: ' + text.decode()})


if __name__ == "__main__":
    port = 80 if os.environ.get('ENV') == 'production' else 3001
    socketio.run(app, port=port)
