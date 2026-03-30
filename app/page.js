import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold">NexDoor Client Dashboard</h1>
        <p className="text-white/70">Track your property sale in one place.</p>
        <Link
          href="/login"
          className="inline-block rounded-xl bg-white text-black px-6 py-3 font-medium"
        >
          Client Login
        </Link>
      </div>
    </main>
  );
}