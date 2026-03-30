import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAILS = [
  "bjornlim@nexdoor.sg",
  "abigailtang@nexdoor.sg",
  "daveteo@nexdoor.sg",
].map((email) => email.toLowerCase());

export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();

    const body = await request.json();

    const email = body?.email?.trim()?.toLowerCase();
    const full_name = body?.full_name?.trim() || null;
    const address = body?.address?.trim() || "";
    const property_type = body?.property_type?.trim() || null;
    const status = body?.status?.trim() || "active";
    const purchase_price =
      body?.purchase_price === "" ||
      body?.purchase_price === null ||
      body?.purchase_price === undefined
        ? null
        : Number(body.purchase_price);
    const notes = body?.notes?.trim() || null;

    if (!email) {
      return NextResponse.json(
        { error: "Client email is required." },
        { status: 400 }
      );
    }

    if (!address) {
      return NextResponse.json(
        { error: "Property address is required." },
        { status: 400 }
      );
    }

    if (
      purchase_price !== null &&
      (Number.isNaN(purchase_price) || purchase_price < 0)
    ) {
      return NextResponse.json(
        { error: "Purchase price must be a valid number." },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Missing Supabase environment variables." },
        { status: 500 }
      );
    }

    if (!token) {
      return NextResponse.json(
        { error: "Missing access token." },
        { status: 401 }
      );
    }

    // Verify caller
    const authClient = createClient(supabaseUrl, anonKey);

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser(token);

    if (userError || !user?.email) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const callerEmail = user.email.toLowerCase();

    if (!ADMIN_EMAILS.includes(callerEmail)) {
      return NextResponse.json(
        { error: `This account is not allowed: ${callerEmail}` },
        { status: 403 }
      );
    }

    // Admin client
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Create auth user
    const { data: createdUser, error: createUserError } =
      await adminClient.auth.admin.createUser({
        email,
        email_confirm: true,
      });

    if (createUserError) {
      return NextResponse.json(
        { error: createUserError.message },
        { status: 400 }
      );
    }

    const newUserId = createdUser?.user?.id;

    if (!newUserId) {
      return NextResponse.json(
        { error: "Failed to create auth user." },
        { status: 500 }
      );
    }

    // Create profile
    const { error: profileError } = await adminClient.from("profiles").upsert({
      id: newUserId,
      email,
      full_name,
      role: "client",
    });

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message },
        { status: 400 }
      );
    }

    // Create property linked to client
    const { data: propertyData, error: propertyError } = await adminClient
      .from("properties")
      .insert({
        client_id: newUserId,
        address,
        property_type,
        status,
        purchase_price,
        notes,
      })
      .select()
      .single();

    if (propertyError) {
      return NextResponse.json(
        { error: propertyError.message },
        { status: 400 }
      );
    }

    const propertyId = propertyData?.id || null;

    if (!propertyId) {
      return NextResponse.json(
        { error: "Failed to create property." },
        { status: 500 }
      );
    }

    // Auto-create default seller case
    const { data: sellerCaseData, error: sellerCaseError } = await adminClient
      .from("seller_cases")
      .insert({
        client_id: newUserId,
        property_id: propertyId,
        stage: "live on market",
        asking_price: null,
        days_on_market: 0,
        enquiries_count: 0,
        viewings_count: 0,
        offers_count: 0,
        highest_offer: 0,
      })
      .select()
      .single();

    if (sellerCaseError) {
      return NextResponse.json(
        { error: sellerCaseError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      client_id: newUserId,
      property_id: propertyId,
      seller_case_id: sellerCaseData?.id || null,
    });
  } catch (error) {
    console.error("create-client route error:", error);

    return NextResponse.json(
      { error: "Server error." },
      { status: 500 }
    );
  }
}
