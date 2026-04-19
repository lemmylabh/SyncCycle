import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";

export const runtime = "nodejs";

const PASSCODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generatePasscode(): string {
  const bytes = randomBytes(8);
  return Array.from(bytes).map(b => PASSCODE_CHARS[b % PASSCODE_CHARS.length]).join("");
}

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
  if (userError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const email = (body.email as string | undefined)?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
  }

  if (email === user.email?.toLowerCase()) {
    return NextResponse.json({ error: "You cannot add yourself as a partner." }, { status: 400 });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: existing } = await adminClient
    .from("partner_invites")
    .select("id")
    .eq("inviter_id", user.id)
    .eq("email", email)
    .is("used_at", null)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "This email is already registered as a partner." }, { status: 409 });
  }

  const passcode = generatePasscode();
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 10);

  const { error: insertError } = await adminClient
    .from("partner_invites")
    .insert({ email, inviter_id: user.id, passcode, expires_at: expiresAt.toISOString() });

  if (insertError) {
    return NextResponse.json({ error: "Failed to save partner." }, { status: 500 });
  }

  return NextResponse.json({ success: true, passcode });
}
