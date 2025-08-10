import { Controller } from "@hotwired/stimulus"
import { TaskService } from "../database"

export default class extends Controller {
  static targets = ["list", "form", "title", "description"]
  static values = { editing: Number }

  connect() {
    this.loadTasks()
  }

  async loadTasks() {
    try {
      const tasks = await TaskService.getAll()
      this.renderTasks(tasks)
    } catch (error) {
      console.error('Error loading tasks:', error)
    }
  }

  renderTasks(tasks) {
    const html = tasks.map(task => `
      <div class="bg-card border border-border rounded-lg p-4 mb-3" data-task-id="${task.id}">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <button 
                data-action="click->tasks#toggle"
                data-task-id="${task.id}"
                class="w-5 h-5 rounded border-2 flex items-center justify-center ${task.completed ? 'bg-primary border-primary' : 'border-border hover:border-primary/50'}"
              >
                ${task.completed ? '<svg class="w-3 h-3 text-primary-foreground fill-current"><path d="m9 12-2 2 4 4 6-6-1.41-1.41L11 14.17l-1.59-1.59L9 12z"/></svg>' : ''}
              </button>
              <h3 class="font-medium ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}">${this.escapeHtml(task.title)}</h3>
            </div>
            ${task.description ? `<p class="text-sm text-muted-foreground ml-8 ${task.completed ? 'line-through' : ''}">${this.escapeHtml(task.description)}</p>` : ''}
          </div>
          <div class="flex gap-2 ml-4">
            <button 
              data-action="click->tasks#edit"
              data-task-id="${task.id}"
              class="text-muted-foreground hover:text-foreground p-1"
            >
              <svg class="w-4 h-4 fill-current"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
            </button>
            <button 
              data-action="click->tasks#delete"
              data-task-id="${task.id}"
              class="text-muted-foreground hover:text-destructive p-1"
            >
              <svg class="w-4 h-4 fill-current"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
            </button>
          </div>
        </div>
      </div>
    `).join('')

    this.listTarget.innerHTML = html || '<p class="text-muted-foreground text-center py-8">No tasks yet. Add one above!</p>'
  }

  async create(event) {
    event.preventDefault()
    
    const title = this.titleTarget.value.trim()
    const description = this.descriptionTarget.value.trim()
    
    if (!title) return

    try {
      if (this.editingValue) {
        await TaskService.update(this.editingValue, { title, description })
        this.editingValue = 0
      } else {
        await TaskService.create({ title, description })
      }
      
      this.formTarget.reset()
      await this.loadTasks()
    } catch (error) {
      console.error('Error saving task:', error)
    }
  }

  async toggle(event) {
    const taskId = parseInt(event.currentTarget.dataset.taskId)
    
    try {
      await TaskService.toggleComplete(taskId)
      await this.loadTasks()
    } catch (error) {
      console.error('Error toggling task:', error)
    }
  }

  async edit(event) {
    const taskId = parseInt(event.currentTarget.dataset.taskId)
    
    try {
      const task = await TaskService.getAll()
      const taskToEdit = task.find(t => t.id === taskId)
      
      if (taskToEdit) {
        this.titleTarget.value = taskToEdit.title
        this.descriptionTarget.value = taskToEdit.description || ''
        this.editingValue = taskId
        this.titleTarget.focus()
      }
    } catch (error) {
      console.error('Error editing task:', error)
    }
  }

  async delete(event) {
    const taskId = parseInt(event.currentTarget.dataset.taskId)
    
    if (confirm('Delete this task?')) {
      try {
        await TaskService.delete(taskId)
        await this.loadTasks()
      } catch (error) {
        console.error('Error deleting task:', error)
      }
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }
}