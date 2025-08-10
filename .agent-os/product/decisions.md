# UpNext Decision Log

## Decision 1: Tech Stack Migration from React to Rails
**Date**: 2025-01-08  
**Status**: Decided  
**Decision Maker**: Product Owner  

### Context
Original project was started with React 19 + TypeScript + Vite + SQLite/Drizzle ORM. User requested migration to Rails-based architecture for better alignment with their preferred tech stack.

### Decision
Migrate from React-based SPA to Ruby on Rails 8.0+ with Hotwire (Turbo + Stimulus) for frontend interactivity.

### Rationale
- **Alignment with User Preferences**: User explicitly requested Rails 8.0+ with Ruby 3.2+ as preferred stack
- **Simplified Architecture**: Hotwire reduces JavaScript complexity while maintaining SPA-like experience
- **Cost Optimization**: Rails with GitHub Pages deployment eliminates hosting costs
- **Developer Experience**: User more familiar with Rails ecosystem than React
- **PWA Support**: Rails PWA gem provides native PWA functionality

### Alternatives Considered
1. **Keep React Stack**: Would maintain current codebase but conflicts with user preferences
2. **Hybrid Approach**: Rails API + React frontend would add unnecessary complexity
3. **Other Frameworks**: Vue, Angular considered but Rails preferred for full-stack simplicity

### Consequences
- **Positive**: Better alignment with user expertise, zero hosting costs, simpler architecture
- **Negative**: Need to rebuild existing React components, learning curve for Hotwire if unfamiliar
- **Mitigation**: Gradual migration approach, leveraging existing design patterns

## Decision 2: Local Storage Strategy with IndexedDB
**Date**: 2025-01-08  
**Status**: Decided  
**Decision Maker**: Product Owner  

### Context
Need to maintain privacy-first approach while ensuring reliable data persistence in browser environment.

### Decision
Use IndexedDB via Dexie.js for primary data storage with localStorage for preferences and session data.

### Rationale
- **Storage Capacity**: IndexedDB supports much larger data volumes than localStorage
- **Data Structures**: Better support for complex task/note objects and relationships
- **Performance**: Asynchronous operations prevent UI blocking
- **Privacy**: All data stays on user's device, no cloud storage
- **Reliability**: More robust than localStorage for critical data

### Alternatives Considered
1. **LocalStorage Only**: Limited capacity and synchronous operations
2. **WebSQL**: Deprecated technology with uncertain browser support
3. **Cloud Database**: Conflicts with privacy-first requirements
4. **File System API**: Limited browser support and complex implementation

### Consequences
- **Positive**: Reliable data persistence, good performance, maintains privacy
- **Negative**: More complex implementation than localStorage
- **Mitigation**: Use Dexie.js library to simplify IndexedDB operations

## Decision 3: AI Integration with User-Provided API Keys
**Date**: 2025-01-08  
**Status**: Decided  
**Decision Maker**: Product Owner  

### Context
Need AI functionality for conversational task management while maintaining privacy and cost control.

### Decision
Implement AI features using user-provided API keys for OpenAI, Anthropic, or compatible endpoints, with plans to explore browser-based models as free fallback.

### Rationale
- **Privacy Protection**: No user data sent through third-party proxies
- **Cost Control**: Users control their own API usage and costs
- **Flexibility**: Support multiple AI providers based on user preference
- **Transparency**: Users understand exactly what AI services they're using
- **Future-Proofing**: Browser-based AI models emerging as viable free alternatives

### Alternatives Considered
1. **Proxy AI Service**: Would compromise privacy and add operational costs
2. **No AI Features**: Would reduce product differentiation and user value
3. **Browser AI Only**: Current browser models may not meet quality expectations
4. **Embedded Models**: File size and performance concerns for web deployment

### Consequences
- **Positive**: Maintains privacy, gives users control, supports multiple providers
- **Negative**: Requires user to obtain API keys, potential setup friction
- **Mitigation**: Clear setup instructions, support for multiple providers, future browser AI fallback

## Decision 4: PWA Deployment via GitHub Pages
**Date**: 2025-01-08  
**Status**: Decided  
**Decision Maker**: Product Owner  

