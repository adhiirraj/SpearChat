const app = {
    ws: new WebSocket("ws://localhost:8765"),

    mySecretKey: null,

    pkCache: {},
    pendingPkResolvers: {},

    init: () => {
        app.ws.onmessage = async (event) => {
            const message = JSON.parse(event.data);

            if (message.error) {
                return auth.handleError(message);
            }

            if (message.type === 'pk_response') {
                const resolver = app.pendingPkResolvers[message.username];
                if (resolver) {
                    delete app.pendingPkResolvers[message.username];
                    if (message.public_key) {
                        // Only cache valid keys, not nulls
                        app.pkCache[message.username] = message.public_key;
                        resolver.resolve(message.public_key);
                    } else {
                        resolver.reject(new Error(message.error || 'No public key'));
                    }
                }
                return;
            }

            if (message.type === 'dm') {
                // If no conversation is open yet, auto-select the sender
                if (!chat.activeRecipient) {
                    chat.loadDM(message.sender);
                }
                return chat.receive(message);
            }

            if (message.type === 'auth_success') {
                // fetch sidebar data
                app.ws.send(JSON.stringify({ type: 'fetch_sidebar' }));

                cryptoState.generateKeypair()
                    .then(keypair => {
                        app.mySecretKey = keypair.sk;
                        app.ws.send(JSON.stringify({
                            type: 'register_pk',
                            public_key: keypair.publicKeyBase64
                        }));
                    })
                    .catch(e => console.error('Keypair generation failed:', e));
                // auth.js handles showChat, fall through so handleSuccess runs
                return auth.handleSuccess(message);
            }

            if (message.type === 'sidebar_data') {
                ui.renderRoomList(message.rooms || []);
                ui.renderDMList(message.dms || []);
            }

            if (message.type === 'typing') {
                ui.showTypingIndicator(message.sender);
            }

            auth.handleSuccess(message);

        };
    },

    getRecipientPublicKey: (username) => {
        if (app.pkCache[username]) {
            return Promise.resolve(app.pkCache[username]);
        }
        return new Promise((resolve, reject) => {
            app.pendingPkResolvers[username] = { resolve, reject };
            app.ws.send(JSON.stringify({ type: 'get_pk', username }));
        });
    }
};

document.addEventListener('DOMContentLoaded', app.init);
