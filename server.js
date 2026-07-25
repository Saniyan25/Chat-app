const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Configure socket server to accept stable websocket data frames
const io = new Server(server, {
    transports: ['websocket', 'polling']
});

// Serve frontend layout assets
app.use(express.static(__dirname + '/public'));

// Explicit fallback route to load the interface HTML file
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Handle real-time user channels
io.on('connection', (socket) => {
    console.log('A user connected: ' + socket.id);

    // Forward text messages
    socket.on('chat message', (msg) => {
        io.emit('chat message', msg);
    });

    // Handle user typing statuses
    socket.on('start typing', () => {
        socket.broadcast.emit('user typing');
    });

    socket.on('stop typing', () => {
        socket.broadcast.emit('user stop typing');
    });

    // Handle room notifications/nudges
    socket.on('send nudge', () => {
        socket.broadcast.emit('receive nudge');
    });

    // --- WebRTC Video Call Routing Signals ---
    socket.on('webrtc-offer', (offer) => {
        io.emit('webrtc-offer', offer);
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

// Use dynamic cloud environment ports, fallback to 8080 locally
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});