// 1. Konfigurasi Firebase (Tetap sama)
const firebaseConfig = {
    apiKey: "AIzaSyDJWCCeZsD09D0w-b7UjTvbOw6WDSRfvA0",
    authDomain: "akbar-sehati.firebaseapp.com",
    databaseURL: "https://akbar-sehati-default-rtdb.firebaseio.com",
    projectId: "akbar-sehati",
    storageBucket: "akbar-sehati.firebasestorage.app",
    messagingSenderId: "258398807507",
    appId: "1:258398807507:web:e53ed0d569445ea2a83b26",
    measurementId: "G-TXBQ5G6KQG"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();

const chatWindow = document.getElementById('chat-window');
const nameInput = document.getElementById('name-input');
const messageInput = document.getElementById('message-input');
const btnSend = document.getElementById('btn-send');

// --- FUNGSI TAMBAHAN: MENGUBAH TEKS LINK JADI LINK BIRU ---
function urlify(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, function(url) {
        return `<a href="${url}" target="_blank" style="color: #0d6efd; text-decoration: underline;">${url}</a>`;
    });
}

window.deleteMessage = function(key) {
    if (confirm("Hapus pesan ini?")) {
        database.ref('messages').child(key).remove()
        .then(() => console.log("Pesan dihapus"))
        .catch((error) => console.error("Gagal hapus:", error));
    }
};

function sendMessage() {
    const name = nameInput.value.trim() || "Anonim";
    const message = messageInput.value;

    if (message.trim() !== "") {
        database.ref('messages').push().set({
            "sender": name,
            "text": message,
            "timestamp": Date.now()
        });
        messageInput.value = ""; 
        messageInput.focus();
    }
}

if (btnSend) {
    btnSend.onclick = sendMessage;
    messageInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            sendMessage();
        }
    });
}

// BACA PESAN REAL-TIME
database.ref('messages').on('child_added', (snapshot) => {
    const key = snapshot.key;
    const data = snapshot.val();
    
    const time = new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isMe = data.sender.trim() === nameInput.value.trim() && nameInput.value.trim() !== "";

    const div = document.createElement('div');
    div.className = `msg-bubble ${isMe ? 'msg-user' : 'msg-admin'}`;
    div.setAttribute('id', key); 
    
    // --- PERUBAHAN DI SINI: MENAMBAHKAN DETEKSI GAMBAR & LINK ---
    let messageContent = urlify(data.text); // Teks otomatis jadi link biru

    // Cek apakah pesan adalah link gambar (akhiran .jpg, .png, .gif)
    if (data.text.match(/\.(jpeg|jpg|gif|png|webp)$/) != null) {
        messageContent = `<img src="${data.text}" style="max-width: 100%; border-radius: 10px; margin-top: 5px; cursor: pointer;" onclick="window.open('${data.text}', '_blank')">`;
    }

    div.innerHTML = `
        <button class="btn-delete" onclick="window.deleteMessage('${key}')" title="Hapus">✕</button>
        <small class="d-block fw-bold" style="font-size: 0.7rem; opacity: 0.8;">
            ${data.sender}
        </small>
        <div>${messageContent}</div> 
        <span class="msg-time">${time}</span>
    `;
    
    chatWindow.appendChild(div);
    chatWindow.scrollTop = chatWindow.scrollHeight;
});

database.ref('messages').on('child_removed', (snapshot) => {
    const deletedElement = document.getElementById(snapshot.key);
    if (deletedElement) {
        deletedElement.remove();
    }
});