"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const ADMIN_EMAILS = [
  "bjornlim@nexdoor.sg",
  "abigailtang@nexdoor.sg",
  "daveteo@nexdoor.sg",
].map((email) => email.toLowerCase());

export default function AdminHomePage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState("");

  useEffect(() => {
    checkAccess();
  }, []);

  async function checkAccess() {
    try {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data?.user) {
        window.location.href = "/admin/login";
        return;
      }

      const email = (data.user.email || "").trim().toLowerCase();
      setCurrentUserEmail(email);

      if (!ADMIN_EMAILS.includes(email)) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setIsAdmin(true);
    } catch (err) {
      console.error("Admin access check failed:", err);
      window.location.href = "/admin/login";
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/admin/login";
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
        <p className="text-lg">Loading admin page...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black px-6">
        <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-neutral-900 p-8 shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#c8a287]">
            NexDoor Internal
          </p>
          <h1 className="mb-3 text-3xl font-bold text-white">Access denied</h1>
          <p className="mb-6 text-neutral-300">
            You are signed in as{" "}
            <span className="font-semibold">{currentUserEmail || "an unknown user"}</span>,
            but this page is only for approved admin accounts.
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleLogout}
              className="w-full rounded-xl bg-white py-3 font-medium text-black transition hover:opacity-90"
            >
              Log out
            </button>

            <Link
              href="/admin/login"
              className="w-full rounded-xl border border-white/15 py-3 text-center font-medium text-white transition hover:bg-white/5"
            >
              Go to admin login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#c8a287]">
              NexDoor Internal
            </p>
            <h1 className="text-4xl font-bold">Admin Home</h1>
            <p className="mt-3 max-w-2xl text-neutral-300">
              Choose what you want to manage. Use client onboarding to create a
              new client and link a property, or go to seller case management to
              manage listing progress, viewings, feedback, and offers.
            </p>
            <p className="mt-2 text-sm text-neutral-500">
              Signed in as {currentUserEmail}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-xl border border-white/15 px-4 py-2 font-medium text-white transition hover:bg-white/5"
          >
            Log out
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Link
            href="/admin/client-onboarding"
            className="rounded-3xl border border-white/10 bg-neutral-900 p-8 shadow-[0_8px_30px_rgba(0,0,0,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
          >
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#c8a287]">
              Setup
            </p>
            <h2 className="text-2xl font-bold text-white">Client Onboarding</h2>
            <p className="mt-3 text-neutral-300">
              Create a new client profile and link a property for dashboard tracking.
            </p>
          </Link>

          <Link
            href="/admin/seller-cases"
            className="rounded-3xl border border-white/10 bg-neutral-900 p-8 shadow-[0_8px_30px_rgba(0,0,0,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
          >
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#c8a287]">
              Tracking
            </p>
            <h2 className="text-2xl font-bold text-white">Seller Case Management</h2>
            <p className="mt-3 text-neutral-300">
              Manage seller case details, listing links, viewings, feedback, and
              offers for existing clients.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
