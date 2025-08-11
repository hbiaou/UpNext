/**
 * AIProviderService
 * Abstracts different AI provider APIs (OpenAI, Anthropic, custom endpoints)
 */
export class AIProviderService {
  constructor(encryptionService) {
    this.encryptionService = encryptionService
    this.providers = {
      openai: {
        name: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
        defaultModel: 'gpt-4'
      },
      anthropic: {
        name: 'Anthropic',
        baseUrl: 'https://api.anthropic.com/v1',
        models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
        defaultModel: 'claude-3-sonnet-20240229'
      },
      custom: {
        name: 'Custom',
        baseUrl: '',
        models: ['custom-model'],
        defaultModel: 'custom-model'
      }
    }
  }

  /**
   * Get available providers
   * @returns {Object}
   */
  getProviders() {
    return this.providers
  }

  /**
   * Send a message to the AI provider
   * @param {string} provider - Provider key ('openai', 'anthropic', 'custom')
   * @param {Object} options - Request options
   * @returns {Promise<string>}
   */
  async sendMessage(provider, options = {}) {
    const {
      message,
      model = this.providers[provider]?.defaultModel,
      temperature = 0.7,
      maxTokens = 1000,
      systemPrompt = null
    } = options

    if (!this.providers[provider]) {
      throw new Error(`Unsupported provider: ${provider}`)
    }

    const apiKey = await this.getApiKey(provider)
    if (!apiKey) {
      throw new Error(`API key not configured for ${provider}`)
    }

    switch (provider) {
      case 'openai':
        return await this.sendOpenAIMessage(apiKey, model, message, systemPrompt, temperature, maxTokens)
      case 'anthropic':
        return await this.sendAnthropicMessage(apiKey, model, message, systemPrompt, temperature, maxTokens)
      case 'custom':
        return await this.sendCustomMessage(apiKey, model, message, systemPrompt, temperature, maxTokens)
      default:
        throw new Error(`Provider ${provider} not implemented`)
    }
  }

