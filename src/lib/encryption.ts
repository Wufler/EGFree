// AI generated this, thanks!

const encoder = new TextEncoder()
const decoder = new TextDecoder()

const PASSPHRASE = process.env.ENCRYPTION_KEY

function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    bytes.forEach((b) => (binary += String.fromCharCode(b)))
    return window.btoa(binary)
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = window.atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
    }
    return bytes.buffer
}

async function deriveKey(): Promise<CryptoKey> {
    const passphraseKey = await crypto.subtle.importKey(
        'raw',
        encoder.encode(PASSPHRASE),
        'PBKDF2',
        false,
        ['deriveKey']
    )

    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: encoder.encode('unique-salt'),
            iterations: 100000,
            hash: 'SHA-256',
        },
        passphraseKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    )
}

export async function encrypt(text: string): Promise<string> {
    if (!text) return ''

    try {
        const key = await deriveKey()
        const iv = crypto.getRandomValues(new Uint8Array(12))
        const encrypted = await crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv,
            },
            key,
            encoder.encode(text)
        )
        const combined = new Uint8Array(iv.length + encrypted.byteLength)
        combined.set(iv, 0)
        combined.set(new Uint8Array(encrypted), iv.length)
        return arrayBufferToBase64(combined.buffer)
    } catch (error) {
        console.error('Encryption failed:', error)
        return ''
    }
}

export async function decrypt(encryptedText: string): Promise<string> {
    if (!encryptedText) return ''

    try {
        const combinedBuffer = base64ToArrayBuffer(encryptedText)
        const combined = new Uint8Array(combinedBuffer)
        const iv = combined.slice(0, 12)
        const data = combined.slice(12)
        const key = await deriveKey()
        const decrypted = await crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv,
            },
            key,
            data
        )
        return decoder.decode(decrypted)
    } catch (error) {
        console.error('Decryption failed:', error)
        return ''
    }
}