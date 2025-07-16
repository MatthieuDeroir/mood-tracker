# 📊 Mood Tracker - Next.js App

A comprehensive mood tracking application built with Next.js, ShadCN UI, and Drizzle ORM with PostgreSQL. This app allows users to track their daily mood, analyze patterns, and import/export data.

## Features

### 🎯 Core Features
- **Mood Tracking**: Record your daily mood on a scale of 0-10 with optional notes
- **Sleep & Health**: Track sleep hours, medication, and emotional states
- **Tags System**: Categorize entries with customizable tags (work, family, health, etc.)
- **Analytics Dashboard**: Visualize mood trends, patterns, and correlations
- **CSV Import/Export**: Import existing data or export your mood history

### 📈 Analytics Features
- Weekly mood trends
- Monthly statistics and averages
- Tag-based mood analysis
- Sleep-mood correlation tracking
- Best/worst day identification

### 🛠 Technical Features
- **Frontend**: Next.js 15.4, React 19, TypeScript, ShadCN UI, Tailwind CSS
- **Database**: PostgreSQL with Drizzle ORM
- **API**: REST API with Next.js App Router
- **Styling**: Tailwind CSS with ShadCN UI components

## Getting Started

### Prerequisites
- Node.js 18+ and pnpm
- PostgreSQL database

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mood-tracker
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your database configuration:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/mood_tracker
   ```

4. **Set up the database**
   ```bash
   # Generate migration files
   pnpm db:generate
   
   # Run migrations
   pnpm db:migrate
   ```

5. **Run the development server**
   ```bash
   pnpm dev
   ```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Database Schema

The application uses two main tables:

### Users Table
- `id` (UUID, Primary Key)
- `email` (VARCHAR, Unique)
- `name` (VARCHAR)
- `settings` (JSONB) - User preferences and mood labels
- `created_at` / `updated_at` (TIMESTAMP)

### Mood Entries Table
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key)
- `mood` (INTEGER, 0-10)
- `note` (TEXT, Optional)
- `tags` (JSONB Array)
- `sleep_hours` (REAL, Optional)
- `medication` (REAL, Optional)
- `emotions` (TEXT, Optional)
- `timestamp` / `created_at` / `updated_at` (TIMESTAMP)

## API Endpoints

### Mood Entries
- `POST /api/moods` - Create a new mood entry
- `GET /api/moods` - Get all mood entries
- `GET /api/moods/today` - Get today's mood entries with statistics

### Analytics
- `GET /api/analytics` - Get analytics data (trends, statistics, correlations)

### Data Import
- `POST /api/import` - Import mood data from CSV file

## CSV Import Format

The CSV import supports the following columns:
- `date` (required): YYYY-MM-DD or DD/MM/YYYY
- `mood` (required): Number 0-10
- `note` (optional): Free text
- `tags` (optional): Semicolon-separated (e.g., "work;friends")
- `sleepHours` (optional): Decimal number (e.g., 8.5)
- `medication` (optional): Decimal number
- `emotions` (optional): Free text

Example CSV:
```csv
date,mood,note,tags,sleepHours,medication,emotions
2024-01-15,7,"Good day at work",work;friends,8.5,0,calm;happy
2024-01-16,5,"Normal day",,,7.0,0.5,neutral
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── analytics/         # Analytics page
│   ├── import/           # CSV import page
│   └── page.tsx          # Main dashboard
├── components/            # React components
│   └── ui/               # ShadCN UI components
├── lib/                  # Utilities and configuration
│   ├── db/               # Database configuration and schema
│   └── services/         # Business logic
└── types/                # TypeScript type definitions
```

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm db:generate` - Generate Drizzle migrations
- `pnpm db:migrate` - Run database migrations
- `pnpm db:push` - Push schema changes to database

## Technologies Used

- **Frontend**: Next.js 15.4, React 19, TypeScript
- **UI Library**: ShadCN UI (Radix UI + Tailwind CSS)
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS
- **Package Manager**: pnpm

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
