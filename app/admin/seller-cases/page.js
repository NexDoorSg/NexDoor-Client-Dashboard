"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { isAdminEmail } from "@/lib/admin-emails";

const emptySellerCaseForm = {
  stage: "live on market",
  asking_price: "",
  days_on_market: "",
  enquiries_count: "",
  viewings_count: "",
  offers_count: "",
  highest_offer: "",
  property_id: "",
};

const emptyListingLinkForm = {
  platform: "",
  url: "",
  listing_status: "live",
};

const emptyViewingForm = {
  viewing_date: "",
  viewing_time: "",
  buyer_type: "agent",
  buyer_name: "",
  status: "scheduled",
};

const emptyFeedbackForm = {
  seller_viewing_id: "",
  interest_level: "",
  follow_up_status: "",
  feedback_notes: "",
};

const emptyOfferForm = {
  buyer_name: "",
  offer_amount: "",
  offer_date: "",
  status: "open",
  remarks: "",
};

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState("");

  const [clients, setClients] = useState([]);
  const [properties, setProperties] = useState([]);

  const [selectedClientId, setSelectedClientId] = useState("");
  const [clientProperties, setClientProperties] = useState([]);

  const [sellerCaseId, setSellerCaseId] = useState("");
  const [sellerCaseForm, setSellerCaseForm] = useState(emptySellerCaseForm);
  const [sellerCaseMessage, setSellerCaseMessage] = useState("");

  const [listingLinkForm, setListingLinkForm] = useState(emptyListingLinkForm);
  const [listingLinkMessage, setListingLinkMessage] = useState("");
  const [listingLinks, setListingLinks] = useState([]);
  const [editingListingLinkId, setEditingListingLinkId] = useState("");

  const [viewingForm, setViewingForm] = useState(emptyViewingForm);
  const [viewingMessage, setViewingMessage] = useState("");
  const [viewings, setViewings] = useState([]);
  const [editingViewingId, setEditingViewingId] = useState("");

  const [feedbackForm, setFeedbackForm] = useState(emptyFeedbackForm);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackItems, setFeedbackItems] = useState([]);
  const [editingFeedbackId, setEditingFeedbackId] = useState("");

  const [offerForm, setOfferForm] = useState(emptyOfferForm);
  const [offerMessage, setOfferMessage] = useState("");
  const [offers, setOffers] = useState([]);
  const [editingOfferId, setEditingOfferId] = useState("");

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

      const email = (data.user.email || "").trim().toLowerCase();
      setCurrentUserEmail(email);

      if (!isAdminEmail(email)) {
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
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch("/api/admin/clients", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Failed to load clients:", result.error);
        return;
      }

      setClients(result.clients || []);
    } catch (error) {
      console.error("Failed to load clients:", error);
    }
  }

  async function loadProperties() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch("/api/admin/properties", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("Failed to load properties:", result.error);
        return;
      }

      setProperties(result.properties || []);
    } catch (error) {
      console.error("Failed to load properties:", error);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  async function handleClientChange(clientId) {
    setSelectedClientId(clientId);
    resetSellerSections();

    if (!clientId) {
      setClientProperties([]);
      return;
    }

    const filteredProperties = properties.filter(
      (item) => item.client_id === clientId
    );
    setClientProperties(filteredProperties);

    const { data: sellerCaseData, error: sellerCaseError } = await supabase
      .from("seller_cases")
      .select("*")
      .eq("client_id", clientId)
      .maybeSingle();

    if (sellerCaseError) {
      setSellerCaseMessage(
        `Failed to load seller case: ${sellerCaseError.message}`
      );
      return;
    }

    if (!sellerCaseData) {
      setSellerCaseId("");
      setSellerCaseForm({
        ...emptySellerCaseForm,
        property_id: filteredProperties[0]?.id || "",
      });
      return;
    }

    setSellerCaseId(sellerCaseData.id);
    setSellerCaseForm({
      stage: sellerCaseData.stage || "live on market",
      asking_price: sellerCaseData.asking_price ?? "",
      days_on_market: sellerCaseData.days_on_market ?? "",
      enquiries_count: sellerCaseData.enquiries_count ?? "",
      viewings_count: sellerCaseData.viewings_count ?? "",
      offers_count: sellerCaseData.offers_count ?? "",
      highest_offer: sellerCaseData.highest_offer ?? "",
      property_id: sellerCaseData.property_id || "",
    });

    await Promise.all([
      loadSellerListingLinks(sellerCaseData.id),
      loadSellerViewings(sellerCaseData.id),
      loadSellerOffers(sellerCaseData.id),
    ]);
  }

  function resetSellerSections() {
    setSellerCaseId("");
    setSellerCaseForm(emptySellerCaseForm);
    setSellerCaseMessage("");

    setListingLinkForm(emptyListingLinkForm);
    setListingLinkMessage("");
    setListingLinks([]);
    setEditingListingLinkId("");

    setViewingForm(emptyViewingForm);
    setViewingMessage("");
    setViewings([]);
    setEditingViewingId("");

    setFeedbackForm(emptyFeedbackForm);
    setFeedbackMessage("");
    setFeedbackItems([]);
    setEditingFeedbackId("");

    setOfferForm(emptyOfferForm);
    setOfferMessage("");
    setOffers([]);
    setEditingOfferId("");
  }

  function cancelListingLinkEdit() {
    setEditingListingLinkId("");
    setListingLinkForm(emptyListingLinkForm);
    setListingLinkMessage("");
  }

  function cancelViewingEdit() {
    setEditingViewingId("");
    setViewingForm(emptyViewingForm);
    setViewingMessage("");
  }

  function cancelFeedbackEdit() {
    setEditingFeedbackId("");
    setFeedbackForm(emptyFeedbackForm);
    setFeedbackMessage("");
  }

  function cancelOfferEdit() {
    setEditingOfferId("");
    setOfferForm(emptyOfferForm);
    setOfferMessage("");
  }

  async function loadSellerListingLinks(caseId) {
    const { data, error } = await supabase
      .from("seller_listing_links")
      .select("*")
      .eq("seller_case_id", caseId)
      .order("created_at", { ascending: true });

    if (error) {
      setListingLinkMessage(`Failed to load listing links: ${error.message}`);
      return;
    }

    setListingLinks(data || []);
  }

  async function loadSellerViewings(caseId) {
    const { data, error } = await supabase
      .from("seller_viewings")
      .select("*")
      .eq("seller_case_id", caseId)
      .order("viewing_date", { ascending: true });

    if (error) {
      setViewingMessage(`Failed to load viewings: ${error.message}`);
      return;
    }

    const viewingRows = data || [];
    setViewings(viewingRows);

    if (viewingRows.length > 0) {
      const viewingIds = viewingRows.map((item) => item.id);

      const { data: feedbackData, error: feedbackError } = await supabase
        .from("seller_feedback")
        .select("*")
        .in("seller_viewing_id", viewingIds)
        .order("created_at", { ascending: false });

      if (feedbackError) {
        setFeedbackMessage(`Failed to load feedback: ${feedbackError.message}`);
        return;
      }

      setFeedbackItems(feedbackData || []);
    } else {
      setFeedbackItems([]);
    }
  }

  async function loadSellerOffers(caseId) {
    const { data, error } = await supabase
      .from("seller_offers")
      .select("*")
      .eq("seller_case_id", caseId)
      .order("offer_date", { ascending: false });

    if (error) {
      setOfferMessage(`Failed to load offers: ${error.message}`);
      return;
    }

    setOffers(data || []);
  }

  async function handleSaveSellerCase(e) {
    e.preventDefault();
    setSellerCaseMessage("");

    if (!selectedClientId) {
      setSellerCaseMessage("Please select a client first.");
      return;
    }

    if (!sellerCaseForm.property_id) {
      setSellerCaseMessage("Please choose a linked property.");
      return;
    }

    const payload = {
      client_id: selectedClientId,
      property_id: sellerCaseForm.property_id,
      stage: sellerCaseForm.stage || "live on market",
      asking_price:
        sellerCaseForm.asking_price === ""
          ? null
          : Number(sellerCaseForm.asking_price),
      days_on_market:
        sellerCaseForm.days_on_market === ""
          ? 0
          : Number(sellerCaseForm.days_on_market),
      enquiries_count:
        sellerCaseForm.enquiries_count === ""
          ? 0
          : Number(sellerCaseForm.enquiries_count),
      viewings_count:
        sellerCaseForm.viewings_count === ""
          ? 0
          : Number(sellerCaseForm.viewings_count),
      offers_count:
        sellerCaseForm.offers_count === ""
          ? 0
          : Number(sellerCaseForm.offers_count),
      highest_offer:
        sellerCaseForm.highest_offer === ""
          ? 0
          : Number(sellerCaseForm.highest_offer),
      updated_at: new Date().toISOString(),
    };

    if (sellerCaseId) {
      const { error } = await supabase
        .from("seller_cases")
        .update(payload)
        .eq("id", sellerCaseId);

      if (error) {
        setSellerCaseMessage(`Failed to update seller case: ${error.message}`);
        return;
      }

      setSellerCaseMessage("Seller case updated successfully.");
      return;
    }

    const { data, error } = await supabase
      .from("seller_cases")
      .insert(payload)
      .select()
      .single();

    if (error) {
      setSellerCaseMessage(`Failed to create seller case: ${error.message}`);
      return;
    }

    setSellerCaseId(data.id);
    setSellerCaseMessage("Seller case created successfully.");
  }

  function handleEditListingLink(item) {
    setEditingListingLinkId(item.id);
    setListingLinkForm({
      platform: item.platform || "",
      url: item.url || "",
      listing_status: item.listing_status || "live",
    });
    setListingLinkMessage("Editing listing link.");
  }

  async function handleSaveListingLink(e) {
    e.preventDefault();
    setListingLinkMessage("");

    if (!sellerCaseId) {
      setListingLinkMessage("Please save the seller case first.");
      return;
    }

    if (!listingLinkForm.platform || !listingLinkForm.url) {
      setListingLinkMessage("Please fill in platform and URL.");
      return;
    }

    const payload = {
      seller_case_id: sellerCaseId,
      platform: listingLinkForm.platform.trim(),
      url: listingLinkForm.url.trim(),
      listing_status: listingLinkForm.listing_status || "live",
    };

    if (editingListingLinkId) {
      const { error } = await supabase
        .from("seller_listing_links")
        .update(payload)
        .eq("id", editingListingLinkId);

      if (error) {
        setListingLinkMessage(`Failed to update listing link: ${error.message}`);
        return;
      }

      setListingLinkMessage("Listing link updated successfully.");
    } else {
      const { error } = await supabase
        .from("seller_listing_links")
        .insert(payload);

      if (error) {
        setListingLinkMessage(`Failed to add listing link: ${error.message}`);
        return;
      }

      setListingLinkMessage("Listing link added successfully.");
    }

    setListingLinkForm(emptyListingLinkForm);
    setEditingListingLinkId("");
    await loadSellerListingLinks(sellerCaseId);
  }

  function handleEditViewing(item) {
    setEditingViewingId(item.id);
    setViewingForm({
      viewing_date: item.viewing_date || "",
      viewing_time: item.viewing_time || "",
      buyer_type: item.buyer_type || "agent",
      buyer_name: item.buyer_name || "",
      status: item.status || "scheduled",
    });
    setViewingMessage("Editing viewing.");
  }

  async function handleSaveViewing(e) {
    e.preventDefault();
    setViewingMessage("");

    if (!sellerCaseId) {
      setViewingMessage("Please save the seller case first.");
      return;
    }

    if (!viewingForm.viewing_date || !viewingForm.buyer_name) {
      setViewingMessage("Please fill in viewing date and buyer name.");
      return;
    }

    const payload = {
      seller_case_id: sellerCaseId,
      viewing_date: viewingForm.viewing_date,
      viewing_time: viewingForm.viewing_time || null,
      buyer_type: viewingForm.buyer_type || null,
      buyer_name: viewingForm.buyer_name.trim(),
      status: viewingForm.status || "scheduled",
    };

    if (editingViewingId) {
      const { error } = await supabase
        .from("seller_viewings")
        .update(payload)
        .eq("id", editingViewingId);

      if (error) {
        setViewingMessage(`Failed to update viewing: ${error.message}`);
        return;
      }

      setViewingMessage("Viewing updated successfully.");
    } else {
      const { error } = await supabase
        .from("seller_viewings")
        .insert(payload);

      if (error) {
        setViewingMessage(`Failed to add viewing: ${error.message}`);
        return;
      }

      setViewingMessage("Viewing added successfully.");
    }

    setViewingForm(emptyViewingForm);
    setEditingViewingId("");
    await loadSellerViewings(sellerCaseId);
  }

  function handleEditFeedback(item) {
    setEditingFeedbackId(item.id);
    setFeedbackForm({
      seller_viewing_id: item.seller_viewing_id || "",
      interest_level: item.interest_level || "",
      follow_up_status: item.follow_up_status || "",
      feedback_notes: item.feedback_notes || "",
    });
    setFeedbackMessage("Editing feedback.");
  }

  async function handleSaveFeedback(e) {
    e.preventDefault();
    setFeedbackMessage("");

    if (!feedbackForm.seller_viewing_id) {
      setFeedbackMessage("Please choose a viewing.");
      return;
    }

    const payload = {
      seller_viewing_id: feedbackForm.seller_viewing_id,
      interest_level: feedbackForm.interest_level || null,
      follow_up_status: feedbackForm.follow_up_status || null,
      feedback_notes: feedbackForm.feedback_notes || null,
    };

    if (editingFeedbackId) {
      const { error } = await supabase
        .from("seller_feedback")
        .update(payload)
        .eq("id", editingFeedbackId);

      if (error) {
        setFeedbackMessage(`Failed to update feedback: ${error.message}`);
        return;
      }

      setFeedbackMessage("Feedback updated successfully.");
    } else {
      const { error } = await supabase
        .from("seller_feedback")
        .insert(payload);

      if (error) {
        setFeedbackMessage(`Failed to add feedback: ${error.message}`);
        return;
      }

      setFeedbackMessage("Feedback added successfully.");
    }

    setFeedbackForm(emptyFeedbackForm);
    setEditingFeedbackId("");
    await loadSellerViewings(sellerCaseId);
  }

  function handleEditOffer(item) {
    setEditingOfferId(item.id);
    setOfferForm({
      buyer_name: item.buyer_name || "",
      offer_amount: item.offer_amount ?? "",
      offer_date: item.offer_date || "",
      status: item.status || "open",
      remarks: item.remarks || "",
    });
    setOfferMessage("Editing offer.");
  }

  async function handleSaveOffer(e) {
    e.preventDefault();
    setOfferMessage("");

    if (!sellerCaseId) {
      setOfferMessage("Please save the seller case first.");
      return;
    }

    if (!offerForm.offer_amount) {
      setOfferMessage("Please fill in offer amount.");
      return;
    }

    const payload = {
      seller_case_id: sellerCaseId,
      buyer_name: offerForm.buyer_name || null,
      offer_amount: Number(offerForm.offer_amount),
      offer_date: offerForm.offer_date || null,
      status: offerForm.status || "open",
      remarks: offerForm.remarks || null,
    };

    if (editingOfferId) {
      const { error } = await supabase
        .from("seller_offers")
        .update(payload)
        .eq("id", editingOfferId);

      if (error) {
        setOfferMessage(`Failed to update offer: ${error.message}`);
        return;
      }

      setOfferMessage("Offer updated successfully.");
    } else {
      const { error } = await supabase
        .from("seller_offers")
        .insert(payload);

      if (error) {
        setOfferMessage(`Failed to add offer: ${error.message}`);
        return;
      }

      setOfferMessage("Offer added successfully.");
    }

    setOfferForm(emptyOfferForm);
    setEditingOfferId("");
    await loadSellerOffers(sellerCaseId);
  }

  const selectedClient = useMemo(
    () => clients.find((item) => item.id === selectedClientId),
    [clients, selectedClientId]
  );

  const feedbackViewings = useMemo(() => {
    return viewings.map((viewing) => ({
      ...viewing,
      label: `${viewing.viewing_date || "-"} — ${
        viewing.buyer_name || "Unknown buyer"
      }`,
    }));
  }, [viewings]);

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
            You are signed in as{" "}
            <span className="font-semibold">{currentUserEmail}</span>, but this
            page is only for approved admin accounts.
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
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#c8a287] font-semibold mb-2">
              NexDoor Internal
            </p>
            <h1 className="text-4xl font-bold">Admin Panel</h1>
            <p className="text-[#5f6b73] mt-2">
              Manage seller case details and push updates to the client
              dashboard.
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

        <section className="rounded-3xl bg-white border border-black/5 p-8 shadow-[0_8px_30px_rgba(0,0,0,0.06)] mb-8">
          <h2 className="text-2xl font-bold mb-2">Select Client</h2>
          <p className="text-[#5f6b73] mb-6">
            Choose the client you want to manage.
          </p>

          <select
            value={selectedClientId}
            onChange={(e) => handleClientChange(e.target.value)}
            className="w-full rounded-xl bg-[#faf9f7] border border-black/10 p-3"
          >
            <option value="">Choose a client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.full_name
                  ? `${client.full_name} — ${client.email}`
                  : client.email}
              </option>
            ))}
          </select>

          {selectedClient ? (
            <div className="mt-4 rounded-2xl bg-[#faf9f7] border border-black/5 p-4">
              <p className="font-semibold">
                {selectedClient.full_name || "No name added"}
              </p>
              <p className="text-sm text-[#5f6b73]">{selectedClient.email}</p>
            </div>
          ) : null}
        </section>

        <div className="grid gap-8 lg:grid-cols-2">
          <section className="rounded-3xl bg-white border border-black/5 p-8 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
            <h2 className="text-2xl font-bold mb-2">Seller Case</h2>
            <p className="text-[#5f6b73] mb-6">
              This controls the seller overview on the client dashboard.
            </p>

            <form onSubmit={handleSaveSellerCase} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Linked Property
                </label>
                <select
                  value={sellerCaseForm.property_id}
                  onChange={(e) =>
                    setSellerCaseForm((prev) => ({
                      ...prev,
                      property_id: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl bg-[#faf9f7] border border-black/10 p-3"
                >
                  <option value="">Choose a property</option>
                  {clientProperties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.address}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Stage</label>
                <input
                  type="text"
                  value={sellerCaseForm.stage}
                  onChange={(e) =>
                    setSellerCaseForm((prev) => ({
                      ...prev,
                      stage: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl bg-[#faf9f7] border border-black/10 p-3"
                  placeholder="live on market"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <InputField
                  label="Asking Price"
                  value={sellerCaseForm.asking_price}
                  onChange={(value) =>
                    setSellerCaseForm((prev) => ({
                      ...prev,
                      asking_price: value,
                    }))
                  }
                />
                <InputField
                  label="Days on Market"
                  value={sellerCaseForm.days_on_market}
                  onChange={(value) =>
                    setSellerCaseForm((prev) => ({
                      ...prev,
                      days_on_market: value,
                    }))
                  }
                />
                <InputField
                  label="Enquiries"
                  value={sellerCaseForm.enquiries_count}
                  onChange={(value) =>
                    setSellerCaseForm((prev) => ({
                      ...prev,
                      enquiries_count: value,
                    }))
                  }
                />
                <InputField
                  label="Viewings"
                  value={sellerCaseForm.viewings_count}
                  onChange={(value) =>
                    setSellerCaseForm((prev) => ({
                      ...prev,
                      viewings_count: value,
                    }))
                  }
                />
                <InputField
                  label="Offers"
                  value={sellerCaseForm.offers_count}
                  onChange={(value) =>
                    setSellerCaseForm((prev) => ({
                      ...prev,
                      offers_count: value,
                    }))
                  }
                />
                <InputField
                  label="Highest Offer"
                  value={sellerCaseForm.highest_offer}
                  onChange={(value) =>
                    setSellerCaseForm((prev) => ({
                      ...prev,
                      highest_offer: value,
                    }))
                  }
                />
              </div>

              {sellerCaseMessage ? <Notice text={sellerCaseMessage} /> : null}

              <button
                type="submit"
                className="w-full rounded-xl bg-[#36454f] text-white py-3 font-medium"
              >
                {sellerCaseId ? "Update Seller Case" : "Create Seller Case"}
              </button>
            </form>
          </section>

          <section className="rounded-3xl bg-white border border-black/5 p-8 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <h2 className="text-2xl font-bold">Listing Links</h2>
                <p className="text-[#5f6b73] mt-2">
                  These links appear inside the Listings tab on the client
                  dashboard.
                </p>
              </div>
              {editingListingLinkId ? (
                <button
                  type="button"
                  onClick={cancelListingLinkEdit}
                  className="rounded-xl border border-black/10 px-4 py-2 text-sm font-medium"
                >
                  Cancel Edit
                </button>
              ) : null}
            </div>

            <form onSubmit={handleSaveListingLink} className="space-y-4">
              <TextField
                label="Platform"
                value={listingLinkForm.platform}
                onChange={(value) =>
                  setListingLinkForm((prev) => ({ ...prev, platform: value }))
                }
                placeholder="PropertyGuru"
              />
              <TextField
                label="URL"
                value={listingLinkForm.url}
                onChange={(value) =>
                  setListingLinkForm((prev) => ({ ...prev, url: value }))
                }
                placeholder="https://..."
              />
              <TextField
                label="Listing Status"
                value={listingLinkForm.listing_status}
                onChange={(value) =>
                  setListingLinkForm((prev) => ({
                    ...prev,
                    listing_status: value,
                  }))
                }
                placeholder="live"
              />

              {listingLinkMessage ? <Notice text={listingLinkMessage} /> : null}

              <button
                type="submit"
                className="w-full rounded-xl bg-[#36454f] text-white py-3 font-medium"
              >
                {editingListingLinkId ? "Update Listing Link" : "Add Listing Link"}
              </button>
            </form>

            <div className="mt-6 space-y-3">
              {listingLinks.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl bg-[#faf9f7] border border-black/5 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">{item.platform}</p>
                      <p className="text-sm text-[#5f6b73] break-all">{item.url}</p>
                      <p className="text-xs text-[#7a858c] mt-1">
                        Status: {item.listing_status}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleEditListingLink(item)}
                      className="rounded-lg border border-black/10 px-3 py-1.5 text-sm font-medium"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="grid gap-8 lg:grid-cols-2 mt-8">
          <section className="rounded-3xl bg-white border border-black/5 p-8 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <h2 className="text-2xl font-bold">Viewings</h2>
                <p className="text-[#5f6b73] mt-2">
                  Add upcoming or completed viewings for the seller dashboard.
                </p>
              </div>
              {editingViewingId ? (
                <button
                  type="button"
                  onClick={cancelViewingEdit}
                  className="rounded-xl border border-black/10 px-4 py-2 text-sm font-medium"
                >
                  Cancel Edit
                </button>
              ) : null}
            </div>

            <form onSubmit={handleSaveViewing} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Viewing Date
                </label>
                <input
                  type="date"
                  value={viewingForm.viewing_date}
                  onChange={(e) =>
                    setViewingForm((prev) => ({
                      ...prev,
                      viewing_date: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl bg-[#faf9f7] border border-black/10 p-3"
                />
              </div>

              <TextField
                label="Viewing Time"
                value={viewingForm.viewing_time}
                onChange={(value) =>
                  setViewingForm((prev) => ({ ...prev, viewing_time: value }))
                }
                placeholder="2:00 PM"
              />

              <div>
                <label className="block text-sm font-medium mb-2">Buyer Type</label>
                <select
                  value={viewingForm.buyer_type}
                  onChange={(e) =>
                    setViewingForm((prev) => ({
                      ...prev,
                      buyer_type: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl bg-[#faf9f7] border border-black/10 p-3"
                >
                  <option value="agent">Agent</option>
                  <option value="direct buyer">Direct Buyer</option>
                </select>
              </div>

              <TextField
                label="Buyer Name"
                value={viewingForm.buyer_name}
                onChange={(value) =>
                  setViewingForm((prev) => ({ ...prev, buyer_name: value }))
                }
                placeholder="Marcus Tan"
              />

              <TextField
                label="Status"
                value={viewingForm.status}
                onChange={(value) =>
                  setViewingForm((prev) => ({ ...prev, status: value }))
                }
                placeholder="scheduled"
              />

              {viewingMessage ? <Notice text={viewingMessage} /> : null}

              <button
                type="submit"
                className="w-full rounded-xl bg-[#36454f] text-white py-3 font-medium"
              >
                {editingViewingId ? "Update Viewing" : "Add Viewing"}
              </button>
            </form>

            <div className="mt-6 space-y-3">
              {viewings.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl bg-[#faf9f7] border border-black/5 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">
                        {item.viewing_date}
                        {item.viewing_time ? ` • ${item.viewing_time}` : ""}
                      </p>
                      <p className="text-sm text-[#5f6b73]">
                        {item.buyer_type} • {item.buyer_name}
                      </p>
                      <p className="text-xs text-[#7a858c] mt-1">
                        Status: {item.status}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleEditViewing(item)}
                      className="rounded-lg border border-black/10 px-3 py-1.5 text-sm font-medium"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl bg-white border border-black/5 p-8 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <h2 className="text-2xl font-bold">Feedback</h2>
                <p className="text-[#5f6b73] mt-2">
                  Add post-viewing feedback that will appear on the client
                  dashboard.
                </p>
              </div>
              {editingFeedbackId ? (
                <button
                  type="button"
                  onClick={cancelFeedbackEdit}
                  className="rounded-xl border border-black/10 px-4 py-2 text-sm font-medium"
                >
                  Cancel Edit
                </button>
              ) : null}
            </div>

            <form onSubmit={handleSaveFeedback} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Choose Viewing
                </label>
                <select
                  value={feedbackForm.seller_viewing_id}
                  onChange={(e) =>
                    setFeedbackForm((prev) => ({
                      ...prev,
                      seller_viewing_id: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl bg-[#faf9f7] border border-black/10 p-3"
                >
                  <option value="">Choose a viewing</option>
                  {feedbackViewings.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <TextField
                label="Interest Level"
                value={feedbackForm.interest_level}
                onChange={(value) =>
                  setFeedbackForm((prev) => ({
                    ...prev,
                    interest_level: value,
                  }))
                }
                placeholder="keen / maybe / not keen"
              />

              <TextField
                label="Follow-up Status"
                value={feedbackForm.follow_up_status}
                onChange={(value) =>
                  setFeedbackForm((prev) => ({
                    ...prev,
                    follow_up_status: value,
                  }))
                }
                placeholder="followed up"
              />

              <div>
                <label className="block text-sm font-medium mb-2">
                  Feedback Notes
                </label>
                <textarea
                  rows={4}
                  value={feedbackForm.feedback_notes}
                  onChange={(e) =>
                    setFeedbackForm((prev) => ({
                      ...prev,
                      feedback_notes: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl bg-[#faf9f7] border border-black/10 p-3"
                  placeholder="Buyer likes the layout but feels the asking price is slightly high."
                />
              </div>

              {feedbackMessage ? <Notice text={feedbackMessage} /> : null}

              <button
                type="submit"
                className="w-full rounded-xl bg-[#36454f] text-white py-3 font-medium"
              >
                {editingFeedbackId ? "Update Feedback" : "Add Feedback"}
              </button>
            </form>

            <div className="mt-6 space-y-3">
              {feedbackItems.map((item) => {
                const linkedViewing = viewings.find(
                  (viewing) => viewing.id === item.seller_viewing_id
                );

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl bg-[#faf9f7] border border-black/5 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm text-[#7a858c]">
                          Viewing:{" "}
                          {linkedViewing
                            ? `${linkedViewing.viewing_date || "-"} • ${
                                linkedViewing.buyer_name || "Unknown buyer"
                              }`
                            : "Unknown viewing"}
                        </p>
                        <p className="text-sm text-[#7a858c] mt-1">
                          Interest: {item.interest_level || "-"} • Follow-up:{" "}
                          {item.follow_up_status || "-"}
                        </p>
                        <p className="text-sm mt-2">
                          {item.feedback_notes || "No notes."}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleEditFeedback(item)}
                        className="rounded-lg border border-black/10 px-3 py-1.5 text-sm font-medium"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <section className="rounded-3xl bg-white border border-black/5 p-8 shadow-[0_8px_30px_rgba(0,0,0,0.06)] mt-8">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <h2 className="text-2xl font-bold">Offers</h2>
              <p className="text-[#5f6b73] mt-2">
                Add offers received so clients can track them clearly.
              </p>
            </div>
            {editingOfferId ? (
              <button
                type="button"
                onClick={cancelOfferEdit}
                className="rounded-xl border border-black/10 px-4 py-2 text-sm font-medium"
              >
                Cancel Edit
              </button>
            ) : null}
          </div>

          <form onSubmit={handleSaveOffer} className="grid gap-4 md:grid-cols-2">
            <TextField
              label="Buyer Name"
              value={offerForm.buyer_name}
              onChange={(value) =>
                setOfferForm((prev) => ({ ...prev, buyer_name: value }))
              }
              placeholder="Rachel Lim"
            />
            <InputField
              label="Offer Amount"
              value={offerForm.offer_amount}
              onChange={(value) =>
                setOfferForm((prev) => ({ ...prev, offer_amount: value }))
              }
            />

            <div>
              <label className="block text-sm font-medium mb-2">Offer Date</label>
              <input
                type="date"
                value={offerForm.offer_date}
                onChange={(e) =>
                  setOfferForm((prev) => ({
                    ...prev,
                    offer_date: e.target.value,
                  }))
                }
                className="w-full rounded-xl bg-[#faf9f7] border border-black/10 p-3"
              />
            </div>

            <TextField
              label="Status"
              value={offerForm.status}
              onChange={(value) =>
                setOfferForm((prev) => ({ ...prev, status: value }))
              }
              placeholder="open / negotiating / accepted"
            />

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Remarks</label>
              <textarea
                rows={4}
                value={offerForm.remarks}
                onChange={(e) =>
                  setOfferForm((prev) => ({ ...prev, remarks: e.target.value }))
                }
                className="w-full rounded-xl bg-[#faf9f7] border border-black/10 p-3"
                placeholder="Buyer wants flexibility on timeline."
              />
            </div>

            <div className="md:col-span-2">
              {offerMessage ? <Notice text={offerMessage} /> : null}
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full rounded-xl bg-[#36454f] text-white py-3 font-medium"
              >
                {editingOfferId ? "Update Offer" : "Add Offer"}
              </button>
            </div>
          </form>

          <div className="mt-6 space-y-3">
            {offers.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl bg-[#faf9f7] border border-black/5 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">
                      ${Number(item.offer_amount || 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-[#5f6b73]">
                      {item.buyer_name || "Unknown buyer"} •{" "}
                      {item.offer_date || "-"} • {item.status || "open"}
                    </p>
                    <p className="text-sm mt-2">{item.remarks || "No remarks."}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleEditOffer(item)}
                    className="rounded-lg border border-black/10 px-3 py-1.5 text-sm font-medium"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function InputField({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl bg-[#faf9f7] border border-black/10 p-3"
      />
    </div>
  );
}

function TextField({ label, value, onChange, placeholder = "" }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl bg-[#faf9f7] border border-black/10 p-3"
        placeholder={placeholder}
      />
    </div>
  );
}

function Notice({ text }) {
  return (
    <div className="rounded-xl bg-[#f5efe8] border border-[#e7d8c7] px-4 py-3 text-sm text-[#6b5b4d]">
      {text}
    </div>
  );
}
