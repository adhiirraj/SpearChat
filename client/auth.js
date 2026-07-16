const auth = {
    mode: 'login',
    token: null,
    username: null,
    
    submit: (event) => {
        event.preventDefault();
        
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');
        
        app.ws.send(JSON.stringify({
            type: auth.mode,
            username: usernameInput.value,
            password: passwordInput.value
        }));
    },
    
    handleSuccess: (message) => {
        if (message.type === 'register_success') {
            ui.switchAuthTab('login');
        }
        
        if (message.type === 'login_success') {
            const usernameInput = document.getElementById('username');
            auth.token = message.token;
            auth.username = usernameInput.value;
            
            app.ws.send(JSON.stringify({
                type: 'auth',
                token: auth.token
            }));
        }
        
        if (message.type === 'auth_success') {
            ui.showChat(auth.username);
        }
    },
    
    handleError: (message) => {
        ui.showError(message.error);
    }
};