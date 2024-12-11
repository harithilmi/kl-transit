# KL Transit

A modern, multilingual web application for tracking public transportation routes in Kuala Lumpur, Malaysia.

## Live Demo

[https://kltransit.my/](https://kltransit.my/)

## Features

- Multilingual support (English & Bahasa Malaysia)
- Detailed stop information with street names and coordinates
- Interactive route maps
- Comprehensive transit data for Klang Valley
- User authentication with Clerk
- Responsive design for all devices
- Dark/Light theme support
- Suggestion for editing routes using our route editor
- Suggestion for adding new routes (soon)
- Creating fantasy routes (soon)

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Clerk
- **Maps**: Mapbox GL JS
- **Internationalization**: next-intl
- **Deployment**: Vercel

## Development

### Prerequisites

- Node.js 18+
- PostgreSQL
- Mapbox API key
- Clerk account

### Environment Setup

1. Clone the repository:

```bash
git clone https://github.com/yourusername/kl-transit.git
cd kl-transit
```

2. Copy the example .env file and create a new .env file:

```bash
cp .env.example .env
```

3. Configure environment variables:

- Mapbox API key
- Clerk API key
- ORS API key

4. Run the development server:

```bash
# Install dependencies
npm install

# Run database migrations
npm run db:push

# Run development server
npm run dev
```

## Internationalization

The app supports multiple languages through Next.js's app router and next-intl:

- 🇬🇧 English (`/en/*`)
- 🇲🇾 Bahasa Malaysia (`/ms/*`)

Add translations in `src/i18n/locales/`.

## Database Management

```bash
# Generate migration
npm run db:generate

# Push schema changes
npm run db:push

# Start Drizzle Studio
npm run db:studio
```

## Roadmap

- [x] Make it deploy
- [x] Scaffold basic ui with mock data
- [x] Add map integration
- [x] Implement internationalization
- [ ] Add realtime bus location from GTFS-RT
- [ ] Analytics page (posthog)
- [ ] Ratelimiting (upstash)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