### Context
Need zero-cost hosting solution that supports PWA functionality and aligns with privacy-first approach.

### Decision
Deploy as static PWA via GitHub Pages using Rails asset compilation for completely free hosting.

### Rationale
- **Zero Cost**: GitHub Pages provides free hosting with custom domains
- **Privacy Alignment**: Static deployment means no server-side data processing
- **Reliability**: GitHub's infrastructure provides good uptime and performance
- **CI/CD Integration**: Natural integration with GitHub Actions for deployment
- **PWA Support**: Static files fully support PWA installation and offline functionality

### Alternatives Considered
1. **Traditional Rails Hosting**: Would require ongoing hosting costs (Heroku, DigitalOcean)
2. **Netlify/Vercel**: Good options but GitHub Pages aligns better with development workflow
3. **Self-Hosting**: Would require user technical expertise and infrastructure management
4. **Desktop Application**: Would limit accessibility and require separate mobile solution

### Consequences
- **Positive**: Zero hosting costs, excellent uptime, natural GitHub integration
- **Negative**: Static-only deployment, no server-side processing capabilities
- **Mitigation**: Design architecture to work entirely client-side, use service workers for advanced functionality

## Decision 5: Component Architecture with ViewComponent or Phlex
**Date**: 2025-01-08  
**Status**: Decided  
**Decision Maker**: Product Owner  

### Context
Need reusable UI components for consistent design and maintainable codebase in Rails environment.

### Decision
Use ViewComponent or Phlex for component-based UI development with Tailwind CSS styling.

### Rationale
- **Reusability**: Component-based architecture promotes code reuse
- **Maintainability**: Encapsulated components are easier to test and modify
- **Rails Integration**: Both options integrate well with Rails conventions
- **Performance**: Server-rendered components with minimal JavaScript
- **Team Familiarity**: Aligns with user's Rails preferences

### Alternatives Considered
1. **Plain Rails Views**: Would lead to code duplication and harder maintenance
2. **React Components**: Would conflict with Rails-first architecture decision
3. **Stimulus Components**: Good but less structured than ViewComponent/Phlex
4. **Custom Component System**: Would require building infrastructure from scratch

### Consequences
- **Positive**: Consistent UI, reusable components, good Rails integration
- **Negative**: Learning curve if unfamiliar with chosen component library
- **Mitigation**: Start with simple components and gradually adopt more advanced patterns

## Decision 6: Two-Panel Adaptive Interface Design
**Date**: 2025-01-08  
**Status**: Decided  
**Decision Maker**: Product Owner  

### Context
Need to balance AI chat functionality with traditional task management interface across device sizes.

### Decision
Implement split-screen layout with AI chat on left and task manager on right for desktop, with responsive single-panel view for mobile devices.

### Rationale
- **Optimal Screen Usage**: Desktop users can see both AI and tasks simultaneously
- **Mobile Optimization**: Single panel prevents cramped interface on small screens
- **User Workflow**: Supports natural conversation-to-action workflow
- **Visual Hierarchy**: Clear separation between input (chat) and output (tasks)

### Alternatives Considered
1. **Single Panel Only**: Would waste desktop screen real estate
2. **Tabbed Interface**: Would require switching between chat and tasks
3. **Overlay/Modal Chat**: Would interrupt task management workflow
4. **Three Panel Layout**: Would be too complex and crowded

### Consequences
- **Positive**: Efficient use of screen space, intuitive workflow, responsive design
- **Negative**: More complex responsive implementation
- **Mitigation**: Use CSS Grid/Flexbox for responsive layout, test thoroughly on various devices

---

## Decision Template

```markdown
## Decision N: [Title]
**Date**: YYYY-MM-DD  
**Status**: [Proposed/Decided/Deprecated/Superseded]  
**Decision Maker**: [Name/Role]  

### Context
[Situation and problem statement]

### Decision
[What was decided]

### Rationale
[Why this decision was made]

### Alternatives Considered
[Other options that were evaluated]

### Consequences
[Expected positive and negative outcomes, mitigation strategies]
```