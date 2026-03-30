"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    window.location.href = "/dashboard";
  }

  return (
    <main className="min-h-screen bg-[#f7f5f2] text-[#36454f] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-sm uppercase tracking-[0.2em] text-[#c8a287] font-semibold mb-2">
            NexDoor Seller Portal
          </p>
          <h1 className="text-4xl font-bold mb-3">Client Login</h1>
          <p className="text-[#5f6b73]">
            Sign in to view your property dashboard.
          </p>
        </div>

        <div className="rounded-3xl bg-white border border-black/5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                className="w-full rounded-xl bg-[#faf9f7] border border-black/10 px-4 py-3 outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                className="w-full rounded-xl bg-[#faf9f7] border border-black/10 px-4 py-3 outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                required
              />
            </div>

            {errorMsg ? (
              <div className="rounded-xl bg-[#fff1f1] border border-red-200 px-4 py-3 text-sm text-red-600">
                {errorMsg}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#36454f] text-white py-3 font-medium shadow-sm hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}