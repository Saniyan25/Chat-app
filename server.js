// Import the open-source frameworks we installed
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve your frontend HTML file automatically
app.use(express.static(__dirname + '/public'));

// Listen for a user connecting to your website
io.on('connection', (socket) => {
    console.log('A user connected: ' + socket.id);

    // Listen for a message sent by a specific user
    socket.on('chat message', (msg) => {
        // Forward that message to every other connected user
        io.emit('chat message', msg);
    });

    // Listen for typing events and broadcast to everyone EXCEPT the person typing
    socket.on('start typing', () => {
        socket.broadcast.emit('user typing');
    });

    // Listen for stop typing events
    socket.on('stop typing', () => {
        socket.broadcast.emit('user stop typing');
    });

    // Listen for room alerts/nudges
    socket.on('send nudge', () => {
        socket.broadcast.emit('receive nudge');
    });

    // Handle user disconnecting
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Start the server on port 3000
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});