import { type ReactNode } from "react";
import { HomeSearchForm } from "~/app/components/home-search-form";
import { StopMap } from "~/app/components/stop-map";
import * as fs from 'fs/promises';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
		<div
			className={`rounded-lg bg-white/10 p-6 shadow-xl backdrop-blur-sm ${className}`}
		>
			{children}
		</div>
	);
}

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Read and parse CSV files
  const stopsFile = await fs.readFile(path.join(process.cwd(), 'src/data/processed/stops.csv'), 'utf-8');
  const servicesFile = await fs.readFile(path.join(process.cwd(), 'src/data/processed/services.csv'), 'utf-8');

  const stops = parse(stopsFile, {
    columns: true, // Use headers from CSV
    skip_empty_lines: true
  }) as {
    stop_id: string
    stop_code: string
    stop_name: string
    street_name: string
    latitude: string
    longitude: string
    stop_name_old: string
    street_name_old: string
  }[];

  const services = parse(servicesFile, {
    columns: true, // Use headers from CSV
    skip_empty_lines: true
  }) as {
    route_number: string
    stop_id: string
    direction: string
    zone: string
    sequence: string
  }[];

  // Transform stops to match StopMap component expectations
  const transformedStops = stops.map(stop => ({
    stopId: stop.stop_id,
    stopName: stop.stop_name,
    stopLat: stop.latitude,
    stopLon: stop.longitude,
  }));

  // Group services by stop
  const stopRoutes = services.reduce((acc: Record<string, { route_number: string; direction: string }[]>, service) => {
    if (!acc[service.stop_id]) {
      acc[service.stop_id] = [];
    }
    acc[service.stop_id]?.push({
      route_number: service.route_number,
      direction: service.direction,
    });
    return acc;
  }, {});

  
  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-[#2e026d] to-[#15162c] px-4 py-16 text-white">
      <div className="container flex max-w-6xl flex-col items-center gap-12">
        {/* Hero Section */}
        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-5xl font-bold tracking-tight sm:text-[5rem]">
            KL Transit
          </h1>
          <p className="text-lg text-white/80">
            Your guide to public transportation in Kuala Lumpur
          </p>
        </div>

        {/* Search Section */}
        <Card className="w-full max-w-2xl">
          <div className="flex flex-col gap-4">
            <HomeSearchForm />
          </div>
        </Card>

        {/* Quick Info Cards */}
        <StopMap stops={transformedStops} stopRoutes={stopRoutes} />
      </div>
    </main>
  );
}
