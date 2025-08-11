import Dexie from 'dexie'

// Define the database schema
export class UpNextDatabase extends Dexie {
  constructor() {
    super('UpNextDB')
    
    this.version(1).stores({
      tasks: '++id, title, description, completed, createdAt, updatedAt',
      notes: '++id, title, content, createdAt, updatedAt'
    })

    // Version 2: Add conversation and user settings
    this.version(2).stores({
      tasks: '++id, title, description, completed, createdAt, updatedAt',
      notes: '++id, title, content, createdAt, updatedAt',
      conversations: '++id, role, content, timestamp, taskIds, messageId',
      userSettings: '++id, key, value, createdAt, updatedAt'
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

// Conversation operations
export const ConversationService = {
  async getAll() {
    return await db.conversations.orderBy('timestamp').toArray()
  },

  async create(messageData) {
    const now = new Date()
    const message = {
      ...messageData,
      timestamp: now,
      messageId: this.generateMessageId()
    }
    const id = await db.conversations.add(message)
    return { ...message, id }
  },

  async getRecent(limit = 50) {
    return await db.conversations
      .orderBy('timestamp')
      .reverse()
      .limit(limit)
      .toArray()
  },

  async getByTaskId(taskId) {
    return await db.conversations
      .where('taskIds')
      .equals(taskId)
      .toArray()
  },

  async delete(id) {
    await db.conversations.delete(id)
  },

  async clear() {
    await db.conversations.clear()
  },

  async getContext(limit = 10) {
    const messages = await this.getRecent(limit)
    return messages.reverse() // Return in chronological order
  },

  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// User settings operations
export const SettingsService = {
  async get(key, defaultValue = null) {
    const setting = await db.userSettings.where('key').equals(key).first()
    return setting ? setting.value : defaultValue
  },

  async set(key, value) {
    const now = new Date()
    const existing = await db.userSettings.where('key').equals(key).first()
    
    if (existing) {
      await db.userSettings.update(existing.id, {
        value: value,
        updatedAt: now
      })
    } else {
      await db.userSettings.add({
        key: key,
        value: value,
        createdAt: now,
        updatedAt: now
      })
    }
  },

  async remove(key) {
    await db.userSettings.where('key').equals(key).delete()
  },

  async getAll() {
    const settings = await db.userSettings.toArray()
    const result = {}
    settings.forEach(setting => {
      result[setting.key] = setting.value
    })
    return result
  },

  async clear() {
    await db.userSettings.clear()
  },

  async export() {
    return await this.getAll()
  },

  async import(settings, overwrite = false) {
    const entries = Object.entries(settings)
    
    for (const [key, value] of entries) {
      if (overwrite || !(await this.get(key))) {
        await this.set(key, value)
      }
    }
  }
}