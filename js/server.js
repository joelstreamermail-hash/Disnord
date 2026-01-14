const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 10000;

// Middleware
app.use(express.json());
app.use('/css', express.static(path.join(__dirname, '../css')));
app.use('/js', express.static(path.join(__dirname, '../js')));

// --- DATEN-MANAGEMENT ---
const dataDir = path.join(__dirname, '../data_storage');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const FILES = {
    users: path.join(dataDir, 'users.json'),
    admins: path.join(__dirname, '../admins.json'), // Aus deinem Root-Ordner
    servers: path.join(dataDir, 'servers.json')
};

// Initialisierung
if (!fs.existsSync(FILES.users)) fs.writeFileSync(FILES.users, "{}");
if (!fs.existsSync(FILES.admins)) fs.writeFileSync(FILES.admins, "[]");
if (!fs.existsSync(FILES.servers)) fs.writeFileSync(FILES.servers, "[]");

// --- ROUTING FIXES ---
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../html/home.html')));
app.get('/app', (req, res) => res.sendFile(path.join(__dirname, '../html/index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, '../html/login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, '../html/registrieren.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, '../html/admin-console.html')));

// --- AUTH API ---
app.post('/api/register', (req, res) => {
    const { username, code } = req.body;
    let users = JSON.parse(fs.readFileSync(FILES.users));
    if (users[username]) return res.json({ success: false, message: "Name belegt" });
    users[username] = { code, role: "user" };
    fs.writeFileSync(FILES.users, JSON.stringify(users, null, 2));
    res.json({ success: true });
});

app.post('/api/login', (req, res) => {
    const { username, code } = req.body;
    let users = JSON.parse(fs.readFileSync(FILES.users));
    let admins = JSON.parse(fs.readFileSync(FILES.admins));

    if (users[username] && users[username].code === code) {
        // Prüfen ob Admin
        const isAdmin = admins.includes(code);
        res.json({ success: true, isAdmin: isAdmin });
    } else {
        res.json({ success: false });
    }
});

// --- ADMIN API ---
app.get('/api/admin/users', (req, res) => {
    let users = JSON.parse(fs.readFileSync(FILES.users));
    res.json(users);
});

server.listen(PORT, () => console.log(`Server läuft auf ${PORT}`));