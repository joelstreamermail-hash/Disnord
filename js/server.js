const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const app = express();
const server = http.createServer(app);
const io = new Server(server);
let users = [];
let chatHistory = [];
let servers = {};
app.use('/css', express.static(path.join(__dirname, '../css')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../html/index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, '../html/loging.html')));
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, '../html/register.html')));
app.get('/friends', (req, res) => res.sendFile(path.join(__dirname, '../html/friends.html')));
app.get('/server-create', (req, res) => res.sendFile(path.join(__dirname, '../html/server-create.html')));
app.get('/settings', (req, res) => res.sendFile(path.join(__dirname, '../html/settings.html')));
io.on('connection', (socket) => {
    socket.on('join-chat', (username) => {
        socket.username = username;
        if(username && !users.includes(username)) users.push(username);
        socket.emit('load-history', chatHistory);
        io.emit('update-user-list', users);
    });
    socket.on('send-msg', (data) => {
        const msgData = { user: data.user, text: data.text, target: data.target, time: new Date().toLocaleTimeString() };
        chatHistory.push(msgData);
        io.emit('receive-msg', msgData);
    });
});
server.listen(3000, () => console.log('Server läuft auf http://localhost:3000'));
