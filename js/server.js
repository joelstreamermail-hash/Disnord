const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Statische Ordner freigeben (damit CSS und JS geladen werden)
app.use('/css', express.static(path.join(__dirname, '../css')));
app.use('/js', express.static(path.join(__dirname, '../js')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// --- ALLE ROUTEN DEFINIEREN ---

// Hauptseite (Home)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../html/index.html'));
});

// Login
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../html/loging.html'));
});

// NEU: Server erstellen
app.get('/server-create', (req, res) => {
    res.sendFile(path.join(__dirname, '../html/server-create.html'));
});

// NEU: Direktnachrichten
app.get('/direct-messages', (req, res) => {
    res.sendFile(path.join(__dirname, '../html/direct-messages.html'));
});

// NEU: Einstellungen
app.get('/settings', (req, res) => {
    res.sendFile(path.join(__dirname, '../html/settings.html'));
});

// Socket.io Logik
io.on('connection', (socket) => {
    socket.on('msg', (data) => io.emit('msg', data));
});

// Server starten
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`✅ Server aktiv: http://localhost:${PORT}`);
});