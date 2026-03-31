"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { isAdminEmail } from "@/lib/admin-emails";

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

      if (!isAdminEmail(email)) {
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
      <main className="min-h-screen bg-[#f7f5f2] text-[#36454f] flex items-center justify-center">
        <p className="text-lg">Loading admin page...</p>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-[#f7f5f2] text-[#36454f] flex items-center justify-center px-6">
        <div className="max-w-lg w-full bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-black/5">
          <p className="text-sm uppercase tracking-[0.2em] text-[#c8a287] font-semibold mb-2">
            NexDoor Internal
          </p>
          <h1 className="text-3xl font-bold mb-3">Access denied</h1>
          <p className="text-[#5f6b73] mb-6">
            You are signed in as{" "}
            <span className="font-semibold">
              {currentUserEmail || "an unknown user"}
            </span>
            , but this page is only for approved admin accounts.
          </p>

          <div className="flex gap-3">
            <button
              onClick={handleLogout}
              className="flex-1 rounded-xl bg-[#36454f] text-white py-3 font-medium"
            >
              Log out
            </button>

            <Link
              href="/admin/login"
              className="flex-1 rounded-xl border border-black/10 py-3 text-center font-medium"
            >
              Go to admin login
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f5f2] text-[#36454f] px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#c8a287] font-semibold mb-2">
              NexDoor Internal
            </p>
            <h1 className="text-4xl font-bold">Admin Home</h1>
            <p className="text-[#5f6b73] mt-2 max-w-3xl">
              Choose what you want to manage. Use client onboarding to create a
              new client and link a property, or go to seller case management to
              manage listing progress, viewings, feedback, and offers.
            </p>
          </div>

          <div className="bg-white rounded-2xl px-5 py-4 border border-black/5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <p className="text-sm text-[#7a858c]">Signed in as</p>
            <p className="font-semibold">{currentUserEmail}</p>
            <button
              onClick={handleLogout}
              className="mt-3 text-sm font-medium underline underline-offset-4"
            >
              Log out
            </button>
          </div>
        </div>

        <section className="rounded-3xl bg-white border border-black/5 p-8 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          <p className="text-sm uppercase tracking-[0.2em] text-[#c8a287] font-semibold mb-2">
            Setup
          </p>
          <h2 className="text-2xl font-bold mb-3">Admin Menu</h2>
          <p className="text-[#5f6b73] mb-8">
            Manage client onboarding and seller case tracking.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <Link
              href="/admin/client-onboarding"
              className="rounded-2xl border border-black/5 bg-[#faf9f7] p-6 transition hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
            >
              <p className="text-lg font-semibold mb-2">Client Onboarding</p>
              <p className="text-sm text-[#5f6b73]">
                Create a new client account and link a property for the client
                dashboard.
              </p>
            </Link>

            <Link
              href="/admin/seller-cases"
              className="rounded-2xl border border-black/5 bg-[#faf9f7] p-6 transition hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
            >
              <p className="text-lg font-semibold mb-2">Seller Case Management</p>
              <p className="text-sm text-[#5f6b73]">
                Update seller cases, listing links, viewings, feedback, and
                offers that appear on the client dashboard.
              </p>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
