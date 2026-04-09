import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const accessToken = authHeader.replace("Bearer ", "").trim();

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  // Verify the JWT and get the requesting user
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const email = (body.email as string | undefined)?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  // Check for an existing pending invite (not expired, not used)
  const { data: existing } = await adminClient
    .from("partner_invites")
    .select("id, expires_at")
    .eq("inviter_id", user.id)
    .eq("email", email)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "An active invite for this email already exists. It will expire in 72 hours." },
      { status: 409 }
    );
  }

  // Create the invite
  const { data: invite, error: insertError } = await adminClient
    .from("partner_invites")
    .insert({ email, inviter_id: user.id })
    .select("token")
    .single();

  if (insertError || !invite) {
    return NextResponse.json({ error: "Failed to create invite." }, { status: 500 });
  }

  const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "";
  const inviteUrl = `${origin}/partner/invite?token=${invite.token}`;

  return NextResponse.json({ success: true, inviteUrl });
}
