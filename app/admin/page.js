"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const ADMIN_EMAILS = [
  "bjornlim@nexdoor.sg",
  "daveteo@nexdoor.sg",
  "abigailtang@nexdoor.sg"
];

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [address, setAddress] = useState("");

  const [enquiries, setEnquiries] = useState("");
  const [viewings, setViewings] = useState("");
  const [offers, setOffers] = useState("");
  const [highestOffer, setHighestOffer] = useState("");

  const [newClientEmail, setNewClientEmail] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    checkUser();
    loadProperties();
  }, []);

  async function checkUser() {
    const { data } = await supabase.auth.getUser();

    if (!data?.user) {
      window.location.href = "/";
      return;
    }

    setUser(data.user);

    if (ADMIN_EMAILS.includes(data.user.email)) {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }

  async function loadProperties() {
    const { data } = await supabase
      .from("properties")
      .select("id, address")
      .order("address");

    setProperties(data || []);
  }

  async function handleCreateClient() {
    setMessage("");

    if (!newClientEmail) {
      setMessage("Enter client email.");
      return;
    }

    const { error } = await supabase.auth.admin.createUser({
      email: newClientEmail,
      email_confirm: true,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Client created successfully.");
    setNewClientEmail("");
  }

  async function handlePropertyChange(propertyId) {
    setSelectedPropertyId(propertyId);

    const selectedProperty = properties.find((p) => p.id === propertyId);
    setAddress(selectedProperty?.address || "");

    const { data } = await supabase
      .from("metrics")
      .select("*")
      .eq("property_id", propertyId)
      .maybeSingle();

    if (data) {
      setEnquiries(data.enquiries_count ?? "");
      setViewings(data.viewings_count ?? "");
      setOffers(data.offers_count ?? "");
      setHighestOffer(data.highest_offer ?? "");
    }
  }

  async function handleSave(e) {
    e.preventDefault();

    const payload = {
      enquiries_count: Number(enquiries) || 0,
      viewings_count: Number(viewings) || 0,
      offers_count: Number(offers) || 0,
      highest_offer: Number(highestOffer) || 0,
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabase
      .from("metrics")
      .select("id")
      .eq("property_id", selectedPropertyId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("metrics")
        .update(payload)
        .eq("property_id", selectedPropertyId);

      setMessage("Metrics updated.");
    } else {
      await supabase.from("metrics").insert({
        property_id: selectedPropertyId,
        ...payload,
      });

      setMessage("Metrics created.");
    }
  }

  if (!user) return <p className="p-10">Loading...</p>;

  if (!isAdmin)
    return <p className="p-10">You are not authorized to access this page.</p>;

  return (
    <main className="min-h-screen bg-[#f7f5f2] text-[#36454f] px-6 py-10">
      <div className="max-w-3xl mx-auto space-y-10">

        <h1 className="text-3xl font-bold">Admin Panel</h1>

        {/* CREATE CLIENT */}
        <div className="bg-white p-6 rounded-xl">
          <h2 className="font-semibold mb-3">Create Client</h2>

          <input
            type="email"
            placeholder="client@email.com"
            value={newClientEmail}
            onChange={(e) => setNewClientEmail(e.target.value)}
            className="w-full border p-2 mb-3"
          />

          <button
            onClick={handleCreateClient}
            className="bg-black text-white px-4 py-2 rounded"
          >
            Create Client
          </button>
        </div>

        {/* METRICS (YOUR EXISTING SYSTEM) */}
        <div className="bg-white p-6 rounded-xl">
          <h2 className="font-semibold mb-3">Update Metrics</h2>

          <select
            value={selectedPropertyId}
            onChange={(e) => handlePropertyChange(e.target.value)}
            className="w-full border p-2 mb-3"
          >
            <option value="">Select property</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.address}
              </option>
            ))}
          </select>

          <form onSubmit={handleSave} className="space-y-3">
            <input
              type="number"
              placeholder="Enquiries"
              value={enquiries}
              onChange={(e) => setEnquiries(e.target.value)}
              className="w-full border p-2"
            />

            <input
              type="number"
              placeholder="Viewings"
              value={viewings}
              onChange={(e) => setViewings(e.target.value)}
              className="w-full border p-2"
            />

            <input
              type="number"
              placeholder="Offers"
              value={offers}
              onChange={(e) => setOffers(e.target.value)}
              className="w-full border p-2"
            />

            <input
              type="number"
              placeholder="Highest Offer"
              value={highestOffer}
              onChange={(e) => setHighestOffer(e.target.value)}
              className="w-full border p-2"
            />

            <button className="bg-black text-white w-full py-2">
              Save
            </button>
          </form>
        </div>

        {message && <p className="text-sm">{message}</p>}
      </div>
    </main>
  );
}
