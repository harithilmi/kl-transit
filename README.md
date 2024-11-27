# KL Transit

A modern web application for tracking public transportation routes in Kuala Lumpur, Malaysia.

## Live Demo

[https://kl-transit.vercel.app/](https://kl-transit.vercel.app/)

## Features

- 🔍 Search functionality for routes and destinations
- 📍 Detailed stop information with street names and coordinates
- 🗺️ Zone-based route organization
- 📱 Responsive design for mobile and desktop

## Tech Stack

- Next.js 15
- TypeScript
- Tailwind CSS

## Development

To run the project locally:

```bash
# Install dependencies
npm install
# Start development server
npm run dev
```

## Roadmap

- [x] Make it deploy
- [x] Scaffold basic ui with mock data
- [x] Add map integration
- [ ] Add realtime bus location from GTFS-RT
- [ ] Error management (sentry)
- [ ] Routing/routes page (parallel route)
- [ ] Analytics page (posthog)
- [ ] Ratelimiting (upstash)
