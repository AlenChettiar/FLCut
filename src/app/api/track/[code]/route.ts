import { trackClick } from "@/lib/track";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * POST /api/track/[code]
 * Thin wrapper around the shared trackClick() util.
 * Useful for any external caller that wants to record a click via HTTP.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    const linkRecord = await prisma.shortLink.findUnique({
      where: { shortCode: code },
      select: { id: true },
    });

    if (!linkRecord) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await trackClick({
      linkId:  linkRecord.id,
      ua:      request.headers.get("user-agent")               ?? "",
      secChUa: request.headers.get("sec-ch-ua"),
      referer: request.headers.get("referer"),
      ip:      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "0.0.0.0",
      country: request.headers.get("x-vercel-ip-country")        ?? "Unknown",
      region:  request.headers.get("x-vercel-ip-country-region") ?? "Unknown",
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Track route error:", error);
    return NextResponse.json({ error: "Tracking error" }, { status: 500 });
  }
}
