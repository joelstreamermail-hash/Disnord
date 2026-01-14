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
// Statische Pfade korrigiert für deine Struktur
app.use('/css', express.static(path.join(__dirname, '../css')));
app.use('/js', express.static(path.join(__dirname, '../js')));

// Dateipfade basierend auf deinem Explorer-Screenshot
const FILES = {
    users: path.join(__dirname, '../users.json'),
    admins: path.join(__dirname, '../admins.json'),
    messages: path.join(__dirname, '../messages.json'),
    servers: path.join(__dirname, '../servers.json')
};

// Initialisierung (verhindert Abstürze)
Object.values(FILES).forEach(f => {
    if (!fs.existsSync(f)) fs.writeFileSync(f, f.includes('users') ? "{}" : "[]");
});

// --- HELPER ---
const getAdmins = () => JSON.parse(fs.readFileSync(FILES.admins));

// --- ROUTES ---
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../html/home.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, '../html/login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, '../html/registrieren.html')));
app.get('/app', (req, res) => res.sendFile(path.join(__dirname, '../html/index.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, '../html/admin-console.html')));

// --- AUTH API ---
app.post('/api/register', (req, res) => {
    const { username, code } = req.body;
    let users = JSON.parse(fs.readFileSync(FILES.users));
    if (users[username]) return res.json({ success: false, message: "Name belegt" });
    users[username] = { code };
    fs.writeFileSync(FILES.users, JSON.stringify(users, null, 2));
    res.json({ success: true });
});

app.post('/api/login', (req, res) => {
    const { username, code } = req.body;
    const users = JSON.parse(fs.readFileSync(FILES.users));
    const admins = getAdmins();

    if (users[username] && String(users[username].code) === String(code)) {
        res.json({ success: true, isAdmin: admins.includes(String(code)) });
    } else {
        res.json({ success: false, message: "Daten inkorrekt" });
    }
});

// --- ADMIN API ---
app.post('/api/admin/verify', (req, res) => {
    const { code } = req.body;
    res.json({ success: getAdmins().includes(String(code)) });
});

app.get('/api/admin/users', (req, res) => {
    res.json(JSON.parse(fs.readFileSync(FILES.users)));
});

app.delete('/api/admin/users/:name', (req, res) => {
    const { adminCode } = req.body;
    if (!getAdmins().includes(String(adminCode))) return res.status(403).send();
    
    let users = JSON.parse(fs.readFileSync(FILES.users));
    delete users[req.params.name];
    fs.writeFileSync(FILES.users, JSON.stringify(users, null, 2));
    res.json({ success: true });
});

// --- SOCKETS ---
io.on('connection', (socket) => {
    socket.emit('history', JSON.parse(fs.readFileSync(FILES.messages)));
    
    socket.on('chat-message', (data) => {
        let msgs = JSON.parse(fs.readFileSync(FILES.messages));
        msgs.push(data);
        if(msgs.length > 100) msgs.shift();
        fs.writeFileSync(FILES.messages, JSON.stringify(msgs));
        io.emit('chat-message', data);
    });
});

server.listen(PORT, () => console.log(`Disnord aktiv auf Port ${PORT}`));