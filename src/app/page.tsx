import { type ReactNode } from "react";
import { HomeSearchForm } from "~/app/components/home-search-form";
import Link from "next/link";

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

        {/* About Section */}
        <Card className="w-full max-w-2xl">
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold">About This Project</h2>
            <p className="text-white/80">
              KL Transit is an open-source project aimed at making public transportation in Kuala Lumpur more accessible. 
              It provides easy access to bus routes, stops, and service information.
            </p>
            <div className="flex items-center gap-2 text-sm">
              <Link
                href="https://github.com/harithilmi/kl-transit"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 hover:bg-white/20 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                Contribute on GitHub
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
