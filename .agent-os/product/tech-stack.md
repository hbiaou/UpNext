# UpNext Tech Stack

## Architecture Overview

UpNext is built as a Progressive Web App (PWA) using Ruby on Rails 8.0+ with a focus on local-first functionality, privacy, and zero-cost operation. The application leverages modern Rails features like Hotwire for interactive frontend experiences without heavy JavaScript dependencies.

## Core Technologies

### Backend Framework
- **Ruby on Rails 8.0+** with Ruby 3.2+
- **Hotwire (Turbo + Stimulus)** for SPA-like interactions without React/Vue complexity
- **Rails PWA gem** for native PWA functionality
- **ImportMaps** for JavaScript module management (no Node.js bundling required)

### Frontend Architecture
- **Hotwire Turbo** for page navigation and real-time updates
- **Stimulus** for JavaScript controllers and interactive components
- **ViewComponent or Phlex** for component-based UI development
- **Turbo Streams** for streaming AI responses in real-time

### UI & Styling
- **Tailwind CSS** for utility-first styling and consistent design system
- **Lucide Icons** via stimulus-components for consistent iconography
- **CSS Animations** with Tailwind for smooth transitions and micro-interactions
- **Responsive Design** with mobile-first approach for two-panel/single-panel adaptive layout

### Data Persistence
- **IndexedDB** via Dexie.js for persistent browser storage
- **Local Storage** for user preferences and session data
- **JSON Export/Import** for backup and data transfer functionality
- **No Backend Database** - completely client-side data management

### PWA Infrastructure
- **Service Workers** via Rails PWA helpers for offline functionality
- **Workbox** for sophisticated offline caching strategies
- **Web App Manifest** for native app-like installation experience
- **Background Sync** for queued actions when connectivity returns

## AI Integration

### API Management
- **User-Provided API Keys** for OpenAI, Anthropic, or compatible endpoints
- **Client-Side API Calls** to maintain privacy (no server proxy)
- **API Key Storage** in encrypted local storage with user consent

### Future AI Options
- **WebLLM** exploration for browser-based language models
- **ONNX Runtime Web** for local model inference as free fallback
- **Streaming Responses** via Turbo Streams for real-time AI chat

### AI Features Implementation
- **Stimulus Controllers** for AI chat interface management
- **Prompt Engineering** templates for task creation and management
- **Natural Language Processing** for date parsing and task categorization

## Deployment & Hosting

### Static Site Generation
- **GitHub Pages** for completely free hosting
- **Rails Assets Pipeline** for static asset compilation
- **Precompiled Assets** via `rails assets:precompile`

### CI/CD Pipeline
- **GitHub Actions** for automated testing and deployment
- **RSpec & Capybara** for comprehensive test coverage
- **Asset Optimization** and compression for performance

## Development Environment

### Local Development
- **Port 3000** for consistent development server (`rails server -p 3000`)
- **Hot Reloading** via Rails development mode
- **Live Styling** with Tailwind CSS watch mode

### Code Quality
- **RuboCop** for Ruby style guide enforcement
- **ESLint** for JavaScript code quality (minimal JS usage)
- **Automated Testing** with RSpec and Capybara before commits

## Security & Privacy

### Data Protection
- **Client-Side Only** data processing and storage
- **No Server Logging** of user data or tasks
- **Encrypted Local Storage** for sensitive information like API keys

### API Security
- **CORS Configuration** for safe API calls from browser
- **Rate Limiting** awareness for user's own API quotas
- **Error Handling** to prevent API key exposure in logs

## Performance Considerations

### Loading & Responsiveness
- **Minimal JavaScript Bundle** via ImportMaps and Stimulus
- **Efficient CSS** with Tailwind's purging for production builds
- **Lazy Loading** for non-critical components and features

### Offline Performance
- **Service Worker Caching** for core application functionality
- **Background Sync** for task updates when connectivity returns
- **Local Data Persistence** ensuring no data loss during offline periods

### Mobile Optimization
- **Touch-Friendly Interface** with appropriate target sizes
- **Responsive Typography** and spacing for various screen sizes
- **PWA Installation Prompts** for native app experience on mobile

## Scalability & Maintenance

### Architecture Benefits
- **No Server Costs** eliminating infrastructure scaling concerns
- **Client-Side Scaling** with browser performance as the primary limit
- **Modular Components** for easy feature additions and maintenance

### Update Strategy
- **Service Worker Updates** for seamless application updates
- **Backward Compatibility** for local data migrations
- **Feature Flags** via local settings for gradual feature rollouts

## Third-Party Dependencies

### Core Dependencies (Free & Open Source)
- Rails 8.0+ ecosystem (MIT License)
- Hotwire (MIT License)
- Tailwind CSS (MIT License)
- Dexie.js (Apache 2.0 License)
- Lucide Icons (ISC License)

### Development Dependencies
- RSpec (MIT License)
- Capybara (MIT License)
- RuboCop (MIT License)

### Optional User Costs
- **AI API Usage** (user's choice of provider and usage level)
- **Domain Name** (optional for custom GitHub Pages domain)