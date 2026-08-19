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

// Array to track active user socket IDs linearly
let activeUsers = [];

io.on('connection', (socket) => {
    // Add new user to our tracking system
    activeUsers.push(socket.id);
    console.log('User connected: ' + socket.id);

    // Assign polite/impolite role immediately upon connection
    const isPolite = activeUsers.indexOf(socket.id) !== 0;
    socket.emit('assign-role', { isPolite: isPolite });

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

    socket.on('webrtc-answer', (data) => {
        io.emit('webrtc-answer', data);
    });

    socket.on('webrtc-ice', (data) => {
        io.emit('webrtc-ice', data);
    });

    socket.on('end-call', () => {
        io.emit('end-call');
    });

    socket.on('disconnect', () => {
        console.log('User disconnected: ' + socket.id);
        // Clean them out of the tracking index
        activeUsers = activeUsers.filter(id => id !== socket.id);
        
        // Re-assign roles to remaining users
        activeUsers.forEach((id, index) => {
            io.to(id).emit('assign-role', { isPolite: index !== 0 });
        });
    });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});