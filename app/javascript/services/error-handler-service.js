/**
 * ErrorHandlerService
 * Centralized error handling for API failures and application errors
 */
export class ErrorHandlerService {
  constructor() {
    this.errorHistory = []
    this.maxHistorySize = 50
    this.retryAttempts = new Map()
    this.maxRetryAttempts = 3
    this.retryDelay = 1000 // 1 second
  }

  /**
   * Handle and categorize errors
   * @param {Error} error - Error object
   * @param {Object} context - Error context
   * @returns {Object} Processed error information
   */
  handleError(error, context = {}) {
    const errorInfo = {
      id: this.generateErrorId(),
      timestamp: new Date().toISOString(),
      type: this.categorizeError(error),
      message: error.message,
      userMessage: this.getUserFriendlyMessage(error),
      context: context,
      stack: error.stack,
      retry: this.shouldRetry(error, context),
      severity: this.getSeverity(error)
    }

    // Add to error history
    this.addToHistory(errorInfo)

    // Log error for debugging
    this.logError(errorInfo)

    return errorInfo
  }

  /**
   * Categorize error type
   * @param {Error} error - Error object
   * @returns {string} Error category
   */
  categorizeError(error) {
    const message = error.message.toLowerCase()

    // Network/Connection errors
    if (message.includes('fetch') || 
        message.includes('network') || 
        message.includes('connection') ||
        message.includes('timeout')) {
      return 'network'
    }

    // Authentication errors
    if (message.includes('401') || 
        message.includes('unauthorized') || 
        message.includes('invalid api key') ||
        message.includes('authentication')) {
      return 'authentication'
    }

    // Rate limiting
    if (message.includes('429') || 
        message.includes('rate limit') ||
        message.includes('too many requests')) {
      return 'rate_limit'
    }

    // Quota/billing
    if (message.includes('quota') || 
        message.includes('billing') || 
        message.includes('usage') ||
        message.includes('credit')) {
      return 'quota'
    }

    // Server errors
    if (message.includes('500') || 
        message.includes('502') || 
        message.includes('503') ||
        message.includes('server error')) {
      return 'server_error'
    }

    // Model/API specific errors
    if (message.includes('model') || 
        message.includes('parameter') ||
        message.includes('invalid request')) {
      return 'api_error'
    }

    // Client-side errors
    if (message.includes('cors') || 
        message.includes('blocked') ||
        message.includes('permission')) {
      return 'client_error'
    }

    // Data/validation errors
    if (message.includes('validation') || 
        message.includes('invalid data') ||
        message.includes('parse')) {
      return 'validation'
    }

    // Storage errors
    if (message.includes('storage') || 
        message.includes('quota exceeded') ||
        message.includes('indexeddb')) {
      return 'storage'
    }

    return 'unknown'
  }

  /**
   * Get user-friendly error message
   * @param {Error} error - Error object
   * @returns {string} User-friendly message
   */
  getUserFriendlyMessage(error) {
    const type = this.categorizeError(error)

    const messages = {
      network: 'Unable to connect to the AI service. Please check your internet connection and try again.',
      authentication: 'API key is invalid or expired. Please check your settings and update your API key.',
      rate_limit: 'Too many requests to the AI service. Please wait a moment before trying again.',
      quota: 'API usage limit reached. Please check your account billing and usage limits.',
      server_error: 'The AI service is temporarily unavailable. Please try again in a few minutes.',
      api_error: 'Invalid request to the AI service. Please try a different message or check your settings.',
      client_error: 'Browser security restrictions are blocking the request. Try using HTTPS or check CORS settings.',
      validation: 'Invalid input provided. Please check your message and try again.',
      storage: 'Browser storage is full or unavailable. Try clearing some data or using a different browser.',
      unknown: 'An unexpected error occurred. Please try again or contact support if the problem persists.'
    }

    return messages[type] || messages.unknown
  }

  /**
   * Determine error severity
   * @param {Error} error - Error object
   * @returns {string} Severity level
   */
  getSeverity(error) {
    const type = this.categorizeError(error)

    const severityMap = {
      network: 'medium',
      authentication: 'high',
      rate_limit: 'low',
      quota: 'high',
      server_error: 'medium',
      api_error: 'medium',
      client_error: 'high',
      validation: 'low',
      storage: 'high',
      unknown: 'medium'
    }

    return severityMap[type] || 'medium'
  }

  /**
   * Determine if error should be retried
   * @param {Error} error - Error object
   * @param {Object} context - Error context
   * @returns {boolean} Whether to retry
   */
  shouldRetry(error, context = {}) {
    const type = this.categorizeError(error)
    const contextKey = context.operation || 'default'

    // Check if we've exceeded retry attempts
    const attempts = this.retryAttempts.get(contextKey) || 0
    if (attempts >= this.maxRetryAttempts) {
      return false
    }

    // Determine retry based on error type
    const retryableTypes = ['network', 'server_error', 'rate_limit']
    return retryableTypes.includes(type)
  }

