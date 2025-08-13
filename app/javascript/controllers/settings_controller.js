import { Controller } from "@hotwired/stimulus"
import { EncryptionService } from "services/encryption-service"
import { AIProviderService } from "services/ai-provider-service"

export default class extends Controller {
  static targets = ["modal", "provider", "apiKey", "model", "customUrl", "testResult", "testButton"]

  connect() {
    this.encryptionService = new EncryptionService()
    this.aiProviderService = new AIProviderService(this.encryptionService)
    
    // Only load settings if we have the required targets
    if (this.hasProviderTarget && this.hasModelTarget) {
      this.loadCurrentSettings()
    }
  }

  // Open settings modal
  open() {
    if (this.hasModalTarget) {
      this.modalTarget.classList.remove('hidden')
      this.modalTarget.classList.add('flex')
      document.body.style.overflow = 'hidden'
    }
  }

  // Close settings modal
  close() {
    this.modalTarget.classList.add('hidden')
    this.modalTarget.classList.remove('flex')
    document.body.style.overflow = 'auto'
  }

  // Close modal when clicking overlay
  closeOnOverlay(event) {
    if (event.target === this.modalTarget) {
      this.close()
    }
  }

  // Load current settings
  async loadCurrentSettings() {
    try {
      // Get current provider from localStorage
      const currentProvider = localStorage.getItem('upnext_ai_provider') || 'openai'
      this.providerTarget.value = currentProvider
      
      // Update model options for current provider
      this.updateModelOptions()
      
      // Load saved model
      const savedModel = localStorage.getItem('upnext_ai_model')
      if (savedModel && this.hasModelTarget) {
        this.modelTarget.value = savedModel
      }

      // Load custom URL if custom provider
      if (currentProvider === 'custom') {
        const customSettings = await this.aiProviderService.getCustomSettings()
        if (customSettings && customSettings.baseUrl && this.hasCustomUrlTarget) {
          this.customUrlTarget.value = customSettings.baseUrl
        }
      }

      // Check if API key exists
      const hasApiKey = await this.aiProviderService.getApiKey(currentProvider)
      if (hasApiKey && this.hasApiKeyTarget) {
        this.apiKeyTarget.placeholder = "API key configured ✓"
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  // Handle provider change
  async providerChanged() {
    const provider = this.providerTarget.value
    
    // Update model options
    this.updateModelOptions()
    
    // Show/hide custom URL field
    this.toggleCustomUrlField(provider === 'custom')
    
    // Update API key placeholder
    const hasApiKey = await this.aiProviderService.getApiKey(provider)
    if (this.hasApiKeyTarget) {
      this.apiKeyTarget.placeholder = hasApiKey ? "API key configured ✓" : `Enter your ${this.getProviderName(provider)} API key`
      this.apiKeyTarget.value = ""
    }

    // Clear test results
    this.clearTestResults()
  }

  // Update model dropdown based on provider
  updateModelOptions() {
    if (!this.hasModelTarget) return

    const provider = this.providerTarget.value
    const providers = this.aiProviderService.getProviders()
    const models = providers[provider]?.models || []

    // Clear existing options
    this.modelTarget.innerHTML = ''

    // Add model options
    models.forEach(model => {
      const option = document.createElement('option')
      option.value = model
      option.textContent = this.getModelDisplayName(model)
      this.modelTarget.appendChild(option)
    })

    // Select default model
    const defaultModel = providers[provider]?.defaultModel
    if (defaultModel) {
      this.modelTarget.value = defaultModel
    }
  }

  // Get display name for model
  getModelDisplayName(model) {
    const displayNames = {
      'gpt-4': 'GPT-4',
      'gpt-4-turbo': 'GPT-4 Turbo',
      'gpt-3.5-turbo': 'GPT-3.5 Turbo',
      'claude-3-opus-20240229': 'Claude 3 Opus',
      'claude-3-sonnet-20240229': 'Claude 3 Sonnet',
      'claude-3-haiku-20240307': 'Claude 3 Haiku',
      'custom-model': 'Custom Model'
    }
    return displayNames[model] || model
  }

  // Get provider display name
  getProviderName(provider) {
    const providers = this.aiProviderService.getProviders()
    return providers[provider]?.name || provider
  }

  // Toggle custom URL field visibility
  toggleCustomUrlField(show) {
    if (!this.hasCustomUrlTarget) return

    const customUrlContainer = this.customUrlTarget.closest('.form-group')
    if (customUrlContainer) {
      customUrlContainer.style.display = show ? 'block' : 'none'
    }
  }

  // Save settings
  async save() {
    try {
      const provider = this.providerTarget.value
      const apiKey = this.hasApiKeyTarget ? this.apiKeyTarget.value.trim() : ''
      const model = this.hasModelTarget ? this.modelTarget.value : ''
      const customUrl = this.hasCustomUrlTarget ? this.customUrlTarget.value.trim() : ''

      // Save provider and model
      localStorage.setItem('upnext_ai_provider', provider)
      if (model) {
        localStorage.setItem('upnext_ai_model', model)
      }

      // Save API key if provided
      if (apiKey) {
        await this.aiProviderService.setApiKey(provider, apiKey)
      }

      // Save custom settings if custom provider
      if (provider === 'custom' && customUrl) {
        await this.aiProviderService.setCustomSettings({ baseUrl: customUrl })
      }

      this.showMessage('Settings saved successfully!', 'success')
      
      // Clear API key input for security
      if (this.hasApiKeyTarget) {
        this.apiKeyTarget.value = ''
        this.apiKeyTarget.placeholder = "API key configured ✓"
      }

    } catch (error) {
      console.error('Error saving settings:', error)
      this.showMessage('Error saving settings. Please try again.', 'error')
    }
  }

  // Test API connection
  async testConnection() {
    if (!this.hasTestButtonTarget || !this.hasTestResultTarget) return

    try {
      this.testButtonTarget.disabled = true
      this.testButtonTarget.textContent = 'Testing...'
      this.clearTestResults()

      const provider = this.providerTarget.value
      const apiKey = this.hasApiKeyTarget ? this.apiKeyTarget.value.trim() : ''

      // Save API key temporarily for testing if provided
      if (apiKey) {
        await this.aiProviderService.setApiKey(provider, apiKey)
      }

      // Test connection
      const success = await this.aiProviderService.testConnection(provider)
      
      if (success) {
        this.showTestResult('Connection successful! ✓', 'success')
      } else {
        this.showTestResult('Connection failed. Please check your settings.', 'error')
      }

    } catch (error) {
      console.error('Connection test error:', error)
      this.showTestResult(`Connection failed: ${error.message}`, 'error')
    } finally {
      this.testButtonTarget.disabled = false
      this.testButtonTarget.textContent = 'Test Connection'
    }
  }

  // Show test result
  showTestResult(message, type) {
    if (!this.hasTestResultTarget) return

    this.testResultTarget.textContent = message
    this.testResultTarget.className = `mt-2 text-sm ${
      type === 'success' 
        ? 'text-success' 
        : 'text-error'
    }`
    this.testResultTarget.style.display = 'block'
  }

  // Clear test results
  clearTestResults() {
    if (this.hasTestResultTarget) {
      this.testResultTarget.style.display = 'none'
      this.testResultTarget.textContent = ''
    }
  }

  // Show message
  showMessage(message, type) {
    // Create temporary message element
    const messageEl = document.createElement('div')
    messageEl.className = `fixed top-4 right-4 px-4 py-2 rounded-lg text-sm font-medium z-50 ${
      type === 'success' 
        ? 'bg-success/10 text-success border border-success/20' 
        : 'bg-error/10 text-error border border-error/20'
    }`
    messageEl.textContent = message
    
    document.body.appendChild(messageEl)
    
    // Remove after 3 seconds
    setTimeout(() => {
      if (messageEl.parentNode) {
        messageEl.parentNode.removeChild(messageEl)
      }
    }, 3000)
  }
}