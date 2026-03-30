"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

const ADMIN_EMAILS = [
  "bjornlim@nexdoor.sg",
  "abigailtang@nexdoor.sg",
  "daveteo@nexdoor.sg",
];

const emptyPropertyForm = {
  id: "",
  address: "",
  property_type: "",
  status: "",
  purchase_price: "",
  notes: "",
  client_id: "",
};

const emptyMetricsForm = {
  enquiries_count: "",
  viewings_count: "",
  offers_count: "",
  highest_offer: "",
};

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState("");

  const [clients, setClients] = useState([]);
  const [properties, setProperties] = useState([]);

  const [clientEmail, setClientEmail] = useState("");
  const [clientFullName, setClientFullName] = useState("");
  const [clientMessage, setClientMessage] = useState("");
  const [creatingClient, setCreatingClient] = useState(false);

  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [propertyForm, setPropertyForm] = useState(emptyPropertyForm);
  const [propertyMessage, setPropertyMessage] = useState("");
  const [savingProperty, setSavingProperty] = useState(false);

  const [metricsForm, setMetricsForm] = useState(emptyMetricsForm);
  const [metricsMessage, setMetricsMessage] = useState("");
  const [savingMetrics, setSavingMetrics] = useState(false);

  useEffect(() => {
    initializePage();
  }, []);

  async function initializePage() {
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
        setAuthChecked(true);
        setLoading(false);
        return;
      }

      setIsAdmin(true);
      setAuthChecked(true);

      await Promise.all([loadClients(), loadProperties()]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadClients() {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, role, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load clients:", error.message);
      return;
    }

    const onlyClients = (data || []).filter((item) => item.role === "client");
    setClients(onlyClients);
  }

  async function loadProperties() {
    const { data, error } = await supabase
      .from("properties")
      .select("id, address, property_type, status, purchase_price, notes, client_id")
      .order("address", { ascending: true });

    if (error) {
      console.error("Failed to load properties:", error.message);
      return;
    }

    setProperties(data || []);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  async function handleCreateClient(e) {
    e.preventDefault();
    setClientMessage("");

    if (!clientEmail.trim()) {
      setClientMessage("Please enter a client email.");
      return;
    }

    setCreatingClient(true);

    try {
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
          email: clientEmail.trim(),
          full_name: clientFullName.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setClientMessage(result.error || "Failed to create client.");
        return;
      }

      setClientMessage("Client created successfully.");
      setClientEmail("");
      setClientFullName("");
      await loadClients();
    } catch (error) {
      setClientMessage("Something went wrong while creating the client.");
    } finally {
      setCreatingClient(false);
    }
  }

  async function handleSelectProperty(propertyId) {
    setSelectedPropertyId(propertyId);
    setPropertyMessage("");
    setMetricsMessage("");

    if (!propertyId) {
      setPropertyForm(emptyPropertyForm);
      setMetricsForm(emptyMetricsForm);
      return;
    }

    const selectedProperty = properties.find((p) => p.id === propertyId);

    if (selectedProperty) {
      setPropertyForm({
        id: selectedProperty.id || "",
        address: selectedProperty.address || "",
        property_type: selectedProperty.property_type || "",
        status: selectedProperty.status || "",
        purchase_price: selectedProperty.purchase_price || "",
        notes: selectedProperty.notes || "",
        client_id: selectedProperty.client_id || "",
      });
    }

    const { data: metricsData, error: metricsError } = await supabase
      .from("metrics")
      .select("enquiries_count, viewings_count, offers_count, highest_offer")
      .eq("property_id", propertyId)
      .maybeSingle();

    if (metricsError) {
      setMetricsMessage(`Failed to load metrics: ${metricsError.message}`);
      setMetricsForm(emptyMetricsForm);
      return;
    }

    setMetricsForm({
      enquiries_count: metricsData?.enquiries_count ?? "",
      viewings_count: metricsData?.viewings_count ?? "",
      offers_count: metricsData?.offers_count ?? "",
      highest_offer: metricsData?.highest_offer ?? "",
    });
  }

  async function handleSaveProperty(e) {
    e.preventDefault();
    setPropertyMessage("");

    if (!propertyForm.address.trim()) {
      setPropertyMessage("Property address is required.");
      return;
    }

    setSavingProperty(true);

    const payload = {
      address: propertyForm.address.trim(),
      property_type: propertyForm.property_type.trim() || null,
      status: propertyForm.status.trim() || null,
      purchase_price: propertyForm.purchase_price === "" ? null : Number(propertyForm.purchase_price),
      notes: propertyForm.notes.trim() || null,
      client_id: propertyForm.client_id || null,
    };

    try {
      if (selectedPropertyId) {
        const { error } = await supabase
          .from("properties")
          .update(payload)
          .eq("id", selectedPropertyId);

        if (error) {
          setPropertyMessage(`Failed to update property: ${error.message}`);
          return;
        }

        setPropertyMessage("Property updated successfully.");
      } else {
        const { data, error } = await supabase
          .from("properties")
          .insert(payload)
          .select()
          .single();

        if (error) {
          setPropertyMessage(`Failed to create property: ${error.message}`);
          return;
        }

        setPropertyMessage("Property created successfully.");
        setSelectedPropertyId(data.id);
        setPropertyForm({
          id: data.id || "",
          address: data.address || "",
          property_type: data.property_type || "",
          status: data.status || "",
          purchase_price: data.purchase_price || "",
          notes: data.notes || "",
          client_id: data.client_id || "",
        });
      }

      await loadProperties();
    } catch (error) {
      setPropertyMessage("Something went wrong while saving the property.");
    } finally {
      setSavingProperty(false);
    }
  }

  async function handleSaveMetrics(e) {
    e.preventDefault();
    setMetricsMessage("");

    if (!selectedPropertyId) {
      setMetricsMessage("Please select or create a property first.");
      return;
    }

    setSavingMetrics(true);

    const payload = {
      property_id: selectedPropertyId,
      enquiries_count: Number(metricsForm.enquiries_count) || 0,
      viewings_count: Number(metricsForm.viewings_count) || 0,
      offers_count: Number(metricsForm.offers_count) || 0,
      highest_offer: Number(metricsForm.highest_offer) || 0,
      updated_at: new Date().toISOString(),
    };

    try {
      const { data: existingMetrics, error: fetchError } = await supabase
        .from("metrics")
        .select("id")
        .eq("property_id", selectedPropertyId)
        .maybeSingle();

      if (fetchError) {
        setMetricsMessage(`Failed to check metrics: ${fetchError.message}`);
        return;
      }

      if (existingMetrics) {
        const { error: updateError } = await supabase
          .from("metrics")
          .update({
            enquiries_count: payload.enquiries_count,
            viewings_count: payload.viewings_count,
            offers_count: payload.offers_count,
            highest_offer: payload.highest_offer,
            updated_at: payload.updated_at,
          })
          .eq("property_id", selectedPropertyId);

        if (updateError) {
          setMetricsMessage(`Failed to update metrics: ${updateError.message}`);
          return;
        }

        setMetricsMessage("Metrics updated successfully.");
      } else {
        const { error: insertError } = await supabase.from("metrics").insert(payload);

        if (insertError) {
          setMetricsMessage(`Failed to create metrics: ${insertError.message}`);
          return;
        }

        setMetricsMessage("Metrics created successfully.");
      }
    } catch (error) {
      setMetricsMessage("Something went wrong while saving metrics.");
    } finally {
      setSavingMetrics(false);
    }
  }

  function startNewProperty() {
    setSelectedPropertyId("");
    setPropertyForm(emptyPropertyForm);
    setMetricsForm(emptyMetricsForm);
    setPropertyMessage("");
    setMetricsMessage("");
  }

  const totalClients = clients.length;
  const totalProperties = properties.length;

  const assignedProperties = useMemo(
    () => properties.filter((property) => property.client_id).length,
    [properties]
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f5f2] text-[#36454f] flex items-center justify-center">
        <p className="text-lg">Checking admin access...</p>
      </main>
    );
  }

  if (authChecked && !isAdmin) {
    return (
      <main className="min-h-screen bg-[#f7f5f2] text-[#36454f] flex items-center justify-center px-6">
        <div className="max-w-lg w-full bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-black/5">
          <p className="text-sm uppercase tracking-[0.2em] text-[#c8a287] font-semibold mb-2">
            NexDoor Internal
          </p>
          <h1 className="text-3xl font-bold mb-3">Access denied</h1>
          <p className="text-[#5f6b73] mb-6">
            You are signed in as <span className="font-semibold">{currentUserEmail}</span>, but this page is only for approved admin accounts.
          </p>
          <button
            onClick={handleLogout}
            className="w-full rounded-xl bg-[#36454f] text-white py-3 font-medium"
          >
            Log out
          </button>
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
            <h1 className="text-4xl font-bold">Admin Panel</h1>
            <p className="text-[#5f6b73] mt-2">
              Manage clients, properties, and dashboard metrics.
            </p>
          </div>

          <div className="bg-white rounded-2xl px-5 py-4 border border-black/5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <p className="text-sm text-[#7a858c]">Signed in as</p>
            <p className="font-semibold">{currentUserEmail}</p>
            <button
              onClick={handleLogout}
              className="mt-3 text-sm font-medium text-[#36454f] underline underline-offset-4"
            >
              Log out
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <SummaryCard title="Total Clients" value={totalClients} />
          <SummaryCard title="Total Properties" value={totalProperties} />
          <SummaryCard title="Assigned Properties" value={assignedProperties} />
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <section className="rounded-3xl bg-white border border-black/5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-8">
            <h2 className="text-2xl font-bold mb-2">Create Client</h2>
            <p className="text-[#5f6b73] mb-6">
              Add a client account securely and store their basic profile.
            </p>

            <form onSubmit={handleCreateClient} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Client full name</label>
                <input
                  type="text"
                  value={clientFullName}
                  onChange={(e) => setClientFullName(e.target.value)}
                  placeholder="John Tan"
                  className="w-full rounded-xl bg-[#faf9f7] border border-black/10 p-3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Client email</label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="client@email.com"
                  className="w-full rounded-xl bg-[#faf9f7] border border-black/10 p-3"
                />
              </div>

              {clientMessage ? (
                <div className="rounded-xl bg-[#f5efe8] border border-[#e7d8c7] px-4 py-3 text-sm text-[#6b5b4d]">
                  {clientMessage}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={creatingClient}
                className="w-full rounded-xl bg-[#36454f] text-white py-3 font-medium shadow-sm hover:opacity-90 disabled:opacity-60"
              >
                {creatingClient ? "Creating client..." : "Create Client"}
              </button>
            </form>
          </section>

          <section className="rounded-3xl bg-white border border-black/5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-8">
            <h2 className="text-2xl font-bold mb-2">Clients</h2>
            <p className="text-[#5f6b73] mb-6">
              Review your current client accounts.
            </p>

            <div className="space-y-3 max-h-[420px] overflow-auto pr-1">
              {clients.length === 0 ? (
                <div className="rounded-2xl bg-[#faf9f7] border border-black/5 p-4 text-sm text-[#5f6b73]">
                  No clients yet.
                </div>
              ) : (
                clients.map((client) => (
                  <div
                    key={client.id}
                    className="rounded-2xl bg-[#faf9f7] border border-black/5 p-4"
                  >
                    <p className="font-semibold">
                      {client.full_name || "No name added"}
                    </p>
                    <p className="text-sm text-[#5f6b73]">{client.email}</p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <div className="grid gap-8 lg:grid-cols-2 mt-8">
          <section className="rounded-3xl bg-white border border-black/5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-8">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Property Details</h2>
                <p className="text-[#5f6b73]">
                  Create a property or update an existing one.
                </p>
              </div>

              <button
                onClick={startNewProperty}
                className="rounded-xl border border-black/10 px-4 py-2 text-sm font-medium"
              >
                New Property
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Select Property</label>
              <select
                value={selectedPropertyId}
                onChange={(e) => handleSelectProperty(e.target.value)}
                className="w-full rounded-xl bg-[#faf9f7] border border-black/10 p-3"
              >
                <option value="">Create new property</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.address}
                  </option>
                ))}
              </select>
            </div>

            <form onSubmit={handleSaveProperty} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Address</label>
                <input
                  type="text"
                  value={propertyForm.address}
                  onChange={(e) =>
                    setPropertyForm((prev) => ({ ...prev, address: e.target.value }))
                  }
                  placeholder="123 Example Road #12-34"
                  className="w-full rounded-xl bg-[#faf9f7] border border-black/10 p-3"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-2">Property Type</label>
                  <input
                    type="text"
                    value={propertyForm.property_type}
                    onChange={(e) =>
                      setPropertyForm((prev) => ({ ...prev, property_type: e.target.value }))
                    }
                    placeholder="HDB / Condo / Landed"
                    className="w-full rounded-xl bg-[#faf9f7] border border-black/10 p-3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <input
                    type="text"
                    value={propertyForm.status}
                    onChange={(e) =>
                      setPropertyForm((prev) => ({ ...prev, status: e.target.value }))
                    }
                    placeholder="Viewing / Offer / Sold"
                    className="w-full rounded-xl bg-[#faf9f7] border border-black/10 p-3"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Purchase Price</label>
                <input
                  type="number"
                  value={propertyForm.purchase_price}
                  onChange={(e) =>
                    setPropertyForm((prev) => ({ ...prev, purchase_price: e.target.value }))
                  }
                  placeholder="850000"
                  className="w-full rounded-xl bg-[#faf9f7] border border-black/10 p-3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Assign Client</label>
                <select
                  value={propertyForm.client_id}
                  onChange={(e) =>
                    setPropertyForm((prev) => ({ ...prev, client_id: e.target.value }))
                  }
                  className="w-full rounded-xl bg-[#faf9f7] border border-black/10 p-3"
                >
                  <option value="">No client assigned</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.full_name ? `${client.full_name} — ${client.email}` : client.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Notes</label>
                <textarea
                  value={propertyForm.notes}
                  onChange={(e) =>
                    setPropertyForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  rows={4}
                  placeholder="Any internal notes about this property"
                  className="w-full rounded-xl bg-[#faf9f7] border border-black/10 p-3"
                />
              </div>

              {propertyMessage ? (
                <div className="rounded-xl bg-[#f5efe8] border border-[#e7d8c7] px-4 py-3 text-sm text-[#6b5b4d]">
                  {propertyMessage}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={savingProperty}
                className="w-full rounded-xl bg-[#36454f] text-white py-3 font-medium shadow-sm hover:opacity-90 disabled:opacity-60"
              >
                {savingProperty
                  ? "Saving property..."
                  : selectedPropertyId
                  ? "Update Property"
                  : "Create Property"}
              </button>
            </form>
          </section>

          <section className="rounded-3xl bg-white border border-black/5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-8">
            <h2 className="text-2xl font-bold mb-2">Property Metrics</h2>
            <p className="text-[#5f6b73] mb-6">
              Update seller dashboard numbers for the selected property.
            </p>

            {!selectedPropertyId ? (
              <div className="rounded-2xl bg-[#faf9f7] border border-black/5 p-4 text-sm text-[#5f6b73] mb-6">
                Select or create a property first before updating metrics.
              </div>
            ) : null}

            <form onSubmit={handleSaveMetrics} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Enquiries</label>
                <input
                  type="number"
                  value={metricsForm.enquiries_count}
                  onChange={(e) =>
                    setMetricsForm((prev) => ({
                      ...prev,
                      enquiries_count: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl bg-[#faf9f7] border border-black/10 p-3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Viewings</label>
                <input
                  type="number"
                  value={metricsForm.viewings_count}
                  onChange={(e) =>
                    setMetricsForm((prev) => ({
                      ...prev,
                      viewings_count: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl bg-[#faf9f7] border border-black/10 p-3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Offers</label>
                <input
                  type="number"
                  value={metricsForm.offers_count}
                  onChange={(e) =>
                    setMetricsForm((prev) => ({
                      ...prev,
                      offers_count: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl bg-[#faf9f7] border border-black/10 p-3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Highest Offer</label>
                <input
                  type="number"
                  value={metricsForm.highest_offer}
                  onChange={(e) =>
                    setMetricsForm((prev) => ({
                      ...prev,
                      highest_offer: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl bg-[#faf9f7] border border-black/10 p-3"
                />
              </div>

              {metricsMessage ? (
                <div className="rounded-xl bg-[#f5efe8] border border-[#e7d8c7] px-4 py-3 text-sm text-[#6b5b4d]">
                  {metricsMessage}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={savingMetrics || !selectedPropertyId}
                className="w-full rounded-xl bg-[#36454f] text-white py-3 font-medium shadow-sm hover:opacity-90 disabled:opacity-60"
              >
                {savingMetrics ? "Saving metrics..." : "Save Metrics"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}

function SummaryCard({ title, value }) {
  return (
    <div className="rounded-3xl bg-white border border-black/5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-6">
      <p className="text-sm text-[#7a858c] mb-2">{title}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}