  /**
   * Execute operation with retry logic
   * @param {Function} operation - Operation to execute
   * @param {Object} context - Operation context
   * @returns {Promise<any>} Operation result
   */
  async withRetry(operation, context = {}) {
    const contextKey = context.operation || 'default'
    const maxAttempts = context.maxRetries || this.maxRetryAttempts
    const delay = context.retryDelay || this.retryDelay

    let lastError = null
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // Reset retry count on success
        this.retryAttempts.delete(contextKey)
        return await operation()
      } catch (error) {
        lastError = error
        this.retryAttempts.set(contextKey, attempt)

        const errorInfo = this.handleError(error, { ...context, attempt })

        // Don't retry if error is not retryable
        if (!this.shouldRetry(error, context)) {
          throw error
        }

        // Don't retry on last attempt
        if (attempt === maxAttempts) {
          throw error
        }

        // Wait before retry with exponential backoff
        const waitTime = delay * Math.pow(2, attempt - 1)
        await this.sleep(waitTime)
      }
    }

    throw lastError
  }

  /**
   * Handle API response errors
   * @param {Response} response - Fetch response
   * @returns {Promise<Error>} Parsed error
   */
  async handleApiResponse(response) {
    if (response.ok) {
      return null
    }

    let errorMessage = `HTTP ${response.status}: ${response.statusText}`
    let errorDetails = {}

    try {
      const errorData = await response.json()
      
      // OpenAI error format
      if (errorData.error) {
        errorMessage = errorData.error.message || errorMessage
        errorDetails = errorData.error
      }
      
      // Anthropic error format
      else if (errorData.message) {
        errorMessage = errorData.message
        errorDetails = errorData
      }
      
      // Generic error format
      else {
        errorDetails = errorData
      }
    } catch (parseError) {
      // If we can't parse the error response, use the status text
      errorDetails = { statusText: response.statusText }
    }

    const error = new Error(errorMessage)
    error.status = response.status
    error.details = errorDetails
    
    return error
  }

  /**
   * Recovery suggestions based on error type
   * @param {string} errorType - Error category
   * @returns {Array<string>} Recovery suggestions
   */
  getRecoverySuggestions(errorType) {
    const suggestions = {
      network: [
        'Check your internet connection',
        'Try again in a few moments',
        'Verify the API endpoint URL is correct'
      ],
      authentication: [
        'Verify your API key in Settings',
        'Check if your API key has expired',
        'Ensure your account is active'
      ],
      rate_limit: [
        'Wait a few minutes before trying again',
        'Consider upgrading your API plan',
        'Reduce the frequency of requests'
      ],
      quota: [
        'Check your API usage limits',
        'Upgrade your API plan',
        'Contact your API provider'
      ],
      server_error: [
        'Try again in a few minutes',
        'Check the API status page',
        'Contact support if the issue persists'
      ],
      api_error: [
        'Try rephrasing your message',
        'Check your input format',
        'Switch to a different AI model'
      ],
      client_error: [
        'Ensure you are using HTTPS',
        'Check browser security settings',
        'Try a different browser'
      ],
      validation: [
        'Check your input format',
        'Try a simpler message',
        'Verify all required fields'
      ],
      storage: [
        'Clear browser data',
        'Free up storage space',
        'Try using a different browser'
      ]
    }

    return suggestions[errorType] || [
      'Try refreshing the page',
      'Check your settings',
      'Contact support if the problem continues'
    ]
  }

  /**
   * Generate unique error ID
   * @returns {string} Error ID
   */
  generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Add error to history
   * @param {Object} errorInfo - Error information
   */
  addToHistory(errorInfo) {
    this.errorHistory.unshift(errorInfo)
    
    // Limit history size
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(0, this.maxHistorySize)
    }
  }

  /**
   * Get error history
   * @param {Object} filters - Filter criteria
   * @returns {Array<Object>} Filtered error history
   */
  getErrorHistory(filters = {}) {
    let filtered = [...this.errorHistory]

    if (filters.type) {
      filtered = filtered.filter(err => err.type === filters.type)
    }

    if (filters.severity) {
      filtered = filtered.filter(err => err.severity === filters.severity)
    }

    if (filters.since) {
      filtered = filtered.filter(err => new Date(err.timestamp) >= filters.since)
    }

    return filtered
  }

  /**
   * Clear error history
   */
  clearHistory() {
    this.errorHistory = []
    this.retryAttempts.clear()
  }

  /**
   * Log error for debugging
   * @param {Object} errorInfo - Error information
   */
  logError(errorInfo) {
    const logLevel = errorInfo.severity === 'high' ? 'error' : 
                     errorInfo.severity === 'medium' ? 'warn' : 'info'

    console[logLevel](`[ErrorHandler] ${errorInfo.type}:`, {
      message: errorInfo.message,
      context: errorInfo.context,
      timestamp: errorInfo.timestamp
    })
  }

  /**
   * Sleep utility for retry delays
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Create error notification for UI
   * @param {Object} errorInfo - Error information
   * @returns {Object} Notification data
   */
  createNotification(errorInfo) {
    return {
      id: errorInfo.id,
      type: 'error',
      title: this.getErrorTitle(errorInfo.type),
      message: errorInfo.userMessage,
      timestamp: errorInfo.timestamp,
      severity: errorInfo.severity,
      suggestions: this.getRecoverySuggestions(errorInfo.type),
      retry: errorInfo.retry,
      dismissible: true
    }
  }

  /**
   * Get error title based on type
   * @param {string} errorType - Error type
   * @returns {string} Error title
   */
  getErrorTitle(errorType) {
    const titles = {
      network: 'Connection Error',
      authentication: 'Authentication Failed',
      rate_limit: 'Rate Limit Exceeded',
      quota: 'Usage Limit Reached',
      server_error: 'Service Unavailable',
      api_error: 'API Error',
      client_error: 'Browser Error',
      validation: 'Invalid Input',
      storage: 'Storage Error',
      unknown: 'Unexpected Error'
    }

    return titles[errorType] || 'Error'
  }
}