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

    // Version 3: Enhanced task management with categories, priorities, and due dates
    this.version(3).stores({
      tasks: '++id, title, description, completed, category_id, priority, due_date, subtasks, createdAt, updatedAt',
      notes: '++id, title, content, createdAt, updatedAt',
      conversations: '++id, role, content, timestamp, taskIds, messageId',
      userSettings: '++id, key, value, createdAt, updatedAt',
      categories: '++id, name, color, icon, createdAt, updatedAt'
    }).upgrade(async trans => {
      // Migration logic for existing tasks
      const tasks = await trans.table('tasks').toArray()
      for (const task of tasks) {
        await trans.table('tasks').update(task.id, {
          category_id: null,
          priority: 'medium',
          due_date: null,
          subtasks: []
        })
      }

      // Create default categories
      const defaultCategories = [
        { name: 'Personal', color: '#31B67A', icon: 'user' },
        { name: 'Work', color: '#4F83F1', icon: 'briefcase' },
        { name: 'Important', color: '#F97316', icon: 'star' },
        { name: 'General', color: '#6B7280', icon: 'inbox' }
      ]

      const now = new Date()
      for (const category of defaultCategories) {
        await trans.table('categories').add({
          ...category,
          createdAt: now,
          updatedAt: now
        })
      }
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

  async getAllByCategory(categoryId) {
    if (categoryId) {
      return await db.tasks.where('category_id').equals(categoryId).orderBy('createdAt').reverse().toArray()
    }
    return await db.tasks.where('category_id').equals(null).orderBy('createdAt').reverse().toArray()
  },

  async getAllByPriority(priority) {
    return await db.tasks.where('priority').equals(priority).orderBy('createdAt').reverse().toArray()
  },

  async getOverdue() {
    const now = new Date()
    now.setHours(23, 59, 59, 999) // End of today
    return await db.tasks
      .where('due_date')
      .below(now)
      .and(task => !task.completed)
      .orderBy('due_date')
      .toArray()
  },

  async getDueToday() {
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)
    
    return await db.tasks
      .where('due_date')
      .between(startOfDay, endOfDay, true, true)
      .orderBy('due_date')
      .toArray()
  },
  
  async create(taskData) {
    const now = new Date()
    const task = {
      title: taskData.title,
      description: taskData.description || '',
      category_id: taskData.category_id || null,
      priority: taskData.priority || 'medium',
      due_date: taskData.due_date || null,
      subtasks: taskData.subtasks || [],
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

  async get(id) {
    return await db.tasks.get(id)
  },
  
  async toggleComplete(id) {
    const task = await db.tasks.get(id)
    if (task) {
      return await this.update(id, { completed: !task.completed })
    }
  },

  async addSubtask(taskId, subtaskText) {
    const task = await db.tasks.get(taskId)
    if (task) {
      const subtasks = task.subtasks || []
      subtasks.push({
        id: Date.now(),
        text: subtaskText,
        completed: false
      })
      return await this.update(taskId, { subtasks })
    }
  },

  async toggleSubtask(taskId, subtaskId) {
    const task = await db.tasks.get(taskId)
    if (task && task.subtasks) {
      const subtasks = task.subtasks.map(sub => 
        sub.id === subtaskId ? { ...sub, completed: !sub.completed } : sub
      )
      return await this.update(taskId, { subtasks })
    }
  },

  async deleteSubtask(taskId, subtaskId) {
    const task = await db.tasks.get(taskId)
    if (task && task.subtasks) {
      const subtasks = task.subtasks.filter(sub => sub.id !== subtaskId)
      return await this.update(taskId, { subtasks })
    }
  }
}

// Category operations
export const CategoryService = {
  async getAll() {
    return await db.categories.orderBy('name').toArray()
  },

  async create(categoryData) {
    const now = new Date()
    const category = {
      name: categoryData.name,
      color: categoryData.color || '#6B7280',
      icon: categoryData.icon || 'folder',
      createdAt: now,
      updatedAt: now
    }
    const id = await db.categories.add(category)
    return { ...category, id }
  },

  async update(id, updates) {
    const updatedCategory = {
      ...updates,
      updatedAt: new Date()
    }
    await db.categories.update(id, updatedCategory)
    return await db.categories.get(id)
  },

  async delete(id) {
    // First, update all tasks with this category to have no category (bulk operation)
    await db.tasks.where('category_id').equals(id).modify({ category_id: null })
    
    // Then delete the category
    await db.categories.delete(id)
  },

  async get(id) {
    return await db.categories.get(id)
  },

  async getByName(name) {
    return await db.categories.where('name').equals(name).first()
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
    const categories = await CategoryService.getAll()
    const settings = await SettingsService.getAll()
    return {
      tasks,
      notes,
      categories,
      settings,
      exportDate: new Date().toISOString(),
      version: 3
    }
  },
  
  async importData(data, options = {}) {
    const { clearExisting = false } = options
    
    if (!data.tasks && !data.notes && !data.categories) {
      throw new Error('Invalid data format')
    }
    
    // Clear existing data if requested
    if (clearExisting) {
      await db.tasks.clear()
      await db.notes.clear()
      await db.categories.clear()
    }
    
    // Import categories first (for foreign key references)
    if (data.categories && data.categories.length > 0) {
      for (const category of data.categories) {
        await CategoryService.create({
          name: category.name,
          color: category.color,
          icon: category.icon
        })
      }
    }
    
    // Import tasks
    if (data.tasks && data.tasks.length > 0) {
      for (const task of data.tasks) {
        await TaskService.create({
          title: task.title,
          description: task.description || '',
          category_id: task.category_id || null,
          priority: task.priority || 'medium',
          due_date: task.due_date || null,
          subtasks: task.subtasks || [],
          completed: task.completed || false
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

    // Import settings
    if (data.settings) {
      await SettingsService.import(data.settings, clearExisting)
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