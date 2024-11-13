import { type ReactNode } from "react";
import { HomeSearchForm } from "~/app/components/home-search-form";

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
      </div>
    </main>
  );
}
