/**
 * crypto.js -- Phase 3 E2EE
 *
 * Uses:
 *   - WebCrypto API ECDH (acting as KEM)
 *   - WebCrypto API AES-256-GCM (built-in)
 *
 * Secret keys NEVER leave the browser tab.
 */

const cryptoState = (() => {
    // -- Base64 Helpers
    function toBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }

    function fromBase64(base64) {
        const binary_string = window.atob(base64);
        const len = binary_string.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binary_string.charCodeAt(i);
        }
        return bytes.buffer;
    }

    const curve = 'P-256';

    // -- Keypair generation
    async function generateKeypair() {
        const keyPair = await window.crypto.subtle.generateKey(
            { name: "ECDH", namedCurve: curve },
            true,
            ["deriveBits"]
        );
        const publicKeyBuffer = await window.crypto.subtle.exportKey("raw", keyPair.publicKey);
        
        return {
            pk: new Uint8Array(publicKeyBuffer),
            sk: keyPair.privateKey, // CryptoKey object
            publicKeyBase64: toBase64(publicKeyBuffer)
        };
    }

    // -- Encapsulation
    async function encapsulate(recipientPublicKeyBase64) {
        const recipientPKBuffer = fromBase64(recipientPublicKeyBase64);
        const recipientKey = await window.crypto.subtle.importKey(
            "raw",
            recipientPKBuffer,
            { name: "ECDH", namedCurve: curve },
            true,
            []
        );

        // Generate ephemeral keypair
        const ephemKeyPair = await window.crypto.subtle.generateKey(
            { name: "ECDH", namedCurve: curve },
            true,
            ["deriveBits"]
        );
        const ephemPublicKeyBuffer = await window.crypto.subtle.exportKey("raw", ephemKeyPair.publicKey);

        // Derive shared secret
        const sharedSecretBuffer = await window.crypto.subtle.deriveBits(
            { name: "ECDH", public: recipientKey },
            ephemKeyPair.privateKey,
            256
        );

        return {
            ciphertext: toBase64(ephemPublicKeyBuffer),
            sharedSecret: new Uint8Array(sharedSecretBuffer)
        };
    }

    // -- Decapsulation
    async function decapsulate(kyberCiphertextBase64, secretKey) {
        const ephemPKBuffer = fromBase64(kyberCiphertextBase64);
        const ephemKey = await window.crypto.subtle.importKey(
            "raw",
            ephemPKBuffer,
            { name: "ECDH", namedCurve: curve },
            true,
            []
        );

        const sharedSecretBuffer = await window.crypto.subtle.deriveBits(
            { name: "ECDH", public: ephemKey },
            secretKey,
            256
        );

        return new Uint8Array(sharedSecretBuffer);
    }

    // -- AES Key Derivation
    async function deriveAESKey(sharedSecret) {
        return await window.crypto.subtle.importKey(
            'raw',
            sharedSecret,
            { name: 'AES-GCM' },
            false,
            ['encrypt', 'decrypt']
        );
    }

    // -- Encrypt
    async function encryptMessage(plaintext, recipientPublicKeyBase64) {
        const { ciphertext: kyberCT, sharedSecret } = await encapsulate(recipientPublicKeyBase64);
        
        const aesKey = await deriveAESKey(sharedSecret);
        
        const nonce = window.crypto.getRandomValues(new Uint8Array(12));
        const encodedPlaintext = new TextEncoder().encode(plaintext);
        
        const ciphertextBytes = await window.crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: nonce },
            aesKey,
            encodedPlaintext
        );

        return {
            kyberCiphertext: kyberCT,
            ciphertext: toBase64(ciphertextBytes),
            nonce: toBase64(nonce)
        };
    }

    // -- Decrypt
    async function decryptMessage(kyberCiphertextBase64, ciphertextBase64, nonceBase64, secretKey) {
        const sharedSecret = await decapsulate(kyberCiphertextBase64, secretKey);
        
        const aesKey = await deriveAESKey(sharedSecret);
        
        const ciphertext = fromBase64(ciphertextBase64);
        const nonce = fromBase64(nonceBase64);
        
        const plaintextBytes = await window.crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: nonce },
            aesKey,
            ciphertext
        );

        return new TextDecoder().decode(plaintextBytes);
    }

    // -- Public API
    return {
        generateKeypair,
        encryptMessage,
        decryptMessage,
        toBase64,
        fromBase64
    };
})();
