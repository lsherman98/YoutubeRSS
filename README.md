# YouTube RSS

A full-stack application that converts YouTube videos and enables users to create private RSS feeds for podcast consumption. 

## Tech Stack

**Frontend:**

- React 19 with TypeScript
- Vite 
- TanStack Router
- TanStack Query
- Tailwind CSS
- Shadcn for UI components

**Backend:**

- Go
- PocketBase
- SQLite
- Stripe
- yt-dlp
- FFmpeg

## Prerequisites

Before running this project, make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or higher)
- [pnpm](https://pnpm.io/) (recommended package manager)
- [Go](https://golang.org/) (v1.25 or higher)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) (for video downloading)
- [FFmpeg](https://ffmpeg.org/) (for video processing)

## Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/lsherman98/YoutubeRSS
   cd YoutubeRSS
   ```

2. **Install frontend dependencies:**

   ```bash
   pnpm install
   ```

3. **Install Go dependencies:**

   ```bash
   cd pocketbase
   go mod download
   cd ..
   ```

## Running the Application

### Development Mode

1. **Start the PocketBase backend:**

   ```bash
   pnpm run pb:serve
   ```

   This will start the PocketBase server on `http://localhost:8090`

2. **In a new terminal, start the frontend development server:**

   ```bash
   pnpm run dev
   ```

   This will start the Vite development server on `http://localhost:5173`

3. **Access the application:**
   - Frontend: `http://localhost:5173`
   - Admin Dashboard: `http://localhost:8090/_/`

## Project Structure

```
yt-rss/
├── src/                    # Frontend React application
│   ├── components/         # Reusable UI components
│   ├── routes/            # Application routes
│   ├── lib/               # Utilities and API clients
│   └── hooks/             # Custom React hooks
├── pocketbase/            # Backend Go application
│   ├── pb_hooks/          # PocketBase event hooks
│   ├── pb_data/           # Database and storage
│   ├── migrations/        # Database migrations
│   ├── downloader/        # YouTube download logic
│   ├── rss_utils/         # RSS feed generation
│   └── ytdlp/             # YouTube-dl integration
├── public/                # Static assets
└── dist/                  # Production build output
```
