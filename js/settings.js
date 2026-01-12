const avInput = document.getElementById('av-in');
const preview = document.getElementById('preview-av');

// Vorschau laden, falls Bild vorhanden
const savedAv = localStorage.getItem('disnord_avatar');
if (savedAv) preview.style.backgroundImage = `url(${savedAv})`;

async function uploadAvatar() {
    const file = avInput.files[0];
    if (!file) return alert("Bitte wähle zuerst ein Bild aus!");

    const formData = new FormData();
    formData.append('avatar', file);

    try {
        const response = await fetch('/upload-avatar', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('disnord_avatar', data.url);
            preview.style.backgroundImage = `url(${data.url})`;
            alert("Profilbild erfolgreich aktualisiert!");
        } else {
            alert("Upload fehlgeschlagen.");
        }
    } catch (err) {
        console.error("Fehler beim Upload:", err);
    }
}