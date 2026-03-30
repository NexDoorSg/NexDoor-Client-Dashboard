"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

const SELLING_TABS = ["Overview", "Listings", "Viewings", "Feedback", "Offers"];
const BUYING_TABS = ["Shortlisted", "Saved", "Interested to View"];

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const [mode, setMode] = useState("Selling");
  const [sellingTab, setSellingTab] = useState("Overview");
  const [buyingTab, setBuyingTab] = useState("Shortlisted");

  const [sellerCase, setSellerCase] = useState(null);
  const [sellerProperty, setSellerProperty] = useState(null);
  const [sellerListingLinks, setSellerListingLinks] = useState([]);
  const [sellerViewings, setSellerViewings] = useState([]);
  const [sellerFeedback, setSellerFeedback] = useState([]);
  const [sellerOffers, setSellerOffers] = useState([]);

  const [buyerCase, setBuyerCase] = useState(null);
  const [buyerListings, setBuyerListings] = useState([]);
  const [savedListings, setSavedListings] = useState([]);
  const [viewRequestListings, setViewRequestListings] = useState([]);

  useEffect(() => {
    initializeDashboard();
  }, []);

  async function initializeDashboard() {
    try {
      setLoading(true);
      setErrorMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        window.location.href = "/";
        return;
      }

      setCurrentUser(user);

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, full_name, role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        setErrorMessage(`Failed to load profile: ${profileError.message}`);
        return;
      }

      setProfile(profileData);

      await Promise.all([
        loadSellingData(user.id),
        loadBuyingData(user.id),
      ]);
    } catch (error) {
      setErrorMessage("Something went wrong while loading your dashboard.");
    } finally {
      setLoading(false);
    }
  }

  async function loadSellingData(clientId) {
    const { data: sellerCaseData, error: sellerCaseError } = await supabase
      .from("seller_cases")
      .select("*")
      .eq("client_id", clientId)
      .maybeSingle();

    if (sellerCaseError) {
      setErrorMessage(`Failed to load seller case: ${sellerCaseError.message}`);
      return;
    }

    setSellerCase(sellerCaseData);

    if (!sellerCaseData) return;

    if (sellerCaseData.property_id) {
      const { data: propertyData, error: propertyError } = await supabase
        .from("properties")
        .select("id, address, property_type, status, purchase_price, notes")
        .eq("id", sellerCaseData.property_id)
        .maybeSingle();

      if (!propertyError) {
        setSellerProperty(propertyData);
      }
    }

    const [
      listingLinksRes,
      viewingsRes,
      offersRes,
    ] = await Promise.all([
      supabase
        .from("seller_listing_links")
        .select("*")
        .eq("seller_case_id", sellerCaseData.id)
        .order("created_at", { ascending: true }),

      supabase
        .from("seller_viewings")
        .select("*")
        .eq("seller_case_id", sellerCaseData.id)
        .order("viewing_date", { ascending: true }),

      supabase
        .from("seller_offers")
        .select("*")
        .eq("seller_case_id", sellerCaseData.id)
        .order("offer_date", { ascending: false }),
    ]);

    if (!listingLinksRes.error) setSellerListingLinks(listingLinksRes.data || []);
    if (!viewingsRes.error) setSellerViewings(viewingsRes.data || []);
    if (!offersRes.error) setSellerOffers(offersRes.data || []);

    const viewingIds = (viewingsRes.data || []).map((item) => item.id);

    if (viewingIds.length > 0) {
      const { data: feedbackData, error: feedbackError } = await supabase
        .from("seller_feedback")
        .select("*")
        .in("seller_viewing_id", viewingIds)
        .order("created_at", { ascending: false });

      if (!feedbackError) {
        setSellerFeedback(feedbackData || []);
      }
    }
  }

  async function loadBuyingData(clientId) {
    const { data: buyerCaseData, error: buyerCaseError } = await supabase
      .from("buyer_cases")
      .select("*")
      .eq("client_id", clientId)
      .maybeSingle();

    if (buyerCaseError) {
      setErrorMessage(`Failed to load buyer case: ${buyerCaseError.message}`);
      return;
    }

    setBuyerCase(buyerCaseData);

    if (!buyerCaseData) return;

    const { data: allBuyerListings, error: buyerListingsError } = await supabase
      .from("buyer_listings")
      .select("*")
      .eq("buyer_case_id", buyerCaseData.id)
      .order("created_at", { ascending: false });

    if (buyerListingsError) {
      setErrorMessage(`Failed to load buyer listings: ${buyerListingsError.message}`);
      return;
    }

    const listings = allBuyerListings || [];
    setBuyerListings(listings);

    const [savedRes, viewReqRes] = await Promise.all([
      supabase
        .from("buyer_saved_listings")
        .select("*")
        .eq("client_id", clientId),

      supabase
        .from("buyer_view_requests")
        .select("*")
        .eq("client_id", clientId),
    ]);

    const savedRows = savedRes.data || [];
    const viewRows = viewReqRes.data || [];

    const savedIds = savedRows.map((item) => item.buyer_listing_id);
    const viewIds = viewRows.map((item) => item.buyer_listing_id);

    setSavedListings(listings.filter((item) => savedIds.includes(item.id)));
    setViewRequestListings(listings.filter((item) => viewIds.includes(item.id)));
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  async function handleSaveListing(listingId) {
    if (!currentUser?.id) return;

    const alreadySaved = savedListings.some((item) => item.id === listingId);
    if (alreadySaved) return;

    const { error } = await supabase.from("buyer_saved_listings").insert({
      buyer_listing_id: listingId,
      client_id: currentUser.id,
    });

    if (!error) {
      await loadBuyingData(currentUser.id);
      setBuyingTab("Saved");
    }
  }

  async function handleInterestedToView(listingId) {
    if (!currentUser?.id) return;

    const alreadyRequested = viewRequestListings.some((item) => item.id === listingId);
    if (alreadyRequested) return;

    const { error } = await supabase.from("buyer_view_requests").insert({
      buyer_listing_id: listingId,
      client_id: currentUser.id,
      status: "interested to view",
    });

    if (!error) {
      await loadBuyingData(currentUser.id);
      setBuyingTab("Interested to View");
    }
  }

  const feedbackByViewingId = useMemo(() => {
    const map = {};
    for (const item of sellerFeedback) {
      map[item.seller_viewing_id] = item;
    }
    return map;
  }, [sellerFeedback]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f5f2] text-[#36454f] flex items-center justify-center">
        <p className="text-lg">Loading your dashboard...</p>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="min-h-screen bg-[#f7f5f2] text-[#36454f] flex items-center justify-center px-6">
        <div className="max-w-xl w-full rounded-3xl bg-white border border-black/5 p-8 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
          <h1 className="text-2xl font-bold mb-3">Unable to load dashboard</h1>
          <p className="text-[#5f6b73] mb-6">{errorMessage}</p>
          <button
            onClick={handleLogout}
            className="rounded-xl bg-[#36454f] text-white px-5 py-3 font-medium"
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
              NexDoor Client Dashboard
            </p>
            <h1 className="text-4xl font-bold">
              Welcome{profile?.full_name ? `, ${profile.full_name}` : ""}
            </h1>
            <p className="text-[#5f6b73] mt-2">
              Track your selling and buying progress in one place.
            </p>
          </div>

          <div className="bg-white rounded-2xl px-5 py-4 border border-black/5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <p className="text-sm text-[#7a858c]">Signed in as</p>
            <p className="font-semibold">{profile?.email || currentUser?.email}</p>
            <button
              onClick={handleLogout}
              className="mt-3 text-sm font-medium underline underline-offset-4"
            >
              Log out
            </button>
          </div>
        </div>

        <div className="flex gap-3 mb-8">
          {["Selling", "Buying"].map((item) => (
            <button
              key={item}
              onClick={() => setMode(item)}
              className={`rounded-full px-5 py-2.5 text-sm font-medium border ${
                mode === item
                  ? "bg-[#36454f] text-white border-[#36454f]"
                  : "bg-white text-[#36454f] border-black/10"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        {mode === "Selling" ? (
          <div>
            <StageBanner
              title="Selling Progress"
              stage={sellerCase?.stage || "No active selling case"}
            />

            <TabRow
              tabs={SELLING_TABS}
              activeTab={sellingTab}
              onChange={setSellingTab}
            />

            {sellingTab === "Overview" && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-6">
                <InfoCard
                  title="Property"
                  value={sellerProperty?.address || "No property linked"}
                  subtitle={sellerProperty?.property_type || ""}
                />
                <InfoCard
                  title="Asking Price"
                  value={
                    sellerCase?.asking_price
                      ? `$${Number(sellerCase.asking_price).toLocaleString()}`
                      : "-"
                  }
                />
                <InfoCard
                  title="Days on Market"
                  value={sellerCase?.days_on_market ?? 0}
                />
                <InfoCard
                  title="Highest Offer"
                  value={
                    sellerCase?.highest_offer
                      ? `$${Number(sellerCase.highest_offer).toLocaleString()}`
                      : "-"
                  }
                />
                <InfoCard
                  title="Enquiries"
                  value={sellerCase?.enquiries_count ?? 0}
                />
                <InfoCard
                  title="Viewings"
                  value={sellerCase?.viewings_count ?? 0}
                />
                <InfoCard
                  title="Offers"
                  value={sellerCase?.offers_count ?? 0}
                />
                <InfoCard
                  title="Status"
                  value={sellerProperty?.status || sellerCase?.stage || "-"}
                />

                <div className="md:col-span-2 lg:col-span-4 rounded-3xl bg-white border border-black/5 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                  <p className="text-sm text-[#7a858c] mb-2">Notes</p>
                  <p>{sellerProperty?.notes || "No notes added yet."}</p>
                </div>
              </div>
            )}

            {sellingTab === "Listings" && (
              <div className="grid gap-4 mt-6">
                {sellerListingLinks.length === 0 ? (
                  <EmptyState text="No listing links added yet." />
                ) : (
                  sellerListingLinks.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-3xl bg-white border border-black/5 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
                    >
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-lg font-semibold">{item.platform}</p>
                          <p className="text-sm text-[#7a858c]">
                            Status: {item.listing_status || "live"}
                          </p>
                        </div>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-medium underline underline-offset-4"
                        >
                          Open listing
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {sellingTab === "Viewings" && (
              <div className="grid gap-4 mt-6">
                {sellerViewings.length === 0 ? (
                  <EmptyState text="No viewings scheduled yet." />
                ) : (
                  sellerViewings.map((item) => {
                    const feedback = feedbackByViewingId[item.id];
                    return (
                      <div
                        key={item.id}
                        className="rounded-3xl bg-white border border-black/5 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="text-lg font-semibold">
                              {item.viewing_date} {item.viewing_time ? `• ${item.viewing_time}` : ""}
                            </p>
                            <p className="text-sm text-[#7a858c]">
                              {item.buyer_type || "-"} • {item.buyer_name || "Unknown buyer"}
                            </p>
                          </div>
                          <span className="rounded-full bg-[#f5efe8] px-3 py-1 text-xs font-medium text-[#6b5b4d]">
                            {item.status || "scheduled"}
                          </span>
                        </div>

                        {feedback ? (
                          <div className="mt-4 rounded-2xl bg-[#faf9f7] p-4 border border-black/5">
                            <p className="text-sm font-medium mb-1">
                              Feedback
                            </p>
                            <p className="text-sm text-[#5f6b73] mb-2">
                              Interest: {feedback.interest_level || "-"} • Follow-up: {feedback.follow_up_status || "-"}
                            </p>
                            <p className="text-sm">{feedback.feedback_notes || "No notes yet."}</p>
                          </div>
                        ) : (
                          <div className="mt-4 rounded-2xl bg-[#faf9f7] p-4 border border-black/5 text-sm text-[#5f6b73]">
                            No feedback added yet.
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {sellingTab === "Feedback" && (
              <div className="grid gap-4 mt-6">
                {sellerFeedback.length === 0 ? (
                  <EmptyState text="No feedback records yet." />
                ) : (
                  sellerFeedback.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-3xl bg-white border border-black/5 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
                    >
                      <p className="text-sm text-[#7a858c] mb-2">
                        Interest: {item.interest_level || "-"} • Follow-up: {item.follow_up_status || "-"}
                      </p>
                      <p>{item.feedback_notes || "No notes."}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {sellingTab === "Offers" && (
              <div className="grid gap-4 mt-6">
                {sellerOffers.length === 0 ? (
                  <EmptyState text="No offers received yet." />
                ) : (
                  sellerOffers.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-3xl bg-white border border-black/5 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-lg font-semibold">
                            ${Number(item.offer_amount || 0).toLocaleString()}
                          </p>
                          <p className="text-sm text-[#7a858c]">
                            {item.buyer_name || "Unknown buyer"} • {item.offer_date || "-"}
                          </p>
                        </div>
                        <span className="rounded-full bg-[#f5efe8] px-3 py-1 text-xs font-medium text-[#6b5b4d]">
                          {item.status || "open"}
                        </span>
                      </div>

                      <p className="mt-4 text-sm">
                        {item.remarks || "No remarks added."}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ) : (
          <div>
            <StageBanner
              title="Buying Progress"
              stage={buyerCase?.stage || "No active buying case"}
            />

            <TabRow
              tabs={BUYING_TABS}
              activeTab={buyingTab}
              onChange={setBuyingTab}
            />

            {buyingTab === "Shortlisted" && (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 mt-6">
                {buyerListings.length === 0 ? (
                  <div className="md:col-span-2 xl:col-span-3">
                    <EmptyState text="No shortlisted listings yet." />
                  </div>
                ) : (
                  buyerListings.map((item) => (
                    <ListingCard
                      key={item.id}
                      item={item}
                      onSave={() => handleSaveListing(item.id)}
                      onInterested={() => handleInterestedToView(item.id)}
                      isSaved={savedListings.some((saved) => saved.id === item.id)}
                      isInterested={viewRequestListings.some((req) => req.id === item.id)}
                    />
                  ))
                )}
              </div>
            )}

            {buyingTab === "Saved" && (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 mt-6">
                {savedListings.length === 0 ? (
                  <div className="md:col-span-2 xl:col-span-3">
                    <EmptyState text="You have not saved any listings yet." />
                  </div>
                ) : (
                  savedListings.map((item) => (
                    <ListingCard
                      key={item.id}
                      item={item}
                      onSave={() => {}}
                      onInterested={() => handleInterestedToView(item.id)}
                      isSaved={true}
                      isInterested={viewRequestListings.some((req) => req.id === item.id)}
                    />
                  ))
                )}
              </div>
            )}

            {buyingTab === "Interested to View" && (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 mt-6">
                {viewRequestListings.length === 0 ? (
                  <div className="md:col-span-2 xl:col-span-3">
                    <EmptyState text="No viewing requests yet." />
                  </div>
                ) : (
                  viewRequestListings.map((item) => (
                    <ListingCard
                      key={item.id}
                      item={item}
                      onSave={() => handleSaveListing(item.id)}
                      onInterested={() => {}}
                      isSaved={savedListings.some((saved) => saved.id === item.id)}
                      isInterested={true}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function StageBanner({ title, stage }) {
  return (
    <div className="rounded-3xl bg-white border border-black/5 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] mb-6">
      <p className="text-sm text-[#7a858c] mb-2">{title}</p>
      <p className="text-2xl font-bold capitalize">{stage}</p>
    </div>
  );
}

function TabRow({ tabs, activeTab, onChange }) {
  return (
    <div className="flex gap-3 flex-wrap">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`rounded-full px-4 py-2 text-sm font-medium border ${
            activeTab === tab
              ? "bg-[#36454f] text-white border-[#36454f]"
              : "bg-white text-[#36454f] border-black/10"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

function InfoCard({ title, value, subtitle = "" }) {
  return (
    <div className="rounded-3xl bg-white border border-black/5 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
      <p className="text-sm text-[#7a858c] mb-2">{title}</p>
      <p className="text-xl font-bold break-words">{value}</p>
      {subtitle ? <p className="text-sm text-[#5f6b73] mt-1">{subtitle}</p> : null}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-3xl bg-white border border-black/5 p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] text-[#5f6b73]">
      {text}
    </div>
  );
}

function ListingCard({ item, onSave, onInterested, isSaved, isInterested }) {
  return (
    <div className="rounded-3xl bg-white border border-black/5 overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
      {item.thumbnail_url ? (
        <img
          src={item.thumbnail_url}
          alt={item.title}
          className="w-full h-48 object-cover"
        />
      ) : (
        <div className="w-full h-48 bg-[#ece7e1]" />
      )}

      <div className="p-6">
        <p className="text-xl font-bold mb-1">{item.title}</p>
        <p className="text-sm text-[#7a858c] mb-4">{item.address || "-"}</p>

        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          <div>
            <p className="text-[#7a858c]">Price</p>
            <p className="font-medium">
              {item.price ? `$${Number(item.price).toLocaleString()}` : "-"}
            </p>
          </div>
          <div>
            <p className="text-[#7a858c]">Bedrooms</p>
            <p className="font-medium">{item.bedrooms || "-"}</p>
          </div>
          <div>
            <p className="text-[#7a858c]">Size</p>
            <p className="font-medium">
              {item.size_sqft ? `${item.size_sqft} sqft` : "-"}
            </p>
          </div>
          <div>
            <p className="text-[#7a858c]">District</p>
            <p className="font-medium">{item.district || "-"}</p>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm font-medium mb-1">Why we shortlisted this</p>
          <p className="text-sm text-[#5f6b73]">
            {item.shortlist_reason || "No shortlist reason added."}
          </p>
        </div>

        <div className="mb-4">
          <p className="text-sm font-medium mb-1">Agent notes</p>
          <p className="text-sm text-[#5f6b73]">
            {item.agent_notes || "No notes added."}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={onSave}
            disabled={isSaved}
            className="rounded-xl border border-black/10 px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {isSaved ? "Saved" : "Save"}
          </button>

          <button
            onClick={onInterested}
            disabled={isInterested}
            className="rounded-xl bg-[#36454f] text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {isInterested ? "Interested to View" : "Mark Interested to View"}
          </button>

          {item.listing_url ? (
            <a
              href={item.listing_url}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-black/10 px-4 py-2 text-sm font-medium"
            >
              Open Listing
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
