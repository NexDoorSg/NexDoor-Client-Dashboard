"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative min-h-screen flex items-center justify-center px-6">

      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1508962914676-134849a727f0?q=80&w=2070&auto=format&fit=crop')",
        }}
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-xl rounded-3xl bg-white/90 backdrop-blur-md p-10 text-center shadow-[0_8px_30px_rgba(0,0,0,0.2)]">

        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#c8a287]">
          NexDoor
        </p>

        <h1 className="text-4xl font-bold text-[#36454f]">
          NexDoor Client Dashboard
        </h1>

        <p className="mt-4 text-[#5f6b73]">
          Track your property sale in one place.
        </p>

        <div className="mt-8 flex justify-center">
          <Link
            href="/login"
            className="rounded-xl bg-[#36454f] px-6 py-3 font-medium text-white transition hover:opacity-90"
          >
            Client Login
          </Link>
        </div>
      </div>
    </main>
  );
}
