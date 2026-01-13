const socket = io();
function send() {
    const input = document.getElementById('msg-in');
    if(input.value) { socket.emit('msg', { text: input.value, user: 'User' }); input.value = ''; }
}
socket.on('msg', (data) => {
    const box = document.getElementById('chat-box');
    box.innerHTML += `<div style="margin-bottom:10px"><b>${data.user}</b>: ${data.text}</div>`;
    box.scrollTop = box.scrollHeight;
});
