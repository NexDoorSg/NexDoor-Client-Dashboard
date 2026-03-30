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

    if (!email) {
      return NextResponse.json(
        { error: "Client email is required." },
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

    // Use normal client to verify who is calling this API
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

    // Service role client for admin actions
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

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

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Server error." },
      { status: 500 }
    );
  }
}
