const socket = io();
const chatBox = document.getElementById('chat-box');
const messageInput = document.getElementById('in');
const sendBtn = document.getElementById('btn');

// Daten aus dem LocalStorage laden
const currentUser = localStorage.getItem('disnord_user');
const currentAvatar = localStorage.getItem('disnord_avatar');

// Falls kein User eingeloggt ist -> zurück zum Login
if (!currentUser) {
    location.href = '/login';
}

// User-Bar im Interface aktualisieren
document.getElementById('my-name').innerText = currentUser;
if (currentAvatar) {
    document.getElementById('my-av-box').style.backgroundImage = `url(${currentAvatar})`;
}

// Dem Server mitteilen, dass wir online sind
socket.emit('join', { name: currentUser, avatar: currentAvatar });

// Nachricht senden
function sendMessage() {
    const text = messageInput.value;
    if (text.trim() !== "") {
        socket.emit('msg', { from: currentUser, text: text });
        messageInput.value = '';
    }
}

sendBtn.onclick = sendMessage;
messageInput.onkeypress = (e) => { if (e.key === 'Enter') sendMessage(); };

// Nachricht empfangen und anzeigen
socket.on('msg', (data) => {
    const div = document.createElement('div');
    div.className = 'message-wrapper';
    div.innerHTML = `
        <div style="display:flex; gap:12px; margin-bottom:15px;">
            <img src="${data.avatar || '/uploads/default-avatar.png'}" style="width:40px; height:40px; border-radius:10px; object-fit:cover; background:#333;">
            <div>
                <div style="display:flex; gap:8px; align-items:center;">
                    <b style="color:var(--accent);">${data.from}</b>
                    <small style="color:var(--text-muted); font-size:10px;">${data.time}</small>
                </div>
                <div style="color:white; margin-top:2px;">${data.text}</div>
            </div>
        </div>
    `;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
});