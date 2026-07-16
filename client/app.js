const app = {
    ws: new WebSocket("ws://localhost:8765"),
    
    init: () => {
        app.ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            
            if (message.error) {
                return auth.handleError(message);
            }
            
            if (message.type === 'dm') {
                return chat.receive(message);
            }
            
            auth.handleSuccess(message);
        };
    }
};

document.addEventListener('DOMContentLoaded', app.init);
