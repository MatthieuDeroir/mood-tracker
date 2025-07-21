# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
```bash
pnpm dev              # Start development server (with turbopack)
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint
```

### Database Management
```bash
pnpm db:generate      # Generate Drizzle migrations
pnpm db:migrate       # Run database migrations
pnpm db:push          # Push schema changes to database
```

## Project Architecture

### Tech Stack
- **Frontend**: Next.js 15.4 with App Router, React 19, TypeScript
- **UI**: ShadCN UI components with Radix UI primitives and Tailwind CSS
- **Database**: PostgreSQL with Drizzle ORM
- **Charts**: Recharts for data visualization
- **Package Manager**: pnpm

### Database Schema
The application uses a sophisticated mood tracking schema with 7 main measures:

**Users Table**: Basic user management with settings stored as JSONB
**Mood Entries Table**: Core data model with:
- 6 integer metrics (0-10): `mood`, `energy`, `stress`, `work`, `social`, `alone`
- `sleepHours` (real): Sleep tracking in hours with decimals
- `tags` (JSONB array): Categorization system
- Optional fields: `note`, `medication`, `emotions`
- Constraint: At least one measure must be provided per entry

### Service Architecture
- **MoodService** (`src/lib/services/mood-service.ts`): Central business logic for CRUD operations, analytics calculation, and correlation analysis
- **Database layer** (`src/lib/db/`): Drizzle ORM configuration and schema definitions
- **API routes** (`src/app/api/`): RESTful endpoints following Next.js App Router conventions

### Key Components
- **Main Dashboard** (`src/app/page.tsx`): Integrated interface with tabbed navigation (Dashboard, Analytics, AI Assistant, New Entry)
- **UI Components** (`src/components/ui/`): ShadCN UI component library
- **Hooks** (`src/hooks/`): Custom React hooks for data management
- **Types** (`src/types/`): Centralized TypeScript type definitions

## API Endpoints

### Mood Management
- `POST /api/moods` - Create new mood entry
- `GET /api/moods` - Retrieve mood entries
- `GET /api/moods/today` - Get today's entries with statistics

### Analytics
- `GET /api/analytics` - Comprehensive analytics with correlations, trends, and statistics
- `GET /api/analytics/[period]` - Period-specific analytics (daily, weekly, monthly, yearly)

### Data Import
- `POST /api/import` - CSV import functionality

## Development Patterns

### Default User Pattern
The application uses a default demo user (`00000000-0000-0000-0000-000000000001`) for development and testing. This pattern is embedded in the MoodService class.

### Multi-Metric System
Unlike simple mood trackers, this application supports 7 different well-being measures. When working with mood entries:
- All measures are optional but at least one must be provided
- Use database constraints to enforce valid ranges (0-10)
- Consider correlations between different measures in analytics

### Internationalization Ready
The application has a localization structure in place with French as the primary language. Type definitions include multi-language support patterns.

## Data Import/Export

### CSV Import Format
Supports flexible CSV import with these recognized columns:
- `date` (required): YYYY-MM-DD or DD/MM/YYYY formats
- `mood` (required): 0-10 scale
- `sleepHours`, `energy`, `stress`, `work`, `social`, `alone`: Optional numeric values
- `tags`: Semicolon-separated strings
- `note`, `emotions`: Free text fields

## Important Notes

### Database Configuration
- Uses PostgreSQL (not SQLite despite presence of database.sqlite files)
- Connection string: `DATABASE_URL` environment variable
- Drizzle configuration in `drizzle.config.ts` points to PostgreSQL dialect

### Dual Codebase Structure
Note: There appears to be a legacy Deno-based version in the `mood-tracker/` subdirectory. The main Next.js application is in the root `src/` directory. Always work with the root-level Next.js application unless specifically instructed otherwise.

### UI Consistency
- Uses CSS custom properties for theming (`hsl(var(--chart-1))` pattern)
- ShadCN UI components maintain consistent styling
- Recharts integration with theme-aware colors
- Mobile-responsive design patterns throughout