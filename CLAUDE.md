# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UpNext is an AI-first task and note manager that runs entirely on the user's device with no backend or hosting requirements. It features a conversational two-panel interface with AI chat on the left and organized task management (Today/Upcoming/Completed) on the right. Built as a Rails 8.0+ Progressive Web App (PWA) with Hotwire for interactions and IndexedDB for client-side storage.

## Tech Stack

- **Framework**: Ruby on Rails 8.0+ with Ruby 3.4+
- **Frontend**: Hotwire (Turbo + Stimulus) for SPA-like interactions
- **Styling**: TailwindCSS with Rails asset pipeline
- **Database**: IndexedDB via Dexie.js (client-side storage)
- **PWA**: Rails PWA gem with service workers and manifest
- **JavaScript**: ImportMaps for module management
- **Icons**: Inline SVG icons
- **Deployment**: Static site generation for GitHub Pages

## Common Commands

```bash
# Development
rails server         # Start development server (port 3000)
bin/dev              # Start with asset watching

# Build
rails assets:precompile     # Compile assets for production
rake generate:static_site   # Generate static site for deployment

# Code Quality
rubocop              # Ruby style guide enforcement
brakeman             # Security vulnerability scanning
```

## Architecture

### Database Layer (`app/javascript/database.js`)
- **IndexedDB**: Client-side database using Dexie.js wrapper
- **TaskService**: CRUD operations for tasks with completion tracking
- **NoteService**: CRUD operations for notes with rich content
- **DataService**: Export/import functionality for backup
- No server-side database - completely browser-based storage

### Application Structure
- **app/controllers/home_controller.rb**: Main application controller
- **app/views/home/index.html.erb**: Main application view with Stimulus controllers
- **app/views/layouts/application.html.erb**: Application layout with PWA configuration
- **app/javascript/controllers/**: Stimulus controllers for client-side interactions
  - **tasks_controller.js**: Task management with IndexedDB operations
  - **notes_controller.js**: Note management with modal views
- **app/javascript/database.js**: IndexedDB wrapper with Dexie.js
- **app/views/pwa/**: PWA manifest and service worker
- **config/importmap.rb**: JavaScript module configuration

### Design System
The project uses a comprehensive TailwindCSS design system with:
- CSS custom properties for theming (HSL color system)
- Dark mode support via class strategy
- Consistent spacing, typography, and component patterns
- Custom animations and transitions

### Data Models (IndexedDB)
- **Tasks**: id (auto-increment), title (required), description (optional), completed (boolean, default false), createdAt, updatedAt
- **Notes**: id (auto-increment), title (required), content (required), createdAt, updatedAt
- **Export Format**: JSON with tasks, notes, exportDate, and version for backup/restore

## Current Implementation Status

- **Framework**: Rails 8.0+ application fully configured with Hotwire ✅
- **Interface**: AI-first two-panel layout with chat (left) and task tabs (right) ✅ 
- **Database**: IndexedDB with Dexie.js wrapper and complete CRUD operations ✅
- **UI**: Responsive Today/Upcoming/Completed task organization with Stimulus controllers ✅
- **Design**: Complete TailwindCSS design system with semantic colors and mobile-first responsive layout ✅
- **PWA**: Service worker, manifest, and offline caching implemented ✅
- **Deployment**: GitHub Actions workflow for static site generation ✅

**Next Priority**: Implement interactive functionality for AI chat responses, tab switching, and task creation via chat interface.

## Development Notes

- The app runs entirely offline with IndexedDB browser storage
- Uses modern Rails patterns (Rails 8.0+ with Hotwire)
- Ruby style guide enforcement with RuboCop
- Security scanning with Brakeman
- No test framework currently configured
- Static site generation for GitHub Pages deployment
- Service worker provides offline functionality and app installation
- Always check the ROADMAP at c:\1GitRepos\UpNext\.agent-os\product\roadmap.md before creating spec and also update the ROADMAP after completing new specs