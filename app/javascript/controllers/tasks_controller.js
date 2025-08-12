import { Controller } from "@hotwired/stimulus"
import { TaskService, CategoryService } from "database"

export default class extends Controller {
  static targets = [
    "tabs", "content", "todayList", "upcomingList", "completedList", 
    "todayDate", "createTitleInput",
    "createModal", "createForm", "categorySelect",
    "editModal", "editForm", "editTaskId", "editTitle", "editDescription", 
    "editCategorySelect", "editPriority", "editDueDate", "subtasksList", "newSubtaskInput",
    "categoryModal", "categoryForm", "categoriesList"
  ]
  
  static values = { 
    activeTab: String,
    editingTaskId: Number,
    categories: Array 
  }

  connect() {
    this.activeTabValue = 'today'
    this.updateTodayDate()
    this.loadTasks()
    this.loadCategories()
  }

  // Update today's date display
  updateTodayDate() {
    if (this.hasTodayDateTarget) {
      const today = new Date()
      const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }
      this.todayDateTarget.textContent = today.toLocaleDateString('en-US', options)
    }
  }

  // Tab switching
  async switchTab(event) {
    const tab = event.currentTarget.dataset.tab
    this.activeTabValue = tab
    
    // Update tab appearance
    this.tabsTarget.querySelectorAll('button').forEach(btn => {
      if (btn.dataset.tab === tab) {
        btn.className = 'px-4 py-3 text-sm font-medium text-primary border-b-2 border-primary bg-primary/5'
      } else {
        btn.className = 'px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground'
      }
    })
    
    // Show/hide content
    this.contentTarget.querySelectorAll('.task-view').forEach(view => {
      if (view.dataset.view === tab) {
        view.classList.remove('hidden')
        view.style.display = 'block'
      } else {
        view.classList.add('hidden') 
        view.style.display = 'none'
      }
    })
    
    await this.loadTasks()
  }

  // Load tasks based on current tab
  async loadTasks() {
    try {
      const tasks = await TaskService.getAll()
      
      // Filter tasks based on current tab
      const today = new Date()
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)
      
      const todayTasks = tasks.filter(task => {
        if (task.completed) return false
        if (!task.due_date) return true // No due date = today
        const dueDate = new Date(task.due_date)
        return dueDate >= startOfToday && dueDate <= endOfToday
      })
      
      const upcomingTasks = tasks.filter(task => {
        if (task.completed) return false
        if (!task.due_date) return false
        const dueDate = new Date(task.due_date)
        return dueDate > endOfToday
      })
      
      const completedTasks = tasks.filter(task => task.completed)
      
      this.renderTasks(todayTasks, 'todayList')
      this.renderTasks(upcomingTasks, 'upcomingList')
      this.renderTasks(completedTasks, 'completedList')
    } catch (error) {
      console.error('Error loading tasks:', error)
    }
  }

  // Load categories
  async loadCategories() {
    try {
      const categories = await CategoryService.getAll()
      this.categoriesValue = categories
      this.populateCategorySelects()
      this.renderCategories()
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  // Populate category dropdown selects
  populateCategorySelects() {
    const selects = []
    
    // Add categorySelect target if it exists (create modal)
    if (this.hasCategorySelectTarget) {
      selects.push(this.categorySelectTarget)
    }
    
    // Add editCategorySelect target if it exists (edit modal)
    if (this.hasEditCategorySelectTarget) {
      selects.push(this.editCategorySelectTarget)
    }
    
    selects.forEach(select => {
      if (select) {
        select.innerHTML = '<option value="">No Category</option>' +
          this.categoriesValue.map(cat => 
            `<option value="${cat.id}">${this.escapeHtml(cat.name)}</option>`
          ).join('')
      }
    })
  }

  // Render tasks in specified container
  renderTasks(tasks, targetName) {
    const target = this[`${targetName}Target`]
    if (!target) return

    if (tasks.length === 0) {
      target.innerHTML = this.getEmptyStateHtml(targetName)
    } else {
      const html = tasks.map(task => this.renderTaskItem(task)).join('')
      target.innerHTML = html
    }
  }

  // Get empty state HTML based on view type
  getEmptyStateHtml(targetName) {
    const emptyStates = {
      todayList: {
        icon: `<svg class="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19,3H18V1H16V3H8V1H6V3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M19,19H5V8H19V19Z"/>
        </svg>`,
        title: "No tasks for today",
        subtitle: "Create your first task to get started with your daily planning",
        showButton: true
      },
      upcomingList: {
        icon: `<svg class="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12.5,7V12.25L17,14.92L16.25,16.15L11,13V7H12.5Z"/>
        </svg>`,
        title: "No upcoming tasks",
        subtitle: "Schedule future tasks or set deadlines",
        showButton: false
      },
      completedList: {
        icon: `<svg class="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"/>
        </svg>`,
        title: "No completed tasks yet",
        subtitle: "Complete tasks to see your accomplishments here",
        showButton: false
      }
    }

    const state = emptyStates[targetName]
    if (!state) return '<p class="text-muted-foreground text-center py-8">No tasks here yet.</p>'

    return `
      <div class="text-center py-16">
        ${state.icon}
        <h4 class="text-lg font-medium text-foreground mb-2">${state.title}</h4>
        <p class="text-muted-foreground mb-6 max-w-sm mx-auto">${state.subtitle}</p>
        ${state.showButton ? `
          <button
            data-action="click->tasks#openCreateModal"
            class="inline-flex items-center gap-2 px-4 py-2 bg-background border-2 border-dashed border-border rounded-lg hover:border-primary/50 transition-colors text-sm font-medium text-foreground"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
            </svg>
            Create Task
          </button>
        ` : ''}
      </div>
    `
  }

  // Render a single task item
  renderTaskItem(task) {
    const category = this.categoriesValue.find(cat => cat.id === task.category_id)

    return `
      <div class="bg-card border border-border rounded-lg p-4 hover:shadow-sm transition-shadow" data-task-id="${task.id}">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <button 
                data-action="click->tasks#toggleComplete"
                data-task-id="${task.id}"
                class="w-5 h-5 rounded border-2 flex items-center justify-center ${task.completed ? 'bg-primary border-primary' : 'border-border hover:border-primary/50'} transition-colors"
              >
                ${task.completed ? '<svg class="w-3 h-3 text-primary-foreground fill-current"><path d="m9 12-2 2 4 4 6-6-1.41-1.41L11 14.17l-1.59-1.59L9 12z"/></svg>' : ''}
              </button>
              <div class="flex items-center gap-2">
                <h3 class="font-medium ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}">${this.escapeHtml(task.title)}</h3>
                ${task.priority !== 'medium' ? `<span class="priority-indicator priority-${task.priority}">${task.priority.toUpperCase()}</span>` : ''}
              </div>
            </div>
            ${task.description ? `<p class="text-sm text-muted-foreground ml-8 ${task.completed ? 'line-through' : ''}">${this.escapeHtml(task.description)}</p>` : ''}
            <div class="ml-8 mt-2 flex items-center gap-4 text-xs text-muted-foreground">
              ${category ? `<div class="flex items-center gap-1"><div class="w-2 h-2 rounded-full" style="background-color: ${category.color}"></div>${this.escapeHtml(category.name)}</div>` : ''}
              ${task.due_date ? `<div class="flex items-center gap-1"><svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M19,3H18V1H16V3H8V1H6V3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M19,19H5V8H19V19Z"/></svg>${this.formatDate(task.due_date)}</div>` : ''}
              ${task.subtasks && task.subtasks.length > 0 ? `<div class="flex items-center gap-1"><svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M7,5H21V7H7V5M7,13V11H21V13H7M4,4.5A1.5,1.5 0 0,1 5.5,6A1.5,1.5 0 0,1 4,7.5A1.5,1.5 0 0,1 2.5,6A1.5,1.5 0 0,1 4,4.5M4,10.5A1.5,1.5 0 0,1 5.5,12A1.5,1.5 0 0,1 4,13.5A1.5,1.5 0 0,1 2.5,12A1.5,1.5 0 0,1 4,10.5M7,19V17H21V19H7M4,16.5A1.5,1.5 0 0,1 5.5,18A1.5,1.5 0 0,1 4,19.5A1.5,1.5 0 0,1 2.5,18A1.5,1.5 0 0,1 4,16.5Z"/></svg>${task.subtasks.length} subtasks</div>` : ''}
            </div>
          </div>
          <div class="flex gap-1 ml-4">
            <button 
              data-action="click->tasks#openEditModal"
              data-task-id="${task.id}"
              class="text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-accent transition-colors"
              title="Edit task"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
            </button>
          </div>
        </div>
      </div>
    `
  }

  // Quick task creation
  async createQuick(event) {
    event.preventDefault()
    
    const title = this.quickInputTarget.value.trim()
    if (!title) return

    try {
      await TaskService.create({
        title,
        description: '',
        priority: 'medium'
      })
      
      this.quickFormTarget.reset()
      await this.loadTasks()
    } catch (error) {
      console.error('Error creating quick task:', error)
    }
  }

  // Modal management
  openCreateModal() {
    this.createModalTarget.classList.remove('hidden')
    this.createModalTarget.classList.add('flex')
    // Focus on the title input when modal opens
    if (this.hasCreateTitleInputTarget) {
      setTimeout(() => {
        this.createTitleInputTarget.focus()
      }, 100)
    }
  }

  closeCreateModal() {
    this.createModalTarget.classList.add('hidden')
    this.createModalTarget.classList.remove('flex')
    this.createFormTarget.reset()
  }

  closeCreateModalOnOverlay(event) {
    if (event.target === this.createModalTarget) {
      this.closeCreateModal()
    }
  }

  async openEditModal(event) {
    const taskId = parseInt(event.currentTarget.dataset.taskId)
    
    try {
      const task = await TaskService.get(taskId)
      if (!task) return

      this.editingTaskIdValue = taskId
      this.editTaskIdTarget.value = taskId
      this.editTitleTarget.value = task.title
      this.editDescriptionTarget.value = task.description || ''
      this.editCategorySelectTarget.value = task.category_id || ''
      this.editPriorityTarget.value = task.priority || 'medium'
      this.editDueDateTarget.value = task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : ''
      
      this.renderSubtasks(task.subtasks || [])
      
      this.editModalTarget.classList.remove('hidden')
      this.editModalTarget.classList.add('flex')
    } catch (error) {
      console.error('Error opening edit modal:', error)
    }
  }

  closeEditModal() {
    this.editModalTarget.classList.add('hidden')
    this.editModalTarget.classList.remove('flex')
    this.editFormTarget.reset()
    this.editingTaskIdValue = 0
  }

  closeEditModalOnOverlay(event) {
    if (event.target === this.editModalTarget) {
      this.closeEditModal()
    }
  }

  openCategoryModal() {
    this.categoryModalTarget.classList.remove('hidden')
    this.categoryModalTarget.classList.add('flex')
  }

  closeCategoryModal() {
    this.categoryModalTarget.classList.add('hidden')
    this.categoryModalTarget.classList.remove('flex')
  }

  closeCategoryModalOnOverlay(event) {
    if (event.target === this.categoryModalTarget) {
      this.closeCategoryModal()
    }
  }

  // Task CRUD operations
  async createTask(event) {
    event.preventDefault()
    
    const formData = new FormData(event.target)
    const taskData = {
      title: formData.get('title'),
      description: formData.get('description') || '',
      category_id: formData.get('category_id') ? parseInt(formData.get('category_id')) : null,
      priority: formData.get('priority'),
      due_date: formData.get('due_date') ? new Date(formData.get('due_date')) : null
    }

    try {
      await TaskService.create(taskData)
      this.closeCreateModal()
      await this.loadTasks()
    } catch (error) {
      console.error('Error creating task:', error)
    }
  }

  async updateTask(event) {
    event.preventDefault()
    
    const formData = new FormData(event.target)
    const taskId = parseInt(formData.get('task_id'))
    const updates = {
      title: formData.get('title'),
      description: formData.get('description') || '',
      category_id: formData.get('category_id') ? parseInt(formData.get('category_id')) : null,
      priority: formData.get('priority'),
      due_date: formData.get('due_date') ? new Date(formData.get('due_date')) : null
    }

    try {
      await TaskService.update(taskId, updates)
      this.closeEditModal()
      await this.loadTasks()
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  async deleteTask() {
    if (!confirm('Are you sure you want to delete this task?')) return
    
    try {
      await TaskService.delete(this.editingTaskIdValue)
      this.closeEditModal()
      await this.loadTasks()
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  async toggleComplete(event) {
    const taskId = parseInt(event.currentTarget.dataset.taskId)
    
    try {
      await TaskService.toggleComplete(taskId)
      await this.loadTasks()
    } catch (error) {
      console.error('Error toggling task:', error)
    }
  }

  // Subtask management
  renderSubtasks(subtasks) {
    const html = subtasks.map(subtask => `
      <div class="flex items-center gap-2 p-2 border border-border rounded">
        <input 
          type="checkbox" 
          ${subtask.completed ? 'checked' : ''}
          data-action="change->tasks#toggleSubtask"
          data-subtask-id="${subtask.id}"
          class="w-4 h-4"
        >
        <span class="flex-1 ${subtask.completed ? 'line-through text-muted-foreground' : ''}">${this.escapeHtml(subtask.text)}</span>
        <button 
          data-action="click->tasks#removeSubtask"
          data-subtask-id="${subtask.id}"
          class="text-muted-foreground hover:text-destructive p-1"
        >
          <svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/></svg>
        </button>
      </div>
    `).join('')
    
    this.subtasksListTarget.innerHTML = html
  }

  async addSubtask() {
    const text = this.newSubtaskInputTarget.value.trim()
    if (!text) return

    try {
      await TaskService.addSubtask(this.editingTaskIdValue, text)
      this.newSubtaskInputTarget.value = ''
      
      // Refresh subtasks display
      const task = await TaskService.get(this.editingTaskIdValue)
      this.renderSubtasks(task.subtasks || [])
    } catch (error) {
      console.error('Error adding subtask:', error)
    }
  }

  async toggleSubtask(event) {
    const subtaskId = parseInt(event.currentTarget.dataset.subtaskId)
    
    try {
      await TaskService.toggleSubtask(this.editingTaskIdValue, subtaskId)
      
      // Refresh subtasks display
      const task = await TaskService.get(this.editingTaskIdValue)
      this.renderSubtasks(task.subtasks || [])
    } catch (error) {
      console.error('Error toggling subtask:', error)
    }
  }

  async removeSubtask(event) {
    const subtaskId = parseInt(event.currentTarget.dataset.subtaskId)
    
    try {
      await TaskService.deleteSubtask(this.editingTaskIdValue, subtaskId)
      
      // Refresh subtasks display
      const task = await TaskService.get(this.editingTaskIdValue)
      this.renderSubtasks(task.subtasks || [])
    } catch (error) {
      console.error('Error removing subtask:', error)
    }
  }

  // Category management
  async createCategory(event) {
    event.preventDefault()
    
    const formData = new FormData(event.target)
    const categoryData = {
      name: formData.get('name'),
      color: formData.get('color'),
      icon: 'folder'
    }

    try {
      await CategoryService.create(categoryData)
      event.target.reset()
      await this.loadCategories()
    } catch (error) {
      console.error('Error creating category:', error)
    }
  }

  renderCategories() {
    if (!this.hasCategoriesListTarget) return
    
    const html = this.categoriesValue.map(category => `
      <div class="flex items-center justify-between p-3 border border-border rounded-lg">
        <div class="flex items-center gap-2">
          <div class="w-4 h-4 rounded-full" style="background-color: ${category.color}"></div>
          <span class="font-medium">${this.escapeHtml(category.name)}</span>
        </div>
        <button 
          data-action="click->tasks#deleteCategory"
          data-category-id="${category.id}"
          class="text-muted-foreground hover:text-destructive p-1"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
        </button>
      </div>
    `).join('')
    
    this.categoriesListTarget.innerHTML = html || '<p class="text-muted-foreground text-center py-4">No categories yet.</p>'
  }

  async deleteCategory(event) {
    const categoryId = parseInt(event.currentTarget.dataset.categoryId)
    
    if (!confirm('Delete this category? Tasks using this category will be moved to "No Category".')) return
    
    try {
      await CategoryService.delete(categoryId)
      await this.loadCategories()
      await this.loadTasks() // Refresh tasks to reflect category changes
    } catch (error) {
      console.error('Error deleting category:', error)
    }
  }

  // Utility functions
  formatDate(dateString) {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow'
    } else {
      return date.toLocaleDateString()
    }
  }

  escapeHtml(text) {
    if (!text) return ''
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }
}