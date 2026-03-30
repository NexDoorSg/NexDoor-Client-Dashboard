"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const ADMIN_EMAILS = [
  "bjornlim@nexdoor.sg",
  "abigailtang@nexdoor.sg",
  "daveteo@nexdoor.sg",
];

const emptyForm = {
  full_name: "",
  email: "",
  address: "",
  property_type: "",
  status: "active",
  asking_price: "",
  notes: "",
};

export default function ClientOnboardingPage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    if (!form.full_name.trim() || !form.email.trim() || !form.address.trim()) {
      setMessage("Please fill in full name, email, and address.");
      return;
    }

    try {
      setSubmitting(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch("/api/admin/create-client", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
        body: JSON.stringify({
          full_name: form.full_name,
          email: form.email,
          address: form.address,
          property_type: form.property_type,
          status: form.status,
          asking_price: form.asking_price,
          notes: form.notes,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error || "Failed to create client.");
        return;
      }

      setForm(emptyForm);
      setMessage("Client and property created successfully.");
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <p className="text-lg text-[#36454f]">Loading client onboarding...</p>
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
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#c8a287]">
            NexDoor Internal
          </p>
          <h1 className="text-4xl font-bold text-[#36454f]">Client Onboarding</h1>
          <p className="mt-3 max-w-2xl text-[#5f6b73]">
            Create a new client profile and link a property for dashboard tracking.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-black/5 bg-white p-8 shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
        >
          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-[#c8a287]">
                  Client Details
                </p>
              </div>

              <TextField
                label="Full Name"
                value={form.full_name}
                onChange={(value) => setForm((prev) => ({ ...prev, full_name: value }))}
                placeholder="Peiru Liao"
              />

              <TextField
                label="Email"
                value={form.email}
                onChange={(value) => setForm((prev) => ({ ...prev, email: value }))}
                placeholder="client@email.com"
              />
            </div>

            <div className="space-y-4">
              <div>
                <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-[#c8a287]">
                  Property Details
                </p>
              </div>

              <TextField
                label="Address"
                value={form.address}
                onChange={(value) => setForm((prev) => ({ ...prev, address: value }))}
                placeholder="123 Example Road #10-11"
              />

              <TextField
                label="Property Type"
                value={form.property_type}
                onChange={(value) => setForm((prev) => ({ ...prev, property_type: value }))}
                placeholder="HDB / Condo / Landed"
              />

              <TextField
                label="Status"
                value={form.status}
                onChange={(value) => setForm((prev) => ({ ...prev, status: value }))}
                placeholder="active"
              />

              <NumberField
                label="Asking Price"
                value={form.asking_price}
                onChange={(value) => setForm((prev) => ({ ...prev, asking_price: value }))}
              />

              <div>
                <label className="mb-2 block text-sm font-medium">Notes</label>
                <textarea
                  rows={5}
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                  className="w-full rounded-xl border border-black/10 bg-[#faf9f7] p-3"
                  placeholder="Any useful notes about the property or client."
                />
              </div>
            </div>
          </div>

          {message ? (
            <div className="mt-6 rounded-xl border border-[#e7d8c7] bg-[#f5efe8] px-4 py-3 text-sm text-[#6b5b4d]">
              {message}
            </div>
          ) : null}

          <div className="mt-8">
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-[#36454f] py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Creating Client..." : "Create Client & Property"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TextField({ label, value, onChange, placeholder = "" }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-black/10 bg-[#faf9f7] p-3"
        placeholder={placeholder}
      />
    </div>
  );
}

function NumberField({ label, value, onChange }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-black/10 bg-[#faf9f7] p-3"
      />
    </div>
  );
}
