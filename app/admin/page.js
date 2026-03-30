"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminPage() {
  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [address, setAddress] = useState("");
  const [enquiries, setEnquiries] = useState("");
  const [viewings, setViewings] = useState("");
  const [offers, setOffers] = useState("");
  const [highestOffer, setHighestOffer] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadProperties();
  }, []);

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

    const { data: metricsData, error: metricsError } = await supabase
      .from("metrics")
      .select("*")
      .eq("property_id", propertyId)
      .maybeSingle();

    if (metricsError) {
      setMessage(`Failed to load metrics: ${metricsError.message}`);
      return;
    }

    if (metricsData) {
      setEnquiries(metricsData.enquiries_count ?? "");
      setViewings(metricsData.viewings_count ?? "");
      setOffers(metricsData.offers_count ?? "");
      setHighestOffer(metricsData.highest_offer ?? "");
    } else {
      setEnquiries("");
      setViewings("");
      setOffers("");
      setHighestOffer("");
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setMessage("");

    if (!selectedPropertyId) {
      setMessage("Please select a property first.");
      return;
    }

    const payload = {
      enquiries_count: Number(enquiries) || 0,
      viewings_count: Number(viewings) || 0,
      offers_count: Number(offers) || 0,
      highest_offer: Number(highestOffer) || 0,
      updated_at: new Date().toISOString(),
    };

    const { data: existingMetrics, error: fetchError } = await supabase
      .from("metrics")
      .select("id")
      .eq("property_id", selectedPropertyId)
      .maybeSingle();

    if (fetchError) {
      setMessage(`Failed to check existing metrics: ${fetchError.message}`);
      return;
    }

    if (existingMetrics) {
      const { error: updateError } = await supabase
        .from("metrics")
        .update(payload)
        .eq("property_id", selectedPropertyId);

      if (updateError) {
        setMessage(`Failed to update metrics: ${updateError.message}`);
        return;
      }

      setMessage("Metrics updated successfully.");
    } else {
      const { error: insertError } = await supabase
        .from("metrics")
        .insert({
          property_id: selectedPropertyId,
          ...payload,
        });

      if (insertError) {
        setMessage(`Failed to create metrics: ${insertError.message}`);
        return;
      }

      setMessage("Metrics created successfully.");
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f5f2] text-[#36454f] px-6 py-10">
      <div className="max-w-3xl mx-auto">
        <p className="text-sm uppercase tracking-[0.2em] text-[#c8a287] font-semibold mb-2">
          NexDoor Internal
        </p>
        <h1 className="text-4xl font-bold mb-2">Admin Panel</h1>
        <p className="text-[#5f6b73] mb-8">
          Update seller dashboard numbers here.
        </p>

        <div className="rounded-3xl bg-white border border-black/5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-8">
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Select Property</label>
            <select
              value={selectedPropertyId}
              onChange={(e) => handlePropertyChange(e.target.value)}
              className="w-full rounded-xl bg-[#faf9f7] border border-black/10 p-3"
            >
              <option value="">Choose a property</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.address}
                </option>
              ))}
            </select>
          </div>

          {address ? (
            <div className="mb-6 rounded-2xl bg-[#faf9f7] border border-black/5 p-4">
              <p className="text-sm text-[#7a858c]">Editing property</p>
              <p className="font-semibold text-lg">{address}</p>
            </div>
          ) : null}

          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2">Enquiries</label>
              <input
                type="number"
                value={enquiries}
                onChange={(e) => setEnquiries(e.target.value)}
                className="w-full rounded-xl bg-[#faf9f7] border border-black/10 p-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Viewings</label>
              <input
                type="number"
                value={viewings}
                onChange={(e) => setViewings(e.target.value)}
                className="w-full rounded-xl bg-[#faf9f7] border border-black/10 p-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Offers</label>
              <input
                type="number"
                value={offers}
                onChange={(e) => setOffers(e.target.value)}
                className="w-full rounded-xl bg-[#faf9f7] border border-black/10 p-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Highest Offer</label>
              <input
                type="number"
                value={highestOffer}
                onChange={(e) => setHighestOffer(e.target.value)}
                className="w-full rounded-xl bg-[#faf9f7] border border-black/10 p-3"
              />
            </div>

            {message ? (
              <div className="rounded-xl bg-[#f5efe8] border border-[#e7d8c7] px-4 py-3 text-sm text-[#6b5b4d]">
                {message}
              </div>
            ) : null}

            <button
              type="submit"
              className="w-full rounded-xl bg-[#36454f] text-white py-3 font-medium shadow-sm hover:opacity-90"
            >
              Save Metrics
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}