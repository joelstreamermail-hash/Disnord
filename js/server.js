const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// ORDNERSTRUKTUR SICHERSTELLEN
const dirs = ['./uploads/avatars', './js', './css', './html'];
dirs.forEach(dir => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); });

// DATEIEN INITIALISIEREN
const files = {
    msgs: path.join(__dirname, '../messages.json'),
    admins: path.join(__dirname, '../admins.json'),
    bans: path.join(__dirname, '../bans.json')
};
Object.values(files).forEach(f => { if (!fs.existsSync(f)) fs.writeFileSync(f, "[]"); });

app.use(express.json());
// Statische Dateien korrekt einbinden
app.use('/css', express.static(path.join(__dirname, '../css')));
app.use('/js', express.static(path.join(__dirname, '../js')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// MULTER FÜR AVATARE
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, './uploads/avatars'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

// --- ROUTEN (Fix für "Cannot GET") ---
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../html/index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, '../html/login.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, '../html/registrieren.html')));
app.get('/settings', (req, res) => res.sendFile(path.join(__dirname, '../html/settings.html')));
app.get('/admin-console', (req, res) => res.sendFile(path.join(__dirname, '../html/admin-console.html')));

// --- API ---
app.post('/upload-avatar', upload.single('avatar'), (req, res) => {
    if (req.file) res.json({ success: true, url: '/uploads/avatars/' + req.file.filename });
    else res.status(400).json({ success: false });
});

app.get('/api/admin/data', (req, res) => {
    res.json({ admins: JSON.parse(fs.readFileSync(files.admins)), bans: JSON.parse(fs.readFileSync(files.bans)) });
});

// --- SOCKET LOGIK ---
io.on('connection', (socket) => {
    const getAdmins = () => JSON.parse(fs.readFileSync(files.admins));
    const getBans = () => JSON.parse(fs.readFileSync(files.bans));

    socket.emit('history', JSON.parse(fs.readFileSync(files.msgs)));

    socket.on('msg', (data) => {
        if (getBans().includes(data.userId)) return socket.emit('banned');
        
        data.isAdmin = getAdmins().includes(data.userId);
        data.id = "msg-" + Date.now();
        data.time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        data.text = data.text.replace(/</g, "&lt;"); // XSS Schutz

        let msgs = JSON.parse(fs.readFileSync(files.msgs));
        msgs.push(data);
        fs.writeFileSync(files.msgs, JSON.stringify(msgs.slice(-100)));
        io.emit('msg', data);
    });

    socket.on('delete-msg', (payload) => {
        if (getAdmins().includes(payload.adminId)) {
            let msgs = JSON.parse(fs.readFileSync(files.msgs)).filter(m => m.id !== payload.msgId);
            fs.writeFileSync(files.msgs, JSON.stringify(msgs));
            io.emit('remove-msg', payload.msgId);
        }
    });
});

server.listen(3000, () => console.log('🚀 Alles bereit: http://localhost:3000'));