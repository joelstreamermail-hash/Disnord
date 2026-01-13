const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Upload Konfig
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads/avatars')),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

// Statische Ordner
app.use('/css', express.static(path.join(__dirname, '../css')));
app.use('/js', express.static(path.join(__dirname, '../js')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routen
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../html/index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, '../html/login.html')));
app.get('/server-create', (req, res) => res.sendFile(path.join(__dirname, '../html/server-create.html')));
app.get('/settings', (req, res) => res.sendFile(path.join(__dirname, '../html/settings.html')));
app.get('/direct-messages', (req, res) => res.sendFile(path.join(__dirname, '../html/direct-messages.html')));

// Upload Route
app.post('/upload-avatar', upload.single('avatar'), (req, res) => {
    if(req.file) res.json({ url: '/uploads/avatars/' + req.file.filename });
    else res.status(400).send('Fehler');
});

// Chat Socket
io.on('connection', (socket) => {
    // System Nachricht beim Beitritt
    socket.broadcast.emit('msg', { from: 'System', text: 'Ein neuer Benutzer ist beigetreten.' });

    socket.on('msg', (data) => {
        data.time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        io.emit('msg', data);
    });
});

server.listen(3000, () => console.log('🚀 Server läuft: http://localhost:3000'));
