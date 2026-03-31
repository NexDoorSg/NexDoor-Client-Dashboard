"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

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

  async function handleGoogleLogin() {
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "https://dashboard.nexdoor.sg/dashboard",
      },
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
    }
  }

  async function handleForgotPassword() {
    setErrorMsg("");
    setSuccessMsg("");

    if (!email.trim()) {
      setErrorMsg("Please enter your email address first.");
      return;
    }

    try {
      setSendingReset(true);

      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: "https://dashboard.nexdoor.sg/reset-password",
        }
      );

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      setSuccessMsg(
        "Password reset email sent. Please check your inbox and click the link in the email."
      );
    } catch (error) {
      setErrorMsg("Unable to send reset email. Please try again.");
    } finally {
      setSendingReset(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f4ef] px-6 py-10 flex items-center justify-center">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
        <p className="text-sm font-semibold tracking-[0.25em] uppercase text-[#c8a287]">
          NexDoor Seller Portal
        </p>

        <h1 className="mt-4 text-4xl font-bold text-[#36454f]">
          Client Login
        </h1>

        <p className="mt-3 text-sm leading-6 text-[#5d6873]">
          Sign in to view your property dashboard.
        </p>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading || sendingReset}
          className="mt-6 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-[#36454f] transition hover:bg-black/5 disabled:opacity-60"
        >
          Continue with Google
        </button>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-black/10" />
          <span className="text-xs uppercase tracking-[0.2em] text-[#8b95a1]">
            or
          </span>
          <div className="h-px flex-1 bg-black/10" />
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#36454f]">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-[#36454f] outline-none focus:border-[#c8a287]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#36454f]">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              required
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-[#36454f] outline-none focus:border-[#c8a287]"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={loading || sendingReset}
              className="text-sm font-medium text-[#36454f] underline underline-offset-4 hover:opacity-70 disabled:opacity-60"
            >
              {sendingReset ? "Sending reset email..." : "Forgot password?"}
            </button>
          </div>

          {errorMsg ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMsg}
            </div>
          ) : null}

          {successMsg ? (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {successMsg}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading || sendingReset}
            className="w-full rounded-xl bg-[#36454f] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
