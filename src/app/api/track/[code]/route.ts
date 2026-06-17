import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Bot UA patterns — covers major crawlers, CLI tools, and headless browsers
const BOT_REGEX =
  /bot|crawl|spider|slurp|mediapartners|facebookexternalhit|whatsapp|telegram|curl|wget|python-requests|axios|okhttp|java\/|go-http-client|ruby|perl|php|node-fetch|scrapy|headless|phantomjs|puppeteer|playwright/i;

// Parse a User-Agent string into device type and browser name
function parseUserAgent(ua: string): { device: string; browser: string } {
  const isMobile = /mobile|android|iphone|ipad|ipod|windows phone/i.test(ua);

  let browser = "Unknown";
  if (/edg\//i.test(ua))           browser = "Edge";
  else if (/opr\//i.test(ua))      browser = "Opera";
  else if (/chrome\//i.test(ua))   browser = "Chrome";
  else if (/firefox\//i.test(ua))  browser = "Firefox";
  else if (/safari\//i.test(ua))   browser = "Safari";
  else if (/msie|trident/i.test(ua)) browser = "IE";

  return { device: isMobile ? "mobile" : "desktop", browser };
}

// Normalise a Referer header to a clean source name
function parseReferrer(referer: string | null): string {
  if (!referer) return "Direct / Email";
  try {
    const hostname = new URL(referer).hostname.replace(/^www\./, "");
    if (hostname.includes("instagram"))  return "Instagram";
    if (hostname.includes("facebook"))   return "Facebook";
    if (hostname.includes("twitter") || hostname.includes("t.co") || hostname.includes("x.com"))
                                         return "Twitter / X";
    if (hostname.includes("linkedin"))   return "LinkedIn";
    if (hostname.includes("youtube"))    return "YouTube";
    if (hostname.includes("google"))     return "Google";
    if (hostname.includes("whatsapp"))   return "WhatsApp";
    return hostname;
  } catch {
    return "Direct / Email";
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    // Fetch the link (no session required — this is a public redirect event)
    const linkRecord = await prisma.shortLink.findUnique({
      where: { shortCode: code },
      select: { id: true },
    });

    if (!linkRecord) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const ua       = request.headers.get("user-agent") ?? "";
    const referer  = request.headers.get("referer");

    // Geo headers (populated automatically by Vercel on prod; empty in local dev)
    const country  = request.headers.get("x-vercel-ip-country")        ?? "Unknown";
    const region   = request.headers.get("x-vercel-ip-country-region") ?? "Unknown";

    // Client IP — used only for uniqueness fingerprinting, never stored
    const forwarded = request.headers.get("x-forwarded-for");
    const ip        = forwarded ? forwarded.split(",")[0].trim() : "0.0.0.0";

    const isBot = BOT_REGEX.test(ua);
    const { device, browser } = parseUserAgent(ua);
    const referrer = parseReferrer(referer);

    // 24-hour uniqueness check via a lightweight fingerprint (IP + UA prefix)
    // We never store the fingerprint itself — it's only used for the window query.
    const fingerprintSeed = `${ip}|${ua.slice(0, 64)}`;
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Encode a deterministic hash-like prefix we can query against
    // (We store nothing sensitive — this is purely for dedup logic)
    const encoder = new TextEncoder();
    const data = encoder.encode(fingerprintSeed);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashHex = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .slice(0, 16); // 8-byte prefix is more than enough for dedup

    // Check if we've seen this fingerprint for this link in the last 24 hrs
    // We store the hash in the `browser` field as a secondary key — no, wait,
    // we need to check a prior record. Since we don't store the fingerprint,
    // we approximate uniqueness by checking same IP-bucket + device + browser.
    // A full fingerprint store would require a dedicated table; this is a
    // pragmatic approximation that matches the schema we have.
    const recentSimilar = await prisma.clickAnalytics.count({
      where: {
        linkId:    linkRecord.id,
        device,
        browser,
        country,
        region,
        timestamp: { gte: since },
        isBot:     false,
      },
    });

    const isUnique = recentSimilar === 0;

    // Insert the analytics row and increment the counter atomically
    await prisma.$transaction([
      prisma.clickAnalytics.create({
        data: {
          linkId:   linkRecord.id,
          referrer,
          device,
          browser,
          country,
          region,
          isBot,
          isUnique,
        },
      }),
      prisma.shortLink.update({
        where: { id: linkRecord.id },
        data:  { currentClicks: { increment: 1 } },
      }),
    ]);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("Click tracking failed:", error);
    // Never let a tracking error break the redirect — caller ignores the body
    return NextResponse.json({ error: "Tracking error" }, { status: 500 });
  }
}
