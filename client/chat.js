const chat = {
    activeRecipient: null,
    typingTimer: null,

    loadDM: (username) => {
        chat.activeRecipient = username;
        ui.setActiveChat(username);
        ui.renderMemberList([{username: username, role: "MEMBER"}]); // Mock member list for DM
        ui.renderFileList([]);
        document.getElementById('chat-input').focus();
    },

    handleTyping: () => {
        if (!chat.activeRecipient) return;
        
        // Debounce typing event
        clearTimeout(chat.typingTimer);
        app.ws.send(JSON.stringify({
            type: 'typing',
            to: chat.activeRecipient,
            sender: auth.username
        }));

        chat.typingTimer = setTimeout(() => {}, 3000);
    },

    sendForm: async (event) => {
        if (event) event.preventDefault();

        const input = document.getElementById('chat-input');
        const plaintext = input.value.trim();
        const recipient = chat.activeRecipient;

        if (!plaintext || !recipient) return;

        // Clear input immediately for responsiveness
        input.value = '';

        const attemptSend = async (retriesLeft) => {
            try {
                const recipientPK = await app.getRecipientPublicKey(recipient);
                const encrypted = await cryptoState.encryptMessage(plaintext, recipientPK);

                const msgEl = ui.appendMessage(auth.username, plaintext, null, 'text', true);
                ui.showEncryptedBadge(msgEl);

                app.ws.send(JSON.stringify({
                    type: 'dm',
                    to: recipient,
                    sender: auth.username,
                    kyberCiphertext: encrypted.kyberCiphertext,
                    ciphertext: encrypted.ciphertext,
                    nonce: encrypted.nonce
                }));
            } catch (e) {
                if (retriesLeft > 0 && e.message && e.message.includes('No public key')) {
                    // Recipient hasn't registered their key yet — retry shortly
                    setTimeout(() => attemptSend(retriesLeft - 1), 1500);
                } else {
                    console.error('Send failed:', e);
                    ui.appendMessage('SYSTEM', `[ERROR: ${e.message}]`, null, 'text', false);
                }
            }
        };

        await attemptSend(3);
    },

    receive: async (message) => {
        if (!app.mySecretKey) {
            ui.appendMessage(message.sender || '?', '[NO SECRET KEY]', null, 'text', false);
            return;
        }

        try {
            const plaintext = await cryptoState.decryptMessage(
                message.kyberCiphertext, 
                message.ciphertext, 
                message.nonce, 
                app.mySecretKey
            );
            const msgEl = ui.appendMessage(message.sender || '?', plaintext, null, 'text', false);
            ui.showEncryptedBadge(msgEl);
            ui.hideTypingIndicator(); // hide if they were typing
        } catch (e) {
            ui.appendMessage(message.sender || '?', '[DECRYPTION FAILED]', null, 'text', false);
        }
    }
};

// Listen for typing events
document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('chat-input');
    if (input) {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                chat.sendForm(e);
            } else {
                chat.handleTyping();
            }
        });
    }
});
