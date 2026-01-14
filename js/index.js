const socket = io();
const uId = localStorage.getItem('disnord_id');
const uName = localStorage.getItem('disnord_user');

if (!uId || !uName) {
    if (window.location.pathname === '/app') window.location.href = '/';
}

document.addEventListener('DOMContentLoaded', () => {
    if (uId) {
        socket.emit('check-session', uId);
        const widgetName = document.getElementById('my-widget-name');
        const widgetAv = document.getElementById('my-widget-av');
        if(widgetName) widgetName.innerText = uName;
        if(widgetAv) widgetAv.src = localStorage.getItem('disnord_avatar') || `https://ui-avatars.com/api/?name=${uName}`;
    }
});

socket.on('session-result', (res) => {
    if (res.isBanned) { alert("Banned!"); localStorage.clear(); location.href = '/'; }
    if (res.isAdmin) {
        const icon = document.getElementById('admin-icon');
        if(icon) icon.style.display = 'block';
    }
});

function send() {
    const input = document.getElementById('msg-in');
    if (!input.value.trim()) return;
    socket.emit('msg', {
        userId: uId, from: uName, text: input.value,
        avatar: localStorage.getItem('disnord_avatar') || '',
        bio: localStorage.getItem('disnord_bio') || 'Keine Bio vorhanden.'
    });
    input.value = "";
}

function searchUser() {
    const id = document.getElementById('id-search-input').value.trim();
    if (id) socket.emit('search-id', id);
}

socket.on('search-result', (u) => {
    if (u) openProfile(u.name, u.bio, u.isAdmin, u.id);
    else alert("User nicht gefunden!");
});

// Profil Modal Funktion
window.openProfile = function(name, bio, admin, id) {
    const modal = document.createElement('div');
    modal.className = 'profile-modal-overlay';
    modal.innerHTML = `
        <div class="profile-card">
            <div class="profile-banner" style="background:${admin ? '#5865f2' : '#747f8d'}"></div>
            <div class="profile-info">
                <img src="https://ui-avatars.com/api/?name=${name}" class="profile-av-large">
                <h2 style="margin-top:40px">${name}</h2>
                <p style="color:#b9bbbe; font-size:12px">ID: ${id}</p>
                <div style="margin:15px 0">
                    <span class="badge-item">${admin ? '🛡️ Offizieller Moderator' : '👤 Mitglied'}</span>
                </div>
                <p><strong>BIO:</strong><br>${bio}</p>
                <button class="btn-primary" onclick="this.closest('.profile-modal-overlay').remove()" style="width:100%">Schließen</button>
            </div>
        </div>`;
    document.body.appendChild(modal);
};

socket.on('msg', (d) => renderMessage(d));
socket.on('history', (h) => {
    const box = document.getElementById('chat-box');
    if(box) { box.innerHTML = ''; h.forEach(m => renderMessage(m)); }
});

function renderMessage(d) {
    const box = document.getElementById('chat-box');
    if(!box) return;
    const div = document.createElement('div');
    div.className = 'msg-container';
    div.id = d.id;
    div.innerHTML = `
        <img src="${d.avatar || 'https://ui-avatars.com/api/?name='+d.from}" class="msg-av" onclick="openProfile('${d.from}', '${d.bio}', ${d.isAdmin}, '${d.userId}')">
        <div class="msg-content">
            <div class="msg-header">
                <b onclick="openProfile('${d.from}', '${d.bio}', ${d.isAdmin}, '${d.userId}')" style="cursor:pointer">${d.from}</b>
                ${d.isAdmin ? '<span class="badge-mod">MOD</span>' : ''} <small>${d.time}</small>
            </div>
            <div class="msg-text">${d.text}</div>
        </div>`;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}