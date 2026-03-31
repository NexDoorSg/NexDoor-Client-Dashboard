"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let mounted = true;

    async function initRecovery() {
      try {
        setLoading(true);
        setErrorMsg("");
        setMessage("");

        // When Supabase redirects from email recovery, the access token is usually in the URL hash.
        const hash = window.location.hash.startsWith("#")
          ? window.location.hash.substring(1)
          : "";

        const params = new URLSearchParams(hash);
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");
        const type = params.get("type");

        if (type === "recovery" && access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });

          if (error) {
            setErrorMsg(error.message || "Invalid or expired reset link.");
            return;
          }

          // Clean up the URL after session is set
          window.history.replaceState({}, document.title, "/reset-password");
        } else {
          // fallback if session already exists
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (!session) {
            setErrorMsg("This reset link is invalid, missing, or has expired.");
            return;
          }
        }

        if (mounted) {
          setMessage("Please enter your new password.");
        }
      } catch (error) {
        setErrorMsg("Unable to verify reset link.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initRecovery();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    setMessage("");

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      setMessage("Password updated successfully. Redirecting to login...");

      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
    } catch (error) {
      setErrorMsg("Failed to update password.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f4ef] px-6 py-10 flex items-center justify-center">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
        <p className="text-sm font-semibold tracking-[0.25em] uppercase text-[#c8a287]">
          NexDoor Client Portal
        </p>

        <h1 className="mt-4 text-4xl font-bold text-[#36454f]">
          Reset password
        </h1>

        <p className="mt-3 text-sm leading-6 text-[#5d6873]">
          Set a new password for your account.
        </p>

        {loading ? (
          <p className="mt-6 text-sm text-[#36454f]">Verifying reset link...</p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#36454f]">
                New password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-[#36454f] outline-none focus:border-[#c8a287]"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#36454f]">
                Confirm new password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-[#36454f] outline-none focus:border-[#c8a287]"
                required
              />
            </div>

            {errorMsg ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMsg}
              </div>
            ) : null}

            {message ? (
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {message}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-[#36454f] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
            >
              {saving ? "Updating password..." : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
