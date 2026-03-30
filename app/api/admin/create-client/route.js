import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAILS = [
  "bjornlim@nexdoor.sg",
  "abigailtang@nexdoor.sg",
  "daveteo@nexdoor.sg",
];

export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization");

    const body = await request.json();
    const email = body?.email?.trim()?.toLowerCase();
    const full_name = body?.full_name?.trim() || null;

    if (!email) {
      return NextResponse.json({ error: "Client email is required." }, { status: 400 });
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

    const userClient = createClient(supabaseUrl, anonKey, {
      global: {
        headers: {
          Authorization: authHeader || "",
        },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user?.email) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    if (!ADMIN_EMAILS.includes(user.email)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: createdUser, error: createUserError } =
      await adminClient.auth.admin.createUser({
        email,
        email_confirm: true,
      });

    if (createUserError) {
      return NextResponse.json({ error: createUserError.message }, { status: 400 });
    }

    const newUserId = createdUser?.user?.id;

    if (!newUserId) {
      return NextResponse.json({ error: "Failed to create auth user." }, { status: 500 });
    }

    const { error: profileError } = await adminClient.from("profiles").upsert({
      id: newUserId,
      email,
      full_name,
      role: "client",
    });

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
