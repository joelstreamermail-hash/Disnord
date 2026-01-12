function createServer() {
    const nameInput = document.getElementById('server-name');
    const serverName = nameInput.value;

    if (serverName.trim() === "") {
        return alert("Bitte gib einen Servernamen ein!");
    }

    // Hier würde später ein Fetch-Request an den Server gehen
    console.log("Erstelle Server:", serverName);
    
    alert(`Server "${serverName}" wurde erfolgreich erstellt!`);
    location.href = '/';
}