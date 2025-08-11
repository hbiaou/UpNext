import { EncryptionService } from './encryption-service'

/**
 * StorageService
 * Secure wrapper for localStorage with encryption
 */
export class StorageService {
  constructor() {
    this.encryptionService = new EncryptionService()
    this.keyPrefix = 'upnext_'
  }

  /**
   * Store encrypted data
   * @param {string} key - Storage key
   * @param {string} value - Value to encrypt and store
   * @param {string} password - Optional password for encryption
   * @returns {Promise<void>}
   */
  async setSecure(key, value, password) {
    try {
      const encryptedPayload = await this.encryptionService.encrypt(value, password)
      const storageKey = this.keyPrefix + key
      localStorage.setItem(storageKey, JSON.stringify(encryptedPayload))
    } catch (error) {
      console.error(`Error storing secure data for key ${key}:`, error)
      throw new Error(`Failed to store secure data: ${error.message}`)
    }
  }

  /**
   * Retrieve and decrypt data
   * @param {string} key - Storage key
   * @param {string} password - Optional password for decryption
   * @returns {Promise<string|null>}
   */
  async getSecure(key, password) {
    try {
      const storageKey = this.keyPrefix + key
      const encryptedData = localStorage.getItem(storageKey)
      
      if (!encryptedData) {
        return null
      }

      const encryptedPayload = JSON.parse(encryptedData)
      return await this.encryptionService.decrypt(encryptedPayload, password)
    } catch (error) {
      console.error(`Error retrieving secure data for key ${key}:`, error)
      return null
    }
  }

  /**
   * Store plain (unencrypted) data
   * @param {string} key - Storage key
   * @param {string|object} value - Value to store
   */
  set(key, value) {
    try {
      const storageKey = this.keyPrefix + key
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value)
      localStorage.setItem(storageKey, stringValue)
    } catch (error) {
      console.error(`Error storing data for key ${key}:`, error)
      throw new Error(`Failed to store data: ${error.message}`)
    }
  }

  /**
   * Retrieve plain (unencrypted) data
   * @param {string} key - Storage key
   * @param {*} defaultValue - Default value if key doesn't exist
   * @returns {string|object|null}
   */
  get(key, defaultValue = null) {
    try {
      const storageKey = this.keyPrefix + key
      const value = localStorage.getItem(storageKey)
      
      if (value === null) {
        return defaultValue
      }

      // Try to parse as JSON, fallback to string
      try {
        return JSON.parse(value)
      } catch {
        return value
      }
    } catch (error) {
      console.error(`Error retrieving data for key ${key}:`, error)
      return defaultValue
    }
  }

  /**
   * Remove data from storage
   * @param {string} key - Storage key
   */
  remove(key) {
    try {
      const storageKey = this.keyPrefix + key
      localStorage.removeItem(storageKey)
    } catch (error) {
      console.error(`Error removing data for key ${key}:`, error)
    }
  }

  /**
   * Check if key exists
   * @param {string} key - Storage key
   * @returns {boolean}
   */
  has(key) {
    const storageKey = this.keyPrefix + key
    return localStorage.getItem(storageKey) !== null
  }

  /**
   * Clear all UpNext data from storage
   */
  clear() {
    try {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith(this.keyPrefix)) {
          localStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.error('Error clearing storage:', error)
    }
  }

  /**
   * Get storage usage information
   * @returns {Object} Storage usage stats
   */
  getUsageInfo() {
    try {
      const keys = Object.keys(localStorage)
      const upNextKeys = keys.filter(key => key.startsWith(this.keyPrefix))
      
      let totalSize = 0
      const keyInfo = {}
      
      upNextKeys.forEach(key => {
        const value = localStorage.getItem(key)
        const size = new Blob([value]).size
        totalSize += size
        keyInfo[key.replace(this.keyPrefix, '')] = {
          size: size,
          sizeFormatted: this.formatBytes(size)
        }
      })

      return {
        totalKeys: upNextKeys.length,
        totalSize: totalSize,
        totalSizeFormatted: this.formatBytes(totalSize),
        keys: keyInfo,
        available: this.isStorageAvailable()
      }
    } catch (error) {
      console.error('Error getting storage usage info:', error)
      return null
    }
  }

  /**
   * Format bytes into human readable format
   * @param {number} bytes - Bytes to format
   * @returns {string} Formatted string
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * Check if localStorage is available
   * @returns {boolean}
   */
  isStorageAvailable() {
    try {
      const testKey = this.keyPrefix + 'test'
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Export all UpNext data for backup
   * @returns {Promise<Object>} Exported data
   */
  async exportAll() {
    try {
      const keys = Object.keys(localStorage)
      const upNextKeys = keys.filter(key => key.startsWith(this.keyPrefix))
      
      const data = {
        exported: new Date().toISOString(),
        version: 1,
        data: {}
      }

      for (const key of upNextKeys) {
        const cleanKey = key.replace(this.keyPrefix, '')
        const value = localStorage.getItem(key)
        
        // Try to parse as JSON to detect encrypted payloads
        try {
          const parsed = JSON.parse(value)
          if (parsed.encryptedData && parsed.salt && parsed.iv) {
            // This is encrypted data - mark it as such
            data.data[cleanKey] = {
              type: 'encrypted',
              value: parsed
            }
          } else {
            // Regular JSON data
            data.data[cleanKey] = {
              type: 'json',
              value: parsed
            }
          }
        } catch {
          // Plain string data
          data.data[cleanKey] = {
            type: 'string',
            value: value
          }
        }
      }

      return data
    } catch (error) {
      console.error('Error exporting data:', error)
      throw new Error(`Failed to export data: ${error.message}`)
    }
  }

  /**
   * Import data from backup
   * @param {Object} data - Exported data
   * @param {boolean} overwrite - Whether to overwrite existing data
   * @returns {Promise<void>}
   */
  async importAll(data, overwrite = false) {
    try {
      if (!data || !data.data) {
        throw new Error('Invalid data format')
      }

      const entries = Object.entries(data.data)
      
      for (const [key, item] of entries) {
        const storageKey = this.keyPrefix + key
        
        // Skip if key exists and not overwriting
        if (!overwrite && localStorage.getItem(storageKey)) {
          continue
        }

        // Restore data based on type
        switch (item.type) {
          case 'encrypted':
            localStorage.setItem(storageKey, JSON.stringify(item.value))
            break
          case 'json':
            localStorage.setItem(storageKey, JSON.stringify(item.value))
            break
          case 'string':
            localStorage.setItem(storageKey, item.value)
            break
          default:
            console.warn(`Unknown data type: ${item.type} for key: ${key}`)
        }
      }
    } catch (error) {
      console.error('Error importing data:', error)
      throw new Error(`Failed to import data: ${error.message}`)
    }
  }
}