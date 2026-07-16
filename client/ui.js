const ui = {
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
        document.getElementById('auth-view').classList.remove('active');
        document.getElementById('chat-view').classList.add('active');
    },
    
    appendMessage: (sender, text, isSelf) => {
        const container = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        
        messageDiv.className = `message ${isSelf ? 'sent' : 'received'}`;
        
        const senderElement = document.createElement('b');
        senderElement.textContent = sender;
        
        const textElement = document.createElement('div');
        textElement.textContent = text;
        
        messageDiv.appendChild(senderElement);
        messageDiv.appendChild(textElement);
        
        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;
    }
};
