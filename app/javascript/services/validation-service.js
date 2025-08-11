/**
 * ValidationService
 * Handles API connection testing and validation
 */
export class ValidationService {
  constructor(aiProviderService) {
    this.aiProviderService = aiProviderService
  }

  /**
   * Validate API key format
   * @param {string} provider - Provider key
   * @param {string} apiKey - API key to validate
   * @returns {Object} Validation result
   */
  validateApiKeyFormat(provider, apiKey) {
    const result = {
      isValid: false,
      error: null,
      warnings: []
    }

    if (!apiKey || typeof apiKey !== 'string') {
      result.error = 'API key is required'
      return result
    }

    const trimmedKey = apiKey.trim()
    
    if (trimmedKey.length === 0) {
      result.error = 'API key cannot be empty'
      return result
    }

    switch (provider) {
      case 'openai':
        return this.validateOpenAIKey(trimmedKey)
      case 'anthropic':
        return this.validateAnthropicKey(trimmedKey)
      case 'custom':
        return this.validateCustomKey(trimmedKey)
      default:
        result.error = `Unknown provider: ${provider}`
        return result
    }
  }

  /**
   * Validate OpenAI API key format
   * @param {string} apiKey - OpenAI API key
   * @returns {Object} Validation result
   */
  validateOpenAIKey(apiKey) {
    const result = { isValid: false, error: null, warnings: [] }

    // OpenAI keys typically start with "sk-" and are 51 characters long
    if (!apiKey.startsWith('sk-')) {
      result.warnings.push('OpenAI API keys typically start with "sk-"')
    }

    if (apiKey.length < 40) {
      result.error = 'API key appears too short for OpenAI format'
      return result
    }

    if (apiKey.length > 60) {
      result.warnings.push('API key appears longer than typical OpenAI format')
    }

    // Check for suspicious patterns
    if (apiKey.includes(' ')) {
      result.error = 'API key should not contain spaces'
      return result
    }

    result.isValid = true
    return result
  }

  /**
   * Validate Anthropic API key format
   * @param {string} apiKey - Anthropic API key
   * @returns {Object} Validation result
   */
  validateAnthropicKey(apiKey) {
    const result = { isValid: false, error: null, warnings: [] }

    // Anthropic keys typically start with "sk-ant-"
    if (!apiKey.startsWith('sk-ant-')) {
      result.warnings.push('Anthropic API keys typically start with "sk-ant-"')
    }

    if (apiKey.length < 40) {
      result.error = 'API key appears too short for Anthropic format'
      return result
    }

    // Check for suspicious patterns
    if (apiKey.includes(' ')) {
      result.error = 'API key should not contain spaces'
      return result
    }

    result.isValid = true
    return result
  }

  /**
   * Validate custom API key format
   * @param {string} apiKey - Custom API key
   * @returns {Object} Validation result
   */
  validateCustomKey(apiKey) {
    const result = { isValid: false, error: null, warnings: [] }

    if (apiKey.length < 8) {
      result.error = 'API key appears too short'
      return result
    }

    // Check for suspicious patterns
    if (apiKey.includes(' ')) {
      result.error = 'API key should not contain spaces'
      return result
    }

    result.isValid = true
    return result
  }

