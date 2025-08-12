import { Controller } from "@hotwired/stimulus"
import { NoteService } from "database"

export default class extends Controller {
  static targets = ["list", "form", "title", "content", "modal", "modalTitle", "modalContent"]
  static values = { editing: Number }

  connect() {
    this.loadNotes()
  }

  async loadNotes() {
    try {
      const notes = await NoteService.getAll()
      this.renderNotes(notes)
    } catch (error) {
      console.error('Error loading notes:', error)
    }
  }

  renderNotes(notes) {
    const html = notes.map(note => `
      <div class="bg-card border border-border rounded-lg p-4 mb-3" data-note-id="${note.id}">
        <div class="flex items-start justify-between mb-2">
          <h3 class="font-medium text-foreground cursor-pointer hover:text-primary" 
              data-action="click->notes#view" 
              data-note-id="${note.id}">
            ${this.escapeHtml(note.title)}
          </h3>
          <div class="flex gap-2">
            <button 
              data-action="click->notes#edit"
              data-note-id="${note.id}"
              class="text-muted-foreground hover:text-foreground p-1"
            >
              <svg class="w-4 h-4 fill-current"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
            </button>
            <button 
              data-action="click->notes#delete"
              data-note-id="${note.id}"
              class="text-muted-foreground hover:text-destructive p-1"
            >
              <svg class="w-4 h-4 fill-current"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
            </button>
          </div>
        </div>
        <p class="text-sm text-muted-foreground line-clamp-2">${this.escapeHtml(note.content.substring(0, 100))}${note.content.length > 100 ? '...' : ''}</p>
        <p class="text-xs text-muted-foreground mt-2">
          Updated ${this.formatDate(note.updatedAt)}
        </p>
      </div>
    `).join('')

    this.listTarget.innerHTML = html || '<p class="text-muted-foreground text-center py-8">No notes yet. Add one above!</p>'
  }

  async create(event) {
    event.preventDefault()
    
    const title = this.titleTarget.value.trim()
    const content = this.contentTarget.value.trim()
    
    if (!title || !content) return

    try {
      if (this.editingValue) {
        await NoteService.update(this.editingValue, { title, content })
        this.editingValue = 0
      } else {
        await NoteService.create({ title, content })
      }
      
      this.formTarget.reset()
      await this.loadNotes()
    } catch (error) {
      console.error('Error saving note:', error)
    }
  }

  async view(event) {
    const noteId = parseInt(event.currentTarget.dataset.noteId)
    
    try {
      const note = await NoteService.get(noteId)
      if (note) {
        this.modalTitleTarget.textContent = note.title
        this.modalContentTarget.innerHTML = `
          <div class="prose prose-sm max-w-none">
            ${this.formatContent(note.content)}
          </div>
          <p class="text-xs text-muted-foreground mt-4 pt-4 border-t border-border">
            Created: ${this.formatDate(note.createdAt)} • 
            Updated: ${this.formatDate(note.updatedAt)}
          </p>
        `
        this.showModal()
      }
    } catch (error) {
      console.error('Error viewing note:', error)
    }
  }

  async edit(event) {
    const noteId = parseInt(event.currentTarget.dataset.noteId)
    
    try {
      const note = await NoteService.get(noteId)
      
      if (note) {
        this.titleTarget.value = note.title
        this.contentTarget.value = note.content
        this.editingValue = noteId
        this.titleTarget.focus()
        this.titleTarget.scrollIntoView({ behavior: 'smooth' })
      }
    } catch (error) {
      console.error('Error editing note:', error)
    }
  }

  async delete(event) {
    const noteId = parseInt(event.currentTarget.dataset.noteId)
    
    if (confirm('Delete this note?')) {
      try {
        await NoteService.delete(noteId)
        await this.loadNotes()
      } catch (error) {
        console.error('Error deleting note:', error)
      }
    }
  }

  showModal() {
    this.modalTarget.classList.remove('hidden')
    document.body.classList.add('overflow-hidden')
  }

  hideModal() {
    this.modalTarget.classList.add('hidden')
    document.body.classList.remove('overflow-hidden')
  }

  formatContent(content) {
    return content
      .split('\n')
      .map(line => `<p>${this.escapeHtml(line) || '<br>'}</p>`)
      .join('')
  }

  formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }
}