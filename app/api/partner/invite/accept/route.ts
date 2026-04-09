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

  // Verify the JWT — this is the partner (newly signed-up user)
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const token = (body.token as string | undefined)?.trim();
  if (!token) {
    return NextResponse.json({ error: "Token is required." }, { status: 400 });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  // Look up the invite
  const { data: invite, error: inviteError } = await adminClient
    .from("partner_invites")
    .select("id, inviter_id, used_at, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (inviteError || !invite) {
    return NextResponse.json({ error: "Invalid or expired invite." }, { status: 404 });
  }
  if (invite.used_at) {
    return NextResponse.json({ error: "This invite has already been used." }, { status: 410 });
  }
  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: "This invite has expired. Ask your partner to send a new one." }, { status: 410 });
  }

  // Mark invite used + set partner role and link to inviter
  const [{ error: profileError }, { error: inviteUpdateError }] = await Promise.all([
    adminClient
      .from("user_profiles")
      .update({
        role: "partner",
        linked_to: invite.inviter_id,
        onboarding_completed: true,
      })
      .eq("id", user.id),
    adminClient
      .from("partner_invites")
      .update({ used_at: new Date().toISOString() })
      .eq("id", invite.id),
  ]);

  if (profileError || inviteUpdateError) {
    return NextResponse.json({ error: "Failed to activate partner account." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
