# YouTube RSS

A full-stack application that converts YouTube channels and playlists into RSS feeds for podcast consumption. Built with React/TypeScript frontend and Go/PocketBase backend.

## Tech Stack

**Frontend:**

- React 19 with TypeScript
- Vite for build tooling
- TanStack Router for routing
- TanStack Query for data fetching
- Tailwind CSS for styling
- Shadcn for UI components

**Backend:**

- Go
- PocketBase for database and API
- SQLite database
- Stripe for payments
- YouTube-dl for video processing
- FFmpeg for audio conversion

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
   git clone https://github.com/lsherman98/youtube-rss.git
   cd youtube-rss
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

4. **Set up environment variables:**

   ```bash
   cp .env.example .env
   cp .env.example pocketbase/.env
   ```

   Edit both `.env` files with your actual configuration values.

### Development Settings

- `DEV`: Set to `true` for development mode

### Proxy Configuration

- `PROXY`: Primary proxy provider (evomi, oxylabs, iproyal, etc.)
- Various proxy URLs for different providers

### External Services

- `RESEND_API_KEY`: For email notifications
- `STRIPE_API_KEY`: Stripe payment processing
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook verification

### Download Settings

- `DOWNLOAD_MAX_WORKERS`: Number of concurrent download workers
- `DOWNLOAD_QUEUE_SIZE`: Maximum queue size for downloads

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
   - PocketBase Admin: `http://localhost:8090/_/`


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
