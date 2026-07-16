const chat = {
    sendForm: (event) => {
        event.preventDefault();
        
        const input = document.getElementById('chat-input');
        
        if (input.value) {
            ui.appendMessage(auth.username, input.value, true);
        }
        
        input.value = '';
    },
    
    receive: (message) => {
        ui.appendMessage(message.sender, "(Encrypted)", false);
    }
};
