const socket = io();
const myUser = localStorage.getItem('disnord_user') || 'Gast';

function send() {
    const input = document.getElementById('msg-in');
    if(input.value.trim()) { 
        socket.emit('msg', { from: myUser, text: input.value }); 
        input.value = ''; 
    }
}

// Enter Taste
document.getElementById('msg-in').addEventListener('keypress', (e) => { if(e.key === 'Enter') send(); });

socket.on('msg', (data) => {
    const box = document.getElementById('chat-box');
    const div = document.createElement('div');
    
    if(data.from === 'System') {
        div.className = 'system-msg';
        div.innerText = data.text;
    } else {
        div.className = 'msg-container';
        div.innerHTML = `
            <div class="msg-av"></div>
            <div>
                <div>
                    <span class="msg-user">${data.from}</span>
                    <span class="msg-time">${data.time}</span>
                </div>
                <div style="color:#dcddde">${data.text}</div>
            </div>`;
    }
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
});
