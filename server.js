const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Use pure websocket frames for continuous mobile connectivity
const io = new Server(server, {
    transports: ['websocket', 'polling']
});

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', (socket) => {
    console.log('A user connected: ' + socket.id);

    socket.on('chat message', (msg) => {
        io.emit('chat message', msg);
    });

    socket.on('start typing', () => {
        socket.broadcast.emit('user typing');
    });

    socket.on('stop typing', () => {
        socket.broadcast.emit('user stop typing');
    });

    socket.on('send nudge', () => {
        socket.broadcast.emit('receive nudge');
    });

    // --- GLOBAL STREAMING SIGNALS (Fixes Proxy Hops) ---
    socket.on('webrtc-offer', (data) => {
        io.emit('webrtc-offer', data);
    });

    socket.on('webrtc-answer', (answer) => {
        io.emit('webrtc-answer', answer);
    });

    socket.on('webrtc-ice', (candidate) => {
        io.emit('webrtc-ice', candidate);
    });

    socket.on('end-call', () => {
        io.emit('end-call');
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
