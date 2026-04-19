import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const accessToken = authHeader.replace("Bearer ", "").trim();
  if (!accessToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const passcode = (body.passcode as string | undefined)?.trim().toUpperCase();
  if (!passcode) return NextResponse.json({ error: "Passcode is required." }, { status: 400 });

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const email = user.email.toLowerCase();

  // Validate: email from session + passcode must both match a pending invite
  const { data: invite, error: lookupError } = await adminClient
    .from("partner_invites")
    .select("id, inviter_id")
    .eq("email", email)
    .eq("passcode", passcode)
    .is("used_at", null)
    .maybeSingle();

  if (lookupError) return NextResponse.json({ error: "Lookup failed." }, { status: 500 });
  if (!invite) return NextResponse.json({ activated: false });

  const [{ error: profileError }, { error: inviteError }] = await Promise.all([
    adminClient.from("user_profiles").upsert(
      { id: user.id, role: "partner", linked_to: invite.inviter_id, onboarding_completed: true },
      { onConflict: "id" }
    ),
    adminClient.from("partner_invites")
      .update({ used_at: new Date().toISOString() })
      .eq("id", invite.id),
  ]);

  if (profileError || inviteError) {
    return NextResponse.json({ error: "Failed to activate partner account." }, { status: 500 });
  }

  return NextResponse.json({ activated: true });
}
