// Für die Demo-Zwecke füllen wir eine Liste
const friendList = document.getElementById('friend-list');
const demoFriends = ['JoJo', 'Admin', 'TestUser', 'Developer'];

function loadFriends() {
    friendList.innerHTML = demoFriends.map(name => `
        <div class="friend-item" onclick="openChat('${name}')">
            <div class="av-small"></div>
            <span>${name}</span>
        </div>
    `).join('');
}

function openChat(name) {
    document.querySelector('.dm-main').innerHTML = `
        <div class="chat-header">Chat mit ${name}</div>
        <div id="dm-box" style="flex:1;"></div>
        <div class="input-area">
            <input placeholder="Nachricht an ${name}...">
        </div>
    `;
}

loadFriends();