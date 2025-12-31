# Bun Svelte - Feedback Application

Modern SvelteKit application for requesting and giving feedback. The application uses Bun runtime and SQLite database.

## Tech Stack

- **Framework**: SvelteKit 2.x
- **Runtime**: Bun
- **Database**: SQLite (Drizzle ORM)
- **Styling**: Tailwind CSS 4.x
- **UI Components**: Bits UI, Lucide Icons
- **Authentication**: JWT (jose)
- **Testing**: Playwright

## Prerequisites

- [Bun](https://bun.sh) (v1.0.0 or newer)

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd bun-svelte
```

2. Install dependencies:

```bash
bun install
```

3. Set up environment variables:
   Create a `.env` file in the project root:

```env
DATABASE_URL=./local.db
JWT_SECRET=change-me-to-a-long-random-string
ADMIN_USER=admin
```

4. Initialize the database:

```bash
bun run db:push
```

## Development

Start the development server:

```bash
bun run dev
```

The application will be available at `http://localhost:5173`

## Database

### Database Commands

- **Push schema changes**: `bun run db:push`
- **Generate migrations**: `bun run db:generate`
- **Run migrations**: `bun run db:migrate`
- **Open Drizzle Studio**: `bun run db:studio`

### Database Schema

The application includes the following database tables:

- `users` - Users
- `comments` - Comments
- `feedback_requests` - Feedback requests
- `feedback` - Feedback entries
- `valuation_question_groups` - Valuation question groups
- `valuation_questions` - Valuation questions
- `valuation_answers` - Valuation answers
- `valuation_group_answers` - Group-specific answers
- `feedback_drafts` - Feedback drafts

## Project Structure

```
src/
├── lib/
│   ├── components/          # UI components
│   │   ├── feedback/        # Feedback components
│   │   └── ui/              # General UI components
│   └── server/
│       ├── auth.ts          # Authentication
│       ├── db/              # Database configuration
│       └── session.ts       # Session management
├── routes/                  # SvelteKit routes
│   ├── admin/               # Admin view
│   ├── dashboard/           # Dashboard view
│   ├── login/               # Login page
│   └── register/            # Registration page
└── app.html                 # HTML template
```

## Available Commands

- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run preview` - Preview production build
- `bun run check` - Check TypeScript types
- `bun run check:watch` - Check types in watch mode
- `bun run format` - Format code with Prettier
- `bun run lint` - Run ESLint checks
- `bun run test` - Run E2E tests with Playwright
- `bun run db:push` - Update database schema
- `bun run db:generate` - Generate migrations
- `bun run db:migrate` - Run migrations
- `bun run db:studio` - Open Drizzle Studio UI

## Features

- ✅ User management (registration, login)
- ✅ Feedback request management
- ✅ Valuation question management
- ✅ Giving and receiving feedback
- ✅ Admin panel
- ✅ Dashboard view
- ✅ Feedback draft saving

## License

This project is private.
