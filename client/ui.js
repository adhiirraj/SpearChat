const ui = {
    // --- Auth View ---
    switchAuthTab: (tabName) => {
        document.querySelectorAll('.auth-tabs button').forEach((btn) => {
            btn.classList.remove('active');
        });
        
        document.getElementById(`tab-${tabName}`).classList.add('active');
        document.getElementById('auth-submit-btn').textContent = tabName;
        auth.mode = tabName;
    },
    
    showError: (message) => {
        const errorElement = document.getElementById('auth-error');
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
    },
    
    showChat: (username) => {
        document.getElementById('auth-view').classList.add('hidden');
        document.getElementById('auth-view').classList.remove('active');
        document.getElementById('chat-view').classList.remove('hidden');
        document.getElementById('chat-view').classList.add('active');
    },

    // --- Sidebar Lists ---
    renderRoomList: (rooms) => {
        const section = document.getElementById('rooms-section');
        section.innerHTML = '';
        rooms.forEach(room => {
            const el = document.createElement('div');
            el.className = 'list-item';
            el.innerHTML = `
                <div class="avatar">${room.name.substring(0,2).toUpperCase()}</div>
                <div class="item-info">
                    <div class="item-name">${room.name}</div>
                    <div class="item-preview">${room.lastMessage || '...'}</div>
                </div>
            `;
            el.onclick = () => { /* loadRoom(room.id) to be wired in chat.js */ };
            section.appendChild(el);
        });
    },

    renderDMList: (dms) => {
        const section = document.getElementById('dms-section');
        section.innerHTML = '';
        dms.forEach(dm => {
            // Never show the logged-in user in their own DM list
            if (dm.username === auth.username) return;

            const el = document.createElement('div');
            el.className = 'list-item';
            el.innerHTML = `
                <div class="avatar">${dm.username.substring(0,2).toUpperCase()}</div>
                <div class="item-info">
                    <div class="item-name">${dm.username}</div>
                    <div class="item-preview">${dm.lastMessage || '...'}</div>
                </div>
            `;
            el.onclick = () => chat.loadDM(dm.username);
            section.appendChild(el);
        });
    },



    // --- Chat Panel ---
    setActiveChat: (name, memberCount) => {
        document.getElementById('active-chat-name').textContent = name;
        document.getElementById('active-chat-members').textContent = memberCount ? `${memberCount} MEMBERS` : 'DIRECT MESSAGE';
        document.getElementById('messages').innerHTML = ''; // clear messages on switch
    },

    appendMessage: (sender, content, timestamp, type = 'text', isSelf = false) => {
        const container = document.getElementById('messages');
        const messageDiv = document.createElement('div');
        
        messageDiv.className = `message ${isSelf ? 'sent' : 'received'}`;
        
        let contentHTML = `<div class="msg-bubble">${content}</div>`;
        if (type === 'file') {
            contentHTML = `<div class="msg-bubble">[FILE] ${content}</div>`;
        } else if (type === 'image') {
            contentHTML = `<div class="msg-bubble">[IMAGE] ${content}</div>`;
        }

        messageDiv.innerHTML = `
            ${contentHTML}
            <div class="msg-meta">
                <span>${sender}</span>
                <span>${timestamp || new Date().toLocaleTimeString()}</span>
            </div>
        `;
        
        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;
        return messageDiv; // for adding badges
    },

    renderMessages: (messages) => {
        document.getElementById('messages').innerHTML = '';
        messages.forEach(msg => {
            const isSelf = msg.sender === auth.username;
            ui.appendMessage(msg.sender, msg.content, msg.timestamp, msg.type, isSelf);
        });
    },

    showEncryptedBadge: (messageElement) => {
        const meta = messageElement.querySelector('.msg-meta');
        if (meta) {
            const badge = document.createElement('span');
            badge.className = 'badge';
            badge.textContent = 'E2EE';
            meta.appendChild(badge);
        }
    },

    // --- Typing Indicators ---
    typingTimeout: null,
    showTypingIndicator: (username) => {
        const indicator = document.getElementById('typing-indicator');
        indicator.textContent = `${username} IS TYPING...`;
        indicator.classList.remove('hidden');
        
        clearTimeout(ui.typingTimeout);
        ui.typingTimeout = setTimeout(() => {
            ui.hideTypingIndicator();
        }, 3000);
    },

    hideTypingIndicator: () => {
        document.getElementById('typing-indicator').classList.add('hidden');
    },

    // --- Right Panel ---
    renderMemberList: (members) => {
        const section = document.getElementById('members');
        section.innerHTML = '';
        members.forEach(member => {
            section.innerHTML += `
                <div class="member-row">
                    <div class="avatar">${member.username.substring(0,2).toUpperCase()}</div>
                    <span>${member.username} <small>(${member.role})</small></span>
                </div>
            `;
        });
    },

    renderFileList: (files) => {
        const section = document.getElementById('files');
        section.innerHTML = '';
        files.forEach(file => {
            section.innerHTML += `
                <div class="file-row">
                    <span>[FILE]</span>
                    <span>${file.name}</span>
                    <span class="badge">E2EE</span>
                </div>
            `;
        });
    }
};
