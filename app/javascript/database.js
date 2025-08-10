import Dexie from 'dexie'

// Define the database schema
export class UpNextDatabase extends Dexie {
  constructor() {
    super('UpNextDB')
    
    this.version(1).stores({
      tasks: '++id, title, description, completed, createdAt, updatedAt',
      notes: '++id, title, content, createdAt, updatedAt'
    })
  }
}

// Create database instance
export const db = new UpNextDatabase()

// Task operations
export const TaskService = {
  async getAll() {
    return await db.tasks.orderBy('createdAt').reverse().toArray()
  },
  
  async create(taskData) {
    const now = new Date()
    const task = {
      ...taskData,
      completed: false,
      createdAt: now,
      updatedAt: now
    }
    const id = await db.tasks.add(task)
    return { ...task, id }
  },
  
  async update(id, updates) {
    const updatedTask = {
      ...updates,
      updatedAt: new Date()
    }
    await db.tasks.update(id, updatedTask)
    return await db.tasks.get(id)
  },
  
  async delete(id) {
    await db.tasks.delete(id)
  },
  
  async toggleComplete(id) {
    const task = await db.tasks.get(id)
    if (task) {
      return await this.update(id, { completed: !task.completed })
    }
  }
}

// Note operations
export const NoteService = {
  async getAll() {
    return await db.notes.orderBy('updatedAt').reverse().toArray()
  },
  
  async create(noteData) {
    const now = new Date()
    const note = {
      ...noteData,
      createdAt: now,
      updatedAt: now
    }
    const id = await db.notes.add(note)
    return { ...note, id }
  },
  
  async update(id, updates) {
    const updatedNote = {
      ...updates,
      updatedAt: new Date()
    }
    await db.notes.update(id, updatedNote)
    return await db.notes.get(id)
  },
  
  async delete(id) {
    await db.notes.delete(id)
  },
  
  async get(id) {
    return await db.notes.get(id)
  }
}

// Export/Import functionality
export const DataService = {
  async exportData() {
    const tasks = await TaskService.getAll()
    const notes = await NoteService.getAll()
    return {
      tasks,
      notes,
      exportDate: new Date().toISOString(),
      version: 1
    }
  },
  
  async importData(data) {
    if (!data.tasks && !data.notes) {
      throw new Error('Invalid data format')
    }
    
    // Clear existing data (optional - add confirmation in UI)
    // await db.tasks.clear()
    // await db.notes.clear()
    
    // Import tasks
    if (data.tasks && data.tasks.length > 0) {
      for (const task of data.tasks) {
        await TaskService.create({
          title: task.title,
          description: task.description,
          completed: task.completed
        })
      }
    }
    
    // Import notes
    if (data.notes && data.notes.length > 0) {
      for (const note of data.notes) {
        await NoteService.create({
          title: note.title,
          content: note.content
        })
      }
    }
  }
}