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

// --- SICHERER SPEICHERORT (Fix für Render Crash) ---
// Wir speichern Daten in einem Ordner namens 'data_storage' im Projekt
const dataDir = path.join(__dirname, 'data_storage');
if (!fs.existsSync(dataDir)) {
    try { fs.mkdirSync(dataDir, { recursive: true }); } 
    catch (e) { console.log("Fehler beim Erstellen des Ordners:", e); }
}

const FILES = {
    users: path.join(dataDir, 'users.json'),
    servers: path.join(dataDir, 'servers.json'),
    // Admins laden wir aus dem Hauptverzeichnis (statisch) oder auch aus data
    admins: path.join(__dirname, '../admins.json') 
};

// Dateien initialisieren, damit nichts abstürzt
if (!fs.existsSync(FILES.users)) fs.writeFileSync(FILES.users, "{}");
if (!fs.existsSync(FILES.servers)) fs.writeFileSync(FILES.servers, "[]");
// admins.json muss manuell erstellt/gepusht werden, sonst leer
if (!fs.existsSync(FILES.admins)) fs.writeFileSync(FILES.admins, "[]");

// --- ROUTING (Seiten ausliefern) ---
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../html/home.html')));
app.get('/app', (req, res) => res.sendFile(path.join(__dirname, '../html/index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, '../html/login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, '../html/registrieren.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, '../html/admin-console.html')));

// --- API (Logik für Login/Admin) ---

// 1. Registrieren
app.post('/api/register', (req, res) => {
    const { username, code } = req.body;
    if(!username || !code) return res.json({success: false, message: "Fehlende Daten"});

    let users = JSON.parse(fs.readFileSync(FILES.users));
    if (users[username]) return res.json({ success: false, message: "Name bereits vergeben!" });

    users[username] = { code: code, role: "user" };
    fs.writeFileSync(FILES.users, JSON.stringify(users, null, 2));
    res.json({ success: true });
});

// 2. Login
app.post('/api/login', (req, res) => {
    const { username, code } = req.body;
    let users = JSON.parse(fs.readFileSync(FILES.users));
    let admins = [];
    try { admins = JSON.parse(fs.readFileSync(FILES.admins)); } catch(e){}

    if (users[username] && users[username].code === code) {
        // Check ob Admin
        const isAdmin = admins.includes(code); // Einfacher Check: Ist der Code in der Admin Liste?
        res.json({ success: true, isAdmin: isAdmin });
    } else {
        res.json({ success: false, message: "Falsche Daten" });
    }
});

// 3. Admin: User Liste holen
app.get('/api/admin/users', (req, res) => {
    // Sicherheit: Hier könnte man noch prüfen, ob der Anfragende Admin ist
    let users = JSON.parse(fs.readFileSync(FILES.users));
    res.json(users);
});

// 4. Admin: User löschen (NEU!)
app.delete('/api/admin/users/:name', (req, res) => {
    const nameToDelete = req.params.name;
    let users = JSON.parse(fs.readFileSync(FILES.users));
    
    if(users[nameToDelete]) {
        delete users[nameToDelete];
        fs.writeFileSync(FILES.users, JSON.stringify(users, null, 2));
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

// --- SOCKET SERVER (Chat) ---
io.on('connection', (socket) => {
    // Server Liste senden
    const servers = JSON.parse(fs.readFileSync(FILES.servers));
    socket.emit('server-list', servers);

    socket.on('chat-message', (msg) => io.emit('chat-message', msg));
    
    socket.on('create-server', (data) => {
        let srvs = JSON.parse(fs.readFileSync(FILES.servers));
        srvs.push({ id: Date.now(), name: data.name });
        fs.writeFileSync(FILES.servers, JSON.stringify(srvs));
        io.emit('server-list', srvs);
    });
});

server.listen(PORT, () => console.log(`🚀 Disnord läuft auf Port ${PORT}`));