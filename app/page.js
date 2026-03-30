"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f7f5f2] px-6">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center">
        <div className="w-full max-w-xl rounded-3xl border border-black/5 bg-white p-10 text-center shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#c8a287]">
            NexDoor
          </p>

          <h1 className="text-4xl font-bold text-[#36454f]">
            NexDoor Client Dashboard
          </h1>

          <p className="mt-4 text-[#5f6b73]">
            Track your property journey in one place.
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
      </div>
    </main>
  );
}
