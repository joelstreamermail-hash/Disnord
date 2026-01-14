const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 10000;

app.use(express.json());

// --- FIX FÜR RENDER DATEISYSTEM ---
// Wir nutzen einen Ordner INNERHALB des Projekts, nicht im Root
const dataDir = path.join(__dirname, 'data_storage'); 

// Ordner sicher erstellen
if (!fs.existsSync(dataDir)) {
    try {
        fs.mkdirSync(dataDir, { recursive: true });
    } catch (err) {
        console.error("Konnte Datenordner nicht erstellen:", err);
    }
}

const FILES = {
    users: path.join(dataDir, 'users.json'),
    servers: path.join(dataDir, 'servers.json'),
    msgs: path.join(dataDir, 'messages.json')
};

// Dateien initialisieren
Object.values(FILES).forEach(f => {
    if (!fs.existsSync(f)) fs.writeFileSync(f, f.includes('users') ? "{}" : "[]");
});

// --- ROUTING (Bug Fixes) ---
// Statische Dateien (CSS, JS)
app.use('/css', express.static(path.join(__dirname, '../css')));
app.use('/js', express.static(path.join(__dirname, '../js'))); // Falls du client-js hast

// Seiten
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../html/home.html')));
app.get('/app', (req, res) => res.sendFile(path.join(__dirname, '../html/index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, '../html/login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, '../html/registrieren.html')));

// --- API ---
app.post('/api/register', (req, res) => {
    const { username, code } = req.body;
    let users = JSON.parse(fs.readFileSync(FILES.users));
    if (users[username]) return res.json({ success: false, message: "Name vergeben!" });
    
    users[username] = { code, avatar: null };
    fs.writeFileSync(FILES.users, JSON.stringify(users, null, 2));
    res.json({ success: true });
});

app.post('/api/login', (req, res) => {
    const { username, code } = req.body;
    let users = JSON.parse(fs.readFileSync(FILES.users));
    if (users[username] && users[username].code === code) res.json({ success: true });
    else res.json({ success: false });
});

// --- CHAT LOGIK ---
io.on('connection', (socket) => {
    // Lade Chatverlauf (einfach gehalten)
    const msgs = JSON.parse(fs.readFileSync(FILES.msgs));
    socket.emit('history', msgs);

    // Lade Serverliste
    const servers = JSON.parse(fs.readFileSync(FILES.servers));
    socket.emit('server-list', servers);

    socket.on('chat-message', (msg) => {
        let allMsgs = JSON.parse(fs.readFileSync(FILES.msgs));
        allMsgs.push(msg);
        if(allMsgs.length > 50) allMsgs.shift(); // Nur letzte 50 speichern
        fs.writeFileSync(FILES.msgs, JSON.stringify(allMsgs));
        io.emit('chat-message', msg);
    });

    socket.on('create-server', (data) => {
        let servers = JSON.parse(fs.readFileSync(FILES.servers));
        servers.push({ id: Date.now(), name: data.name });
        fs.writeFileSync(FILES.servers, JSON.stringify(servers));
        io.emit('server-list', servers);
    });
});

server.listen(PORT, () => console.log(`🚀 Online auf Port ${PORT}`));