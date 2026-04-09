import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")?.trim();
  if (!token) {
    return NextResponse.json({ valid: false, error: "No token provided." });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    return NextResponse.json({ valid: false, error: "Server misconfigured." });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: invite } = await adminClient
    .from("partner_invites")
    .select("id, inviter_id, used_at, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (!invite) {
    return NextResponse.json({ valid: false, error: "This invite link is invalid." });
  }
  if (invite.used_at) {
    return NextResponse.json({ valid: false, error: "This invite has already been used." });
  }
  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ valid: false, error: "This invite has expired. Ask your partner to send a new one." });
  }

  // Get inviter name
  const { data: inviterProfile } = await adminClient
    .from("user_profiles")
    .select("display_name")
    .eq("id", invite.inviter_id)
    .maybeSingle();

  return NextResponse.json({
    valid: true,
    inviterName: (inviterProfile?.display_name as string | null) || null,
  });
}