  /**
   * Send message to OpenAI API
   */
  async sendOpenAIMessage(apiKey, model, message, systemPrompt, temperature, maxTokens) {
    const messages = []
    
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt })
    }
    
    messages.push({ role: 'user', content: message })

    const response = await fetch(`${this.providers.openai.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: temperature,
        max_tokens: maxTokens
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`OpenAI API error: ${response.status} ${errorData.error?.message || response.statusText}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || 'No response received'
  }

  /**
   * Send message to Anthropic API
   */
  async sendAnthropicMessage(apiKey, model, message, systemPrompt, temperature, maxTokens) {
    const requestBody = {
      model: model,
      max_tokens: maxTokens,
      temperature: temperature,
      messages: [{ role: 'user', content: message }]
    }

    if (systemPrompt) {
      requestBody.system = systemPrompt
    }

    const response = await fetch(`${this.providers.anthropic.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Anthropic API error: ${response.status} ${errorData.error?.message || response.statusText}`)
    }

    const data = await response.json()
    return data.content[0]?.text || 'No response received'
  }

  /**
   * Send message to custom endpoint
   */
  async sendCustomMessage(apiKey, model, message, systemPrompt, temperature, maxTokens) {
    const settings = await this.getCustomSettings()
    const baseUrl = settings?.baseUrl || this.providers.custom.baseUrl

    if (!baseUrl) {
      throw new Error('Custom endpoint URL not configured')
    }

    // Assume OpenAI-compatible format for custom endpoints
    const messages = []
    
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt })
    }
    
    messages.push({ role: 'user', content: message })

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: temperature,
        max_tokens: maxTokens
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Custom API error: ${response.status} ${errorData.error?.message || response.statusText}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || 'No response received'
  }

  /**
   * Send streaming message to AI provider
   * @param {string} provider - Provider key
   * @param {Object} options - Request options
   * @param {Function} onChunk - Callback for streaming chunks
   * @returns {Promise<void>}
   */
  async sendStreamingMessage(provider, options = {}, onChunk) {
    const {
      message,
      model = this.providers[provider]?.defaultModel,
      temperature = 0.7,
      maxTokens = 1000,
      systemPrompt = null
    } = options

    if (!this.providers[provider]) {
      throw new Error(`Unsupported provider: ${provider}`)
    }

    const apiKey = await this.getApiKey(provider)
    if (!apiKey) {
      throw new Error(`API key not configured for ${provider}`)
    }

    switch (provider) {
      case 'openai':
        return await this.streamOpenAI(apiKey, model, message, systemPrompt, temperature, maxTokens, onChunk)
      case 'anthropic':
        return await this.streamAnthropic(apiKey, model, message, systemPrompt, temperature, maxTokens, onChunk)
      case 'custom':
        return await this.streamCustom(apiKey, model, message, systemPrompt, temperature, maxTokens, onChunk)
      default:
        throw new Error(`Streaming not implemented for ${provider}`)
    }
  }

  /**
   * Stream OpenAI response
   */
  async streamOpenAI(apiKey, model, message, systemPrompt, temperature, maxTokens, onChunk) {
    const messages = []
    
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt })
    }
    
    messages.push({ role: 'user', content: message })

    const response = await fetch(`${this.providers.openai.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: temperature,
        max_tokens: maxTokens,
        stream: true
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`OpenAI API error: ${response.status} ${errorData.error?.message || response.statusText}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') return
            
            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices[0]?.delta?.content
              if (content) {
                onChunk(content)
              }
            } catch (e) {
              // Ignore parsing errors for incomplete chunks
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  /**
   * Stream Anthropic response
   */
  async streamAnthropic(apiKey, model, message, systemPrompt, temperature, maxTokens, onChunk) {
    // Anthropic streaming implementation would go here
    // For now, fall back to non-streaming
    const response = await this.sendAnthropicMessage(apiKey, model, message, systemPrompt, temperature, maxTokens)
    onChunk(response)
  }

  /**
   * Stream custom endpoint response
   */
  async streamCustom(apiKey, model, message, systemPrompt, temperature, maxTokens, onChunk) {
    // Custom streaming implementation would go here
    // For now, fall back to non-streaming
    const response = await this.sendCustomMessage(apiKey, model, message, systemPrompt, temperature, maxTokens)
    onChunk(response)
  }

  /**
   * Test API connection
   * @param {string} provider - Provider key
   * @returns {Promise<boolean>}
   */
  async testConnection(provider) {
    try {
      const response = await this.sendMessage(provider, {
        message: 'Test connection',
        maxTokens: 10
      })
      return !!response
    } catch (error) {
      console.error(`Connection test failed for ${provider}:`, error)
      return false
    }
  }

  /**
   * Get API key for provider
   * @param {string} provider
   * @returns {Promise<string|null>}
   */
  async getApiKey(provider) {
    try {
      const encryptedKey = localStorage.getItem(`upnext_api_key_${provider}`)
      if (!encryptedKey) return null

      const encryptedPayload = JSON.parse(encryptedKey)
      return await this.encryptionService.decrypt(encryptedPayload)
    } catch (error) {
      console.error(`Error retrieving API key for ${provider}:`, error)
      return null
    }
  }

  /**
   * Set API key for provider
   * @param {string} provider
   * @param {string} apiKey
   * @returns {Promise<void>}
   */
  async setApiKey(provider, apiKey) {
    try {
      const encryptedPayload = await this.encryptionService.encrypt(apiKey)
      localStorage.setItem(`upnext_api_key_${provider}`, JSON.stringify(encryptedPayload))
    } catch (error) {
      console.error(`Error storing API key for ${provider}:`, error)
      throw error
    }
  }

  /**
   * Remove API key for provider
   * @param {string} provider
   * @returns {void}
   */
  removeApiKey(provider) {
    localStorage.removeItem(`upnext_api_key_${provider}`)
  }

  /**
   * Get custom endpoint settings
   * @returns {Promise<Object|null>}
   */
  async getCustomSettings() {
    try {
      const encryptedSettings = localStorage.getItem('upnext_custom_settings')
      if (!encryptedSettings) return null

      const encryptedPayload = JSON.parse(encryptedSettings)
      const settingsJson = await this.encryptionService.decrypt(encryptedPayload)
      return JSON.parse(settingsJson)
    } catch (error) {
      console.error('Error retrieving custom settings:', error)
      return null
    }
  }

  /**
   * Set custom endpoint settings
   * @param {Object} settings
   * @returns {Promise<void>}
   */
  async setCustomSettings(settings) {
    try {
      const settingsJson = JSON.stringify(settings)
      const encryptedPayload = await this.encryptionService.encrypt(settingsJson)
      localStorage.setItem('upnext_custom_settings', JSON.stringify(encryptedPayload))
    } catch (error) {
      console.error('Error storing custom settings:', error)
      throw error
    }
  }
}