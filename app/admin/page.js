"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const ADMIN_EMAILS = [
  "bjornlim@nexdoor.sg",
  "abigailtang@nexdoor.sg",
  "daveteo@nexdoor.sg",
];

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
        window.location.href = "/";
        return;
      }

      const email = data.user.email || "";
      setCurrentUserEmail(email);

      if (!ADMIN_EMAILS.includes(email)) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setIsAdmin(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <p className="text-lg text-[#36454f]">Loading admin home...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <div className="w-full max-w-lg rounded-3xl border border-black/5 bg-white p-8 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#c8a287]">
            NexDoor Internal
          </p>
          <h1 className="mb-3 text-3xl font-bold">Access denied</h1>
          <p className="mb-6 text-[#5f6b73]">
            You are signed in as <span className="font-semibold">{currentUserEmail}</span>, but this page is only for approved admin accounts.
          </p>
          <button
            onClick={handleLogout}
            className="w-full rounded-xl bg-[#36454f] py-3 font-medium text-white"
          >
            Log out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#c8a287]">
            NexDoor Internal
          </p>
          <h1 className="text-4xl font-bold text-[#36454f]">Admin Home</h1>
          <p className="mt-3 max-w-2xl text-[#5f6b73]">
            Choose what you want to manage. Use client onboarding to create a new client and link a property, or go to seller case management to manage listing progress, viewings, feedback, and offers.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Link
            href="/admin/client-onboarding"
            className="rounded-3xl border border-black/5 bg-white p-8 shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]"
          >
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#c8a287]">
              Setup
            </p>
            <h2 className="text-2xl font-bold text-[#36454f]">Client Onboarding</h2>
            <p className="mt-3 text-[#5f6b73]">
              Create a new client profile and link a property for dashboard tracking.
            </p>
          </Link>

          <Link
            href="/admin/seller-cases"
            className="rounded-3xl border border-black/5 bg-white p-8 shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]"
          >
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#c8a287]">
              Tracking
            </p>
            <h2 className="text-2xl font-bold text-[#36454f]">Seller Case Management</h2>
            <p className="mt-3 text-[#5f6b73]">
              Manage seller case details, listing links, viewings, feedback, and offers for existing clients.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
