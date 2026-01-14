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
app.use('/css', express.static(path.join(__dirname, '../css')));
app.use('/js', express.static(path.join(__dirname, '../js')));

// --- PFADE AN DEINE STRUKTUR ANGEPASST (ROOT) ---
const FILES = {
    users: path.join(__dirname, '../users.json'),
    admins: path.join(__dirname, '../admins.json'),
    msgs: path.join(__dirname, '../messages.json'),
    servers: path.join(__dirname, '../servers.json')
};

// Sicherstellen, dass Dateien existieren
Object.values(FILES).forEach(f => {
    if (!fs.existsSync(f)) fs.writeFileSync(f, f.includes('users') ? "{}" : "[]");
});

// --- ROUTING ---
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../html/home.html')));
app.get('/app', (req, res) => res.sendFile(path.join(__dirname, '../html/index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, '../html/login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, '../html/registrieren.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, '../html/admin-console.html')));

// --- API ---
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
    let users = JSON.parse(fs.readFileSync(FILES.users));
    let admins = JSON.parse(fs.readFileSync(FILES.admins));

    // WICHTIG: Prüfung ob User existiert und Code stimmt
    if (users[username] && String(users[username].code) === String(code)) {
        const isAdmin = admins.includes(code);
        res.json({ success: true, isAdmin: isAdmin });
    } else {
        res.json({ success: false, message: "Falscher Name oder Code" });
    }
});

// ADMIN: Nutzer löschen
app.delete('/api/admin/users/:name', (req, res) => {
    let users = JSON.parse(fs.readFileSync(FILES.users));
    if(users[req.params.name]) {
        delete users[req.params.name];
        fs.writeFileSync(FILES.users, JSON.stringify(users, null, 2));
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

app.get('/api/admin/users', (req, res) => {
    res.json(JSON.parse(fs.readFileSync(FILES.users)));
});
// HILFSFUNKTION: Admin-Check
const isAdmin = (code) => {
    try {
        const admins = JSON.parse(fs.readFileSync(FILES.admins));
        return admins.includes(String(code));
    } catch (e) { return false; }
};

// ADMIN API: Passwortgeschützt
app.post('/api/admin/verify', (req, res) => {
    const { code } = req.body;
    if (isAdmin(code)) {
        res.json({ success: true });
    } else {
        res.json({ success: false, message: "Ungültiger Admin-Code" });
    }
});

// Löschen-Funktion (nur wenn Code mitgeschickt wird)
app.delete('/api/admin/users/:name', (req, res) => {
    const { adminCode } = req.body;
    if (!isAdmin(adminCode)) return res.status(403).json({ success: false });

    let users = JSON.parse(fs.readFileSync(FILES.users));
    if (users[req.params.name]) {
        delete users[req.params.name];
        fs.writeFileSync(FILES.users, JSON.stringify(users, null, 2));
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

server.listen(PORT, () => console.log(`🚀 Läuft auf Port ${PORT}`));