/**
 * EncryptionService
 * Provides secure encryption/decryption for API keys using Web Crypto API
 */
export class EncryptionService {
  constructor() {
    this.algorithm = 'AES-GCM'
    this.keyLength = 256
  }

  /**
   * Generate a cryptographic key for encryption/decryption
   * @returns {Promise<CryptoKey>}
   */
  async generateKey() {
    return await window.crypto.subtle.generateKey(
      {
        name: this.algorithm,
        length: this.keyLength,
      },
      true, // extractable
      ['encrypt', 'decrypt']
    )
  }

  /**
   * Derive a key from a password using PBKDF2
   * @param {string} password - User password or identifier
   * @param {Uint8Array} salt - Salt for key derivation
   * @returns {Promise<CryptoKey>}
   */
  async deriveKey(password, salt) {
    const encoder = new TextEncoder()
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    )

    return await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: this.algorithm, length: this.keyLength },
      true,
      ['encrypt', 'decrypt']
    )
  }

  /**
   * Encrypt data using AES-GCM
   * @param {string} data - Data to encrypt
   * @param {string} password - Password for key derivation
   * @returns {Promise<{encryptedData: string, salt: string, iv: string}>}
   */
  async encrypt(data, password = 'upnext-default-key') {
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)

    // Generate random salt and IV
    const salt = window.crypto.getRandomValues(new Uint8Array(16))
    const iv = window.crypto.getRandomValues(new Uint8Array(12))

    // Derive key from password
    const key = await this.deriveKey(password, salt)

    // Encrypt data
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: this.algorithm,
        iv: iv,
      },
      key,
      dataBuffer
    )

    // Convert to base64 for storage
    const encryptedData = this.arrayBufferToBase64(encryptedBuffer)
    const saltB64 = this.arrayBufferToBase64(salt)
    const ivB64 = this.arrayBufferToBase64(iv)

    return {
      encryptedData,
      salt: saltB64,
      iv: ivB64
    }
  }

  /**
   * Decrypt data using AES-GCM
   * @param {Object} encryptedPayload - Encrypted data payload
   * @param {string} password - Password for key derivation
   * @returns {Promise<string>}
   */
  async decrypt(encryptedPayload, password = 'upnext-default-key') {
    const { encryptedData, salt, iv } = encryptedPayload

    // Convert from base64
    const encryptedBuffer = this.base64ToArrayBuffer(encryptedData)
    const saltBuffer = this.base64ToArrayBuffer(salt)
    const ivBuffer = this.base64ToArrayBuffer(iv)

    // Derive key from password
    const key = await this.deriveKey(password, saltBuffer)

    try {
      // Decrypt data
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: this.algorithm,
          iv: ivBuffer,
        },
        key,
        encryptedBuffer
      )

      // Convert back to string
      const decoder = new TextDecoder()
      return decoder.decode(decryptedBuffer)
    } catch (error) {
      throw new Error('Decryption failed: Invalid password or corrupted data')
    }
  }

  /**
   * Convert ArrayBuffer to base64 string
   * @param {ArrayBuffer} buffer
   * @returns {string}
   */
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return window.btoa(binary)
  }

  /**
   * Convert base64 string to ArrayBuffer
   * @param {string} base64
   * @returns {ArrayBuffer}
   */
  base64ToArrayBuffer(base64) {
    const binaryString = window.atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes.buffer
  }

  /**
   * Check if Web Crypto API is available
   * @returns {boolean}
   */
  isSupported() {
    return window.crypto && window.crypto.subtle
  }
}