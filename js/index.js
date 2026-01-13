const socket = io();
const userId = localStorage.getItem('disnord_id');
const userName = localStorage.getItem('disnord_user');

if(!userId) location.href = '/register';

function send() {
    const input = document.getElementById('msg-in');
    if(!input.value.trim()) return;

    socket.emit('msg', {
        userId: userId,
        from: userName,
        text: input.value,
        avatar: localStorage.getItem('disnord_avatar') || '',
        bio: localStorage.getItem('disnord_bio') || 'Keine Bio.'
    });
    input.value = "";
}

socket.on('msg', (data) => {
    const box = document.getElementById('chat-box');
    const div = document.createElement('div');
    div.className = 'msg-container';
    div.id = data.id;
    
    // Löschbutton nur für Admins (einfache UI-Prüfung, Server prüft nochmal)
    const delBtn = data.isAdmin ? `<span onclick="del('${data.id}')" style="cursor:pointer;margin-left:10px">🗑️</span>` : '';

    div.innerHTML = `
        <img src="${data.avatar || 'https://via.placeholder.com/40'}" class="msg-av">
        <div class="msg-content">
            <div class="msg-header">
                <b>${data.from}</b> ${data.isAdmin ? '🛡️' : ''} <small>${data.time}</small> ${delBtn}
            </div>
            <div class="msg-text">${data.text}</div>
        </div>`;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
});

function del(msgId) {
    socket.emit('delete-msg', { msgId: msgId, adminId: userId });
}

socket.on('remove-msg', (id) => document.getElementById(id)?.remove());
socket.on('banned', () => { alert("Du bist gebannt!"); location.href = '/login'; });