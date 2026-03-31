"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

const ADMIN_EMAILS = [
  "bjornlim@nexdoor.sg",
  "bjornlimdongxian@gmail.com",
  "abigailtang@nexdoor.sg",
  "daveteo@nexdoor.sg",
].map((email) => email.toLowerCase());

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!ADMIN_EMAILS.includes(normalizedEmail)) {
      setErrorMsg("This email is not authorised for admin access.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    if (!data?.user?.email || !ADMIN_EMAILS.includes(data.user.email.toLowerCase())) {
      await supabase.auth.signOut();
      setErrorMsg("This account is not authorised for admin access.");
      setLoading(false);
      return;
    }

    window.location.href = "/admin";
  }

  async function handleGoogleLogin() {
    setLoading(true);
    setErrorMsg("");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/admin`,
      },
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f5f2] px-6">
      <div className="w-full max-w-md rounded-3xl border border-black/5 bg-white p-8 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
        
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#c8a287]">
          NexDoor Internal
        </p>

        <h1 className="mb-3 text-3xl font-bold text-[#36454f]">
          Admin Login
        </h1>

        <p className="mb-6 text-[#5f6b73]">
          Sign in to access the NexDoor admin dashboard.
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm text-[#36454f]">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@nexdoor.sg"
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-[#36454f] outline-none focus:border-[#c8a287]"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-[#36454f]">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-[#36454f] outline-none focus:border-[#c8a287]"
              required
            />
          </div>

          {errorMsg ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {errorMsg}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#36454f] py-3 font-medium text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-black/10" />
          <span className="text-xs text-[#7b8790]">OR</span>
          <div className="h-px flex-1 bg-black/10" />
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full rounded-xl border border-black/10 py-3 font-medium text-[#36454f] transition hover:bg-black/5 disabled:opacity-60"
        >
          Continue with Google
        </button>

      </div>
    </div>
  );
}
