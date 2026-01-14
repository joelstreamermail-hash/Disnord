const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 10000;

// Middleware um JSON-Daten von Formularen zu verstehen
app.use(express.json());

// --- DATEI-PFADE (Dynamisch für Railway/Render) ---
// Wenn wir online sind, nutzen wir /data, sonst lokal ../data
const isOnline = process.env.RAILWAY_VOLUME_MOUNT_PATH || process.env.RENDER;
const basePath = path.join(__dirname, '../data');

// Stelle sicher, dass der Ordner existiert
if (!fs.existsSync(basePath)) {
    fs.mkdirSync(basePath, { recursive: true });
}

const FILES = {
    users: path.join(basePath, 'users.json'),
    servers: path.join(basePath, 'servers.json'),
    msgs: path.join(basePath, 'messages.json')
};
// Initialisiere Dateien, falls sie fehlen
Object.values(FILES).forEach(f => {
    // Ordnerstruktur rekursiv erstellen, falls Pfad komplex ist
    const dir = path.dirname(f);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    // Datei erstellen
    if (!fs.existsSync(f)) {
        fs.writeFileSync(f, f.includes('users') ? "{}" : "[]");
    }
});

// --- STATISCHE DATEIEN ---
app.use('/css', express.static(path.join(__dirname, '../css')));
app.use('/js', express.static(path.join(__dirname, '../js')));

// --- ROUTING (SEITEN) ---
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../html/home.html')));
app.get('/app', (req, res) => res.sendFile(path.join(__dirname, '../html/index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, '../html/login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, '../html/registrieren.html')));

// --- API (LOGIN & REGISTER LOGIK) ---

// Registrieren
app.post('/api/register', (req, res) => {
    const { username, code } = req.body;
    let users = JSON.parse(fs.readFileSync(FILES.users));

    // Prüfen, ob ID schon vergeben ist
    const idExists = Object.values(users).find(u => u.code === code);
    if (idExists) {
        return res.json({ success: false, message: "ID bereits vergeben!" });
    }

    // Nutzer speichern (Key ist der Username zur Einfachheit, oder ID)
    // Wir speichern hier: Key = Username (damit Namen eindeutig sind)
    if(users[username]) {
        return res.json({ success: false, message: "Name bereits vergeben!" });
    }

    users[username] = { code: code, avatar: null }; 
    fs.writeFileSync(FILES.users, JSON.stringify(users, null, 2));
    
    res.json({ success: true });
});

// Einloggen
app.post('/api/login', (req, res) => {
    const { username, code } = req.body;
    let users = JSON.parse(fs.readFileSync(FILES.users));

    if (users[username] && users[username].code === code) {
        res.json({ success: true });
    } else {
        res.json({ success: false, message: "Falscher Name oder Code!" });
    }
});

// --- SOCKET.IO (CHAT) ---
io.on('connection', (socket) => {
    console.log('User verbunden:', socket.id);

    // Lade Server-Liste
    const serverData = JSON.parse(fs.readFileSync(FILES.servers));
    socket.emit('server-list', serverData);

    // Neuen Server erstellen
    socket.on('create-server', (data) => {
        let servers = JSON.parse(fs.readFileSync(FILES.servers));
        const newServer = {
            id: "srv-" + Date.now(),
            name: data.name,
            owner: data.ownerId,
            channels: ['general']
        };
        servers.push(newServer);
        fs.writeFileSync(FILES.servers, JSON.stringify(servers, null, 2));
        io.emit('server-list', servers);
    });

    socket.on('chat-message', (msg) => {
        io.emit('chat-message', msg);
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Server läuft auf Port ${PORT}`);
});