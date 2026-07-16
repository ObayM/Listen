import { NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { accounts, attempts } from "@/lib/db/schema";
import { hashPassphrase, verifyPassphrase } from "@/lib/passphrase";

export async function POST(req: Request) {
  const { username, passphrase, deviceId } = await req.json();
  const name = typeof username === "string" ? username.trim().toLowerCase() : "";
  if (name.length < 3 || typeof passphrase !== "string" || passphrase.length < 4) {
    return NextResponse.json(
      { error: "name needs 3+ chars, passphrase needs 4+ chars" },
      { status: 400 },
    );
  }

  const existing = await db.select().from(accounts).where(eq(accounts.username, name)).limit(1);

  if (existing.length === 0) {
    const [created] = await db
      .insert(accounts)
      .values({ username: name, passphraseHash: hashPassphrase(passphrase) })
      .returning();
    const mergedAttempts = await mergeAnonymousHistory(deviceId, created.id);
    return NextResponse.json({ id: created.id, username: created.username, mergedAttempts });
  }

  const account = existing[0];
  if (!verifyPassphrase(passphrase, account.passphraseHash)) {
    return NextResponse.json({ error: "wrong passphrase for that name" }, { status: 401 });
  }
  const mergedAttempts = await mergeAnonymousHistory(deviceId, account.id);
  return NextResponse.json({ id: account.id, username: account.username, mergedAttempts });
}

async function mergeAnonymousHistory(deviceId: unknown, accountId: string) {
  if (typeof deviceId !== "string" || !deviceId || deviceId === accountId) return 0;

  const moved = await db
    .update(attempts)
    .set({ deviceId: accountId })
    .where(and(eq(attempts.deviceId, deviceId), ne(attempts.deviceId, accountId)))
    .returning({ id: attempts.id });

  return moved.length;
}
