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

const DB = {
    users: path.join(__dirname, '../users.json'),
    mods: path.join(__dirname, '../admins.json'),
    msgs: path.join(__dirname, '../messages.json')
};

const read = (f, d) => {
    try { 
        if (!fs.existsSync(f)) fs.writeFileSync(f, JSON.stringify(d));
        return JSON.parse(fs.readFileSync(f)); 
    } catch(e) { return d; }
};
const save = (f, data) => fs.writeFileSync(f, JSON.stringify(data, null, 2));

// JoJo-Dev Initialisierung
let users = read(DB.users, {});
if (!users["JoJo-Dev"]) {
    users["JoJo-Dev"] = { code: "JoJo-Dev", uid: "DEV-ROOT-001", bannedUntil: 0, warns: 0 };
    save(DB.users, users);
}

// Fix für Cannot GET (Explizite Pfade)
const pages = {
    '/': 'home.html',
    '/login': 'login.html',
    '/register': 'registrieren.html',
    '/app': 'index.html',
    '/settings': 'settings.html',
    '/admin': 'admin-console.html'
};

Object.entries(pages).forEach(([route, file]) => {
    app.get(route, (req, res) => res.sendFile(path.join(__dirname, '../html/', file)));
});

// Admin Check Funktion
const getRole = (username, uid) => {
    if (username === "JoJo-Dev") return "DEV";
    const mods = read(DB.mods, []);
    return mods.includes(uid) ? "MOD" : "USER";
};

// Login API
app.post('/api/login', (req, res) => {
    const { username, code } = req.body;
    let u = read(DB.users, {});
    const user = u[username];
    if (user && String(user.code) === String(code)) {
        if (user.bannedUntil > Date.now()) {
            return res.json({ success: false, message: "Konto gesperrt." });
        }
        const role = getRole(username, user.uid);
        res.json({ success: true, uid: user.uid, isAdmin: role !== "USER", isDev: role === "DEV" });
    } else res.json({ success: false });
});

// Admin API: Liste & Aktionen
app.post('/api/admin/list', (req, res) => {
    const { adminName, adminUid } = req.body;
    const role = getRole(adminName, adminUid);
    if (role === "USER") return res.json({ success: false });
    res.json({ success: true, users: read(DB.users, {}), mods: read(DB.mods, []), role: role });
});

app.post('/api/admin/action', (req, res) => {
    const { adminName, adminUid, targetName, action, value } = req.body;
    const role = getRole(adminName, adminUid);
    if (role === "USER" || targetName === "JoJo-Dev") return res.json({ success: false });

    let u = read(DB.users, {});
    if (action === "warn") u[targetName].warns = (u[targetName].warns || 0) + 1;
    if (action === "ban") u[targetName].bannedUntil = Date.now() + (parseFloat(value) * 3600000);
    if (action === "unban") u[targetName].bannedUntil = 0;
    if (action === "toggle-mod" && role === "DEV") {
        let mods = read(DB.mods, []);
        const targetUid = u[targetName].uid;
        if(mods.includes(targetUid)) mods = mods.filter(i => i !== targetUid);
        else mods.push(targetUid);
        save(DB.mods, mods);
    }
    save(DB.users, u);
    res.json({ success: true });
});

io.on('connection', (socket) => {
    socket.emit('history', read(DB.msgs, []));
    socket.on('chat-message', (m) => {
        let u = read(DB.users, {});
        if(u[m.user] && u[m.user].bannedUntil > Date.now()) return;
        let msgs = read(DB.msgs, []);
        msgs.push(m);
        if(msgs.length > 50) msgs.shift();
        save(DB.msgs, msgs);
        io.emit('chat-message', m);
    });
});

server.listen(PORT, () => console.log('Server online'));