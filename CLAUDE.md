# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UpNext is an AI-first task and note manager that runs entirely on the user's device with no backend or hosting requirements. It's built as a React single-page application with local SQLite storage using Drizzle ORM.

## Tech Stack

- **Frontend**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS 4.x with custom design system
- **Routing**: React Router DOM
- **State Management**: TanStack React Query
- **Database**: SQLite with Drizzle ORM via better-sqlite3
- **Icons**: Lucide React
- **Utilities**: clsx, tailwind-merge
- **Animation**: tailwindcss-animate

## Common Commands

```bash
# Development
npm run dev          # Start development server

# Build
npm run build        # TypeScript compilation + production build
npm run preview      # Preview production build

# Code Quality
npm run lint         # ESLint with TypeScript support
```

## Architecture

### Database Layer (`src/lib/db/`)
- **schema.ts**: Drizzle ORM schema definitions for `tasks` and `notes` tables
- **index.ts**: Database connection using better-sqlite3 driver
- **drizzle.config.ts**: Drizzle configuration for schema management
- Uses SQLite with local file storage (`./local.db`)

### Application Structure
- **src/main.tsx**: Application entry point
- **src/App.tsx**: Root component with QueryClient and Router setup
- **src/pages/**: Page-level components (currently HomePage with task/note cards)
- **src/lib/**: Shared utilities and database layer
  - **db/**: Database schema and connection
  - **utils.ts**: Utility functions
- **src/styles/globals.css**: Global styles and CSS custom properties
- **src/vite-env.d.ts**: Vite TypeScript definitions

### Design System
The project uses a comprehensive TailwindCSS design system with:
- CSS custom properties for theming (HSL color system)
- Dark mode support via class strategy
- Consistent spacing, typography, and component patterns
- Custom animations and transitions

### Data Models
- **Tasks**: id (primary key), title (required), description (optional), completed (boolean, default false), createdAt, updatedAt
- **Notes**: id (primary key), title (required), content (required), createdAt, updatedAt

## Current Implementation Status

- **Database**: Schema defined with Drizzle ORM, better-sqlite3 driver configured
- **UI**: Basic homepage with task and note card placeholders (buttons not yet functional)
- **Routing**: Single route configured for homepage
- **State Management**: TanStack React Query client set up but not yet used
- **Styling**: TailwindCSS theme system with CSS custom properties implemented

## Development Notes

- The app is designed to work entirely offline with local SQLite storage
- Uses modern React patterns (React 19 with concurrent features)
- TypeScript strict mode enabled with comprehensive linting rules
- No test framework currently configured
- ESLint configured for React/TypeScript with strict unused variable checking
- Database migrations and CRUD operations not yet implemented