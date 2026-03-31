import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ADMIN_EMAILS = [
  "bjornlim@nexdoor.sg",
  "bjornlimdongxian@gmail.com",
  "abigailtang@nexdoor.sg",
  "daveteo@nexdoor.sg",
].map((email) => email.toLowerCase());

export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }

    const {
      data: { user: requester },
      error: requesterError,
    } = await supabaseAdmin.auth.getUser(token);

    if (requesterError || !requester) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requesterEmail = requester.email?.toLowerCase() || "";

    if (!ADMIN_EMAILS.includes(requesterEmail)) {
      return NextResponse.json(
        { error: `Forbidden. Logged in as: ${requesterEmail}` },
        { status: 403 }
      );
    }

    const body = await request.json();

    const email = body?.email?.trim()?.toLowerCase();
    const full_name = body?.full_name?.trim() || "";
    const password = body?.password?.trim() || "Temp123456!";

    if (!email || !full_name) {
      return NextResponse.json(
        { error: "Email and full name are required" },
        { status: 400 }
      );
    }

    const { data: createdUserData, error: createUserError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name,
          role: "client",
        },
      });

    if (createUserError) {
      return NextResponse.json(
        { error: createUserError.message },
        { status: 400 }
      );
    }

    const createdUser = createdUserData?.user;

    if (!createdUser?.id) {
      return NextResponse.json(
        { error: "User created but no user ID returned" },
        { status: 500 }
      );
    }

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: createdUser.id,
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

    return NextResponse.json({
      success: true,
      user: {
        id: createdUser.id,
        email,
        full_name,
        role: "client",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