  /**
   * Validate custom endpoint URL
   * @param {string} url - Endpoint URL
   * @returns {Object} Validation result
   */
  validateEndpointUrl(url) {
    const result = { isValid: false, error: null, warnings: [] }

    if (!url || typeof url !== 'string') {
      result.error = 'URL is required'
      return result
    }

    const trimmedUrl = url.trim()
    
    if (trimmedUrl.length === 0) {
      result.error = 'URL cannot be empty'
      return result
    }

    try {
      const urlObj = new URL(trimmedUrl)
      
      // Check protocol
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        result.error = 'URL must use HTTP or HTTPS protocol'
        return result
      }

      // Warn about non-HTTPS
      if (urlObj.protocol === 'http:') {
        result.warnings.push('Consider using HTTPS for better security')
      }

      // Check for localhost or development URLs
      if (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1') {
        result.warnings.push('This appears to be a local development URL')
      }

      // Check for common API patterns
      if (!urlObj.pathname.includes('/v1') && !urlObj.pathname.includes('/api')) {
        result.warnings.push('URL should typically include /v1 or /api in the path')
      }

      result.isValid = true
      return result
    } catch (error) {
      result.error = 'Invalid URL format'
      return result
    }
  }

  /**
   * Test API connection with comprehensive error handling
   * @param {string} provider - Provider key
   * @param {Object} options - Test options
   * @returns {Promise<Object>} Test result
   */
  async testConnection(provider, options = {}) {
    const result = {
      success: false,
      error: null,
      warnings: [],
      responseTime: null,
      details: {}
    }

    const startTime = Date.now()

    try {
      // First validate the API key format
      const apiKey = await this.aiProviderService.getApiKey(provider)
      if (!apiKey) {
        result.error = 'No API key configured for this provider'
        return result
      }

      const keyValidation = this.validateApiKeyFormat(provider, apiKey)
      if (!keyValidation.isValid) {
        result.error = keyValidation.error
        result.warnings = keyValidation.warnings
        return result
      }

      result.warnings = keyValidation.warnings

      // For custom provider, validate endpoint URL
      if (provider === 'custom') {
        const customSettings = await this.aiProviderService.getCustomSettings()
        if (!customSettings || !customSettings.baseUrl) {
          result.error = 'Custom endpoint URL not configured'
          return result
        }

        const urlValidation = this.validateEndpointUrl(customSettings.baseUrl)
        if (!urlValidation.isValid) {
          result.error = urlValidation.error
          return result
        }

        result.warnings.push(...urlValidation.warnings)
      }

      // Perform the actual connection test
      const testResponse = await this.performConnectionTest(provider, options)
      
      result.responseTime = Date.now() - startTime
      result.success = testResponse.success
      result.details = testResponse.details

      if (!testResponse.success) {
        result.error = testResponse.error
      }

    } catch (error) {
      result.responseTime = Date.now() - startTime
      result.error = this.parseApiError(error)
      result.details.originalError = error.message
    }

    return result
  }

  /**
   * Perform the actual connection test
   * @param {string} provider - Provider key
   * @param {Object} options - Test options
   * @returns {Promise<Object>} Test response
   */
  async performConnectionTest(provider, options = {}) {
    const testMessage = options.testMessage || 'Test'
    const maxTokens = options.maxTokens || 5

    try {
      const response = await this.aiProviderService.sendMessage(provider, {
        message: testMessage,
        maxTokens: maxTokens,
        temperature: 0.1
      })

      return {
        success: true,
        details: {
          responseLength: response.length,
          hasResponse: !!response.trim()
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        details: {
          errorType: this.classifyApiError(error)
        }
      }
    }
  }

  /**
   * Parse and categorize API errors
   * @param {Error} error - Error object
   * @returns {string} User-friendly error message
   */
  parseApiError(error) {
    const message = error.message.toLowerCase()

    // Authentication errors
    if (message.includes('unauthorized') || message.includes('invalid api key') || message.includes('401')) {
      return 'Invalid API key. Please check your API key and try again.'
    }

    // Rate limiting
    if (message.includes('rate limit') || message.includes('429')) {
      return 'Rate limit exceeded. Please wait a moment and try again.'
    }

    // Quota/billing issues
    if (message.includes('quota') || message.includes('billing') || message.includes('usage')) {
      return 'API quota exceeded or billing issue. Check your account status.'
    }

    // Network errors
    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return 'Network error. Please check your internet connection and try again.'
    }

    // Server errors
    if (message.includes('500') || message.includes('502') || message.includes('503')) {
      return 'Server error. The API service may be temporarily unavailable.'
    }

    // Model not found
    if (message.includes('model') && message.includes('not found')) {
      return 'Selected model not available. Try choosing a different model.'
    }

    // Generic API error
    if (message.includes('api')) {
      return `API Error: ${error.message}`
    }

    // Default
    return `Connection failed: ${error.message}`
  }

  /**
   * Classify API error type
   * @param {Error} error - Error object
   * @returns {string} Error classification
   */
  classifyApiError(error) {
    const message = error.message.toLowerCase()

    if (message.includes('401') || message.includes('unauthorized')) return 'authentication'
    if (message.includes('429') || message.includes('rate limit')) return 'rate_limit'
    if (message.includes('quota') || message.includes('billing')) return 'quota'
    if (message.includes('network') || message.includes('fetch')) return 'network'
    if (message.includes('5')) return 'server_error'
    if (message.includes('model')) return 'model_error'
    
    return 'unknown'
  }

  /**
   * Get provider-specific health status
   * @param {string} provider - Provider key
   * @returns {Promise<Object>} Health status
   */
  async getProviderHealth(provider) {
    const health = {
      provider: provider,
      status: 'unknown',
      lastTested: null,
      responseTime: null,
      error: null
    }

    try {
      const testResult = await this.testConnection(provider, { maxTokens: 1 })
      
      health.status = testResult.success ? 'healthy' : 'unhealthy'
      health.lastTested = new Date().toISOString()
      health.responseTime = testResult.responseTime
      health.error = testResult.error

    } catch (error) {
      health.status = 'error'
      health.error = error.message
      health.lastTested = new Date().toISOString()
    }

    return health
  }
}