import { Plus, CheckSquare, FileText } from 'lucide-react'

function HomePage() {
  return (
    <div className="container mx-auto p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">UpNext</h1>
        <p className="text-muted-foreground">Your AI-powered task and note manager</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckSquare className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-semibold">Tasks</h2>
          </div>
          <p className="text-muted-foreground mb-4">Manage your tasks with AI assistance</p>
          <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            Add Task
          </button>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-semibold">Notes</h2>
          </div>
          <p className="text-muted-foreground mb-4">Capture your thoughts and ideas</p>
          <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            Add Note
          </button>
        </div>
      </div>
    </div>
  )
}

export default HomePage