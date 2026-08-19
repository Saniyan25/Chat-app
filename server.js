const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    transports: ['websocket', 'polling']
});

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Explicit list to track active socket links in real-time
let activeUsers = [];

io.on('connection', (socket) => {
    activeUsers.push(socket.id);
    console.log('User joined room: ' + socket.id);

    // Assign roles. The person who connected first is ALWAYS impolite (master host)
    // The second person who joins is ALWAYS polite (responsive client node)
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

    // WebRTC Real-Time Connection Signalling Lines
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
        console.log('User left room: ' + socket.id);
        activeUsers = activeUsers.filter(id => id !== socket.id);
        
        // Dynamic re-assignment loop to keep states perfectly clean
        activeUsers.forEach((id, index) => {
            io.to(id).emit('assign-role', { isPolite: index !== 0 });
        });
    });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server fully operational on network port ${PORT}`);
});