# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UIGen is an AI-powered React component generator with live preview. Users describe components in natural language, and Claude generates React code that runs in a virtual file system with real-time preview.

## Tech Stack

- **Framework**: Next.js 15 (App Router) with React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: Prisma with SQLite
- **AI**: Anthropic Claude via Vercel AI SDK
- **Code Transformation**: Babel standalone for JSX/TSX transformation
- **Testing**: Vitest with React Testing Library

## Common Commands

### Development
```bash
npm run dev              # Start development server with Turbopack
npm run dev:daemon       # Start dev server in background, logs to logs.txt
```

### Build and Deployment
```bash
npm run build            # Build for production
npm start                # Start production server
```

### Testing
```bash
npm test                 # Run all tests with Vitest
```

### Database
```bash
npm run setup            # Install deps + generate Prisma client + run migrations
npm run db:reset         # Reset database (destructive)
npx prisma generate      # Regenerate Prisma client
npx prisma migrate dev   # Create and apply new migration
```

### Linting
```bash
npm run lint             # Run ESLint
```

## Architecture

### Virtual File System

The core of UIGen is a **virtual file system** that exists entirely in memory—no files are written to disk during component generation. This enables instant previews and live editing.

- **Implementation**: `src/lib/file-system.ts` - `VirtualFileSystem` class
- **Key Features**:
  - Full POSIX-like operations (create, read, update, delete, rename)
  - Directory hierarchy with parent-child relationships
  - Serialization/deserialization for database persistence
  - Path normalization and @/ alias support

### AI Chat & Code Generation Flow

1. **User Input**: User sends message via `ChatInterface` component
2. **API Route**: `src/app/api/chat/route.ts` receives request with messages and current file system state
3. **AI Processing**: Claude receives:
   - System prompt (`src/lib/prompts/generation.tsx`)
   - Conversation history
   - Two AI tools: `str_replace_editor` and `file_manager`
4. **Tool Execution**: AI uses tools to manipulate the virtual file system
5. **State Sync**: Tool calls trigger React context updates via `FileSystemContext`
6. **Database Persistence**: For authenticated users, conversation and files are saved to Prisma database on completion

### Preview System

The preview system transforms virtual files into executable code in the browser:

1. **JSX Transformation** (`src/lib/transform/jsx-transformer.ts`):
   - Uses Babel standalone to transpile JSX/TSX to JavaScript
   - Handles TypeScript files
   - Detects and processes imports
   - Collects CSS imports

2. **Import Map Generation**:
   - Creates ES Module import maps for all files
   - Maps @/ aliases to root directory
   - Third-party packages loaded from esm.sh CDN
   - Local files converted to blob URLs

3. **HTML Generation**:
   - Generates complete HTML document with:
     - Tailwind CDN for styling
     - Import maps for module resolution
     - Error boundaries for runtime errors
     - Syntax error display for compilation failures

4. **Preview Rendering** (`src/components/preview/PreviewFrame.tsx`):
   - Iframe sandbox for isolated execution
   - Automatic reload on file changes
   - `/App.jsx` is the required entry point

### React Contexts

- **FileSystemContext** (`src/lib/contexts/file-system-context.tsx`):
  - Manages virtual file system state
  - Provides file CRUD operations
  - Handles tool call synchronization
  - Tracks selected file for editor

- **ChatContext** (`src/lib/contexts/chat-context.tsx`):
  - Manages conversation state
  - Handles message streaming from AI
  - Processes tool calls from AI responses
  - Integrates with FileSystemContext

### Authentication & Persistence

- **Auth System** (`src/lib/auth.ts`):
  - JWT-based session management using jose library
  - Stored in HTTP-only cookies
  - Password hashing with bcrypt

- **Anonymous Work Tracking** (`src/lib/anon-work-tracker.ts`):
  - Tracks anonymous user sessions
  - Provides migration path to authenticated accounts

- **Database Schema** (`prisma/schema.prisma`):
  - `User`: Authentication and profile
  - `Project`: Stores conversation history (`messages`) and virtual file system state (`data`)
  - Projects linked to users with cascade delete

### AI Tools

Two tools are exposed to Claude for manipulating the virtual file system:

1. **str_replace_editor** (`src/lib/tools/str-replace.ts`):
   - `view`: Display file/directory contents with line numbers
   - `create`: Create new files with automatic parent directory creation
   - `str_replace`: Find and replace text in files
   - `insert`: Insert text at specific line number

2. **file_manager** (`src/lib/tools/file-manager.ts`):
   - `rename`: Rename or move files/directories
   - `delete`: Delete files/directories recursively

### Component Structure

- **UI Components** (`src/components/ui/`): Radix UI primitives with Tailwind styling
- **Editor Components** (`src/components/editor/`):
  - `CodeEditor.tsx`: Monaco editor integration
  - `FileTree.tsx`: Interactive file browser
- **Chat Components** (`src/components/chat/`):
  - `ChatInterface.tsx`: Main chat UI
  - `MessageList.tsx`: Message rendering
  - `MessageInput.tsx`: User input
  - `MarkdownRenderer.tsx`: Markdown message rendering
- **Preview Components** (`src/components/preview/`):
  - `PreviewFrame.tsx`: Sandboxed iframe preview

### Key Constraints

- Every project **must** have a `/App.jsx` file as the entry point
- All imports for local files use `@/` alias (e.g., `import Foo from '@/components/Foo'`)
- No HTML files are created—`/App.jsx` is the root component
- Virtual file system operates at root level (`/`)
- Styling is done with Tailwind CSS, not inline styles
- Environment variable `ANTHROPIC_API_KEY` is optional—without it, static mock code is returned

### Testing

Tests use Vitest with jsdom environment:
- Component tests in `__tests__` directories adjacent to source files
- Use `@testing-library/react` for component testing
- Path aliases (@/) work in tests via `vite-tsconfig-paths`

### Mock Provider Mode

When `ANTHROPIC_API_KEY` is not set:
- Falls back to mock provider (`src/lib/provider.ts`)
- Returns static example code instead of AI-generated responses
- Limited to 4 steps to prevent repetition
- Useful for testing without API costs
- The database schema is definited in the @prisma/schema.prisma file. Reference it anytime you need to understand the structure of data stored in teh database.