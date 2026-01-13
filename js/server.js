const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Ordner freigeben (damit HTML die CSS/JS Dateien findet)
app.use('/css', express.static(path.join(__dirname, '../css')));
app.use('/js', express.static(path.join(__dirname, '../js')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// --- ROUTEN ---
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../html/index.html')));
app.get('/server-create', (req, res) => res.sendFile(path.join(__dirname, '../html/server-create.html')));
app.get('/direct-messages', (req, res) => res.sendFile(path.join(__dirname, '../html/direct-messages.html')));
app.get('/settings', (req, res) => res.sendFile(path.join(__dirname, '../html/settings.html')));

// Chat Logik
io.on('connection', (socket) => {
    socket.on('msg', (data) => io.emit('msg', data));
});

server.listen(3000, () => console.log('✅ SERVER LÄUFT: http://localhost:3000'));
