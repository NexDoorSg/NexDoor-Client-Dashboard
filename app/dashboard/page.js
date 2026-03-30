"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [property, setProperty] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setErrorMsg("");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      window.location.href = "/login";
      return;
    }

    const { data: propertyData, error: propertyError } = await supabase
      .from("properties")
      .select("*")
      .maybeSingle();

    if (propertyError) {
      setErrorMsg(propertyError.message);
      setLoading(false);
      return;
    }

    if (!propertyData) {
      setErrorMsg("No property found for this user.");
      setLoading(false);
      return;
    }

    const { data: metricsData, error: metricsError } = await supabase
      .from("metrics")
      .select("*")
      .eq("property_id", propertyData.id)
      .maybeSingle();

    if (metricsError) {
      setErrorMsg(metricsError.message);
      setLoading(false);
      return;
    }

    if (!metricsData) {
      setErrorMsg("No metrics found for this property.");
      setLoading(false);
      return;
    }

    setProperty(propertyData);
    setMetrics(metricsData);
    setLoading(false);
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f5f2] flex items-center justify-center">
        <p className="text-[#36454f] text-lg">Loading dashboard...</p>
      </main>
    );
  }

  if (errorMsg) {
    return (
      <main className="min-h-screen bg-[#f7f5f2] flex items-center justify-center px-4">
        <p className="text-red-500">{errorMsg}</p>
      </main>
    );
  }

  const daysOnMarket = Math.floor(
    (new Date() - new Date(property.listing_date)) / (1000 * 60 * 60 * 24)
  );

  return (
    <main className="min-h-screen bg-[#f7f5f2] text-[#36454f] px-6 py-10">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#c8a287] font-semibold mb-2">
              NexDoor Seller Portal
            </p>
            <h1 className="text-4xl font-bold mb-2">Seller Dashboard</h1>
            <p className="text-lg text-[#5f6b73]">{property.address}</p>
          </div>

          <button
            onClick={loadDashboard}
            className="rounded-xl bg-[#36454f] text-white px-5 py-3 font-medium shadow-sm hover:opacity-90"
          >
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5">
          <Card title="Days on Market" value={daysOnMarket} />
          <Card title="Enquiries" value={metrics.enquiries_count} />
          <Card title="Viewings" value={metrics.viewings_count} />
          <Card title="Offers" value={metrics.offers_count} />
          <Card
            title="Highest Offer"
            value={`$${Number(metrics.highest_offer ?? 0).toLocaleString()}`}
          />
        </div>
      </div>
    </main>
  );
}

function Card({ title, value }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-black/5">
      <p className="text-sm font-medium text-[#7a858c] mb-3">{title}</p>
      <p className="text-3xl font-bold text-[#36454f]">{value}</p>
    </div>
  );
}