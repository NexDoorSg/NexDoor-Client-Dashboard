"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const ADMIN_EMAILS = [
  "bjornlim@nexdoor.sg",
  "abigailtang@nexdoor.sg",
  "daveteo@nexdoor.sg",
];

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [address, setAddress] = useState("");

  const [enquiries, setEnquiries] = useState("");
  const [viewings, setViewings] = useState("");
  const [offers, setOffers] = useState("");
  const [highestOffer, setHighestOffer] = useState("");

  const [message, setMessage] = useState("");

  useEffect(() => {
    checkAccess();
  }, []);

  async function checkAccess() {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
      // not logged in → redirect
      window.location.href = "/";
      return;
    }

    if (!ADMIN_EMAILS.includes(data.user.email)) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    setIsAdmin(true);
    setLoading(false);
    loadProperties();
  }

  async function loadProperties() {
    const { data, error } = await supabase
      .from("properties")
      .select("id, address")
      .order("address", { ascending: true });

    if (error) {
      setMessage(`Failed to load properties: ${error.message}`);
      return;
    }

    setProperties(data || []);
  }

  async function handlePropertyChange(propertyId) {
    setSelectedPropertyId(propertyId);
    setMessage("");

    if (!propertyId) {
      setAddress("");
      setEnquiries("");
      setViewings("");
      setOffers("");
      setHighestOffer("");
      return;
    }

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

  // ⛔ Loading state
  if (loading) {
    return <p className="p-10">Checking access...</p>;
  }

  // ⛔ Not admin
  if (!isAdmin) {
    return <p className="p-10">You are not authorized to access this page.</p>;
  }

  // ✅ Admin UI
  return (
    <main className="min-h-screen bg-[#f7f5f2] text-[#36454f] px-6 py-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>

        <div className="bg-white p-6 rounded-xl">
          <select
            value={selectedPropertyId}
            onChange={(e) => handlePropertyChange(e.target.value)}
            className="w-full border p-2 mb-4"
          >
            <option value="">Select property</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.address}
              </option>
            ))}
          </select>

          <form onSubmit={handleSave} className="space-y-3">
            <input type="number" placeholder="Enquiries" value={enquiries} onChange={(e) => setEnquiries(e.target.value)} className="w-full border p-2" />
            <input type="number" placeholder="Viewings" value={viewings} onChange={(e) => setViewings(e.target.value)} className="w-full border p-2" />
            <input type="number" placeholder="Offers" value={offers} onChange={(e) => setOffers(e.target.value)} className="w-full border p-2" />
            <input type="number" placeholder="Highest Offer" value={highestOffer} onChange={(e) => setHighestOffer(e.target.value)} className="w-full border p-2" />

            <button className="bg-black text-white w-full py-2">
              Save
            </button>
          </form>

          {message && <p className="mt-3 text-sm">{message}</p>}
        </div>
      </div>
    </main>
  );
}
