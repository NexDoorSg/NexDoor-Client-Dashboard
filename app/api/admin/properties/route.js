import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAILS = [
  "bjornlim@nexdoor.sg",
  "abigailtang@nexdoor.sg",
  "daveteo@nexdoor.sg",
].map((email) => email.toLowerCase());

export async function GET(request) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();

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

    const authClient = createClient(supabaseUrl, anonKey);

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser(token);

    if (userError || !user?.email) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const callerEmail = user.email.toLowerCase();

    if (!ADMIN_EMAILS.includes(callerEmail)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data, error } = await adminClient
      .from("properties")
      .select("id, address, property_type, status, purchase_price, notes, client_id")
      .order("address", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ properties: data || [] });
  } catch (error) {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
