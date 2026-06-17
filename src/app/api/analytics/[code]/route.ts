import prisma from "@/lib/db";
import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// 2-hour bucket label lookup (index = floor(hour / 2))
const HOUR_BUCKET_LABELS: Record<number, string> = {
  0: "12 AM", 1: "2 AM",  2: "4 AM",  3: "6 AM",
  4: "8 AM",  5: "10 AM", 6: "12 PM", 7: "2 PM",
  8: "4 PM",  9: "6 PM", 10: "8 PM", 11: "10 PM",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    // 1. Require an authenticated session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code } = await params;

    // Fetch only the link metadata — no analytics rows pulled into memory
    const linkRecord = await prisma.shortLink.findUnique({
      where: { shortCode: code },
      select: {
        id: true,
        userId: true,
        originalUrl: true,
        shortCode: true,
      },
    });

    if (!linkRecord) {
      return NextResponse.json({ error: "Short link not found" }, { status: 404 });
    }

    // 2. Enforce ownership — only the link's owner may view its analytics
    if (linkRecord.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const linkId = linkRecord.id;

    // 3. All aggregations run in parallel — zero rows are loaded into Node memory.
    //    Each query asks the database to count and group, returning only the summary.
    const [
      totalClicks,
      uniqueClicks,
      botsBlocked,
      hourlyBuckets,
      referrerGroups,
      browserGroups,
      deviceGroups,
      locationGroups,
    ] = await Promise.all([

      // Total non-bot clicks
      prisma.clickAnalytics.count({
        where: { linkId, isBot: false },
      }),

      // Unique non-bot clicks
      prisma.clickAnalytics.count({
        where: { linkId, isBot: false, isUnique: true },
      }),

      // Bot hits
      prisma.clickAnalytics.count({
        where: { linkId, isBot: true },
      }),

      // Hourly timeline: group by hour-of-day (0-23), non-bot only
      prisma.clickAnalytics.groupBy({
        by: ["timestamp"],
        where: { linkId, isBot: false },
        _count: { id: true },
      }),

      // Top referrers
      prisma.clickAnalytics.groupBy({
        by: ["referrer"],
        where: { linkId, isBot: false },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 3,
      }),

      // Top browsers
      prisma.clickAnalytics.groupBy({
        by: ["browser"],
        where: { linkId, isBot: false },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 4,
      }),

      // Device split (mobile / desktop)
      prisma.clickAnalytics.groupBy({
        by: ["device"],
        where: { linkId, isBot: false },
        _count: { id: true },
      }),

      // Top locations: country + region combined.
      // groupBy on two columns and let JS merge them — only distinct
      // (country, region) pairs are returned, not individual rows.
      prisma.clickAnalytics.groupBy({
        by: ["country", "region"],
        where: { linkId, isBot: false },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 4,
      }),
    ]);

    // ── Timeline: fold individual timestamps into 2-hour buckets ──────────────
    // hourlyBuckets contains one entry per distinct timestamp value, not per raw row.
    // We group them by their 2-hour slot in JS — the dataset is at most 12 buckets wide.
    const hourlyMap: Record<string, number> = Object.fromEntries(
      Object.values(HOUR_BUCKET_LABELS).map((label) => [label, 0]),
    );

    for (const row of hourlyBuckets) {
      const hour = new Date(row.timestamp).getHours();
      const bucketIndex = Math.floor(hour / 2);
      const label = HOUR_BUCKET_LABELS[bucketIndex];
      hourlyMap[label] = (hourlyMap[label] ?? 0) + row._count.id;
    }

    const timeline = Object.entries(hourlyMap).map(([time, clicks]) => ({ time, clicks }));

    // ── Referrers ─────────────────────────────────────────────────────────────
    const referrers = referrerGroups.map((r) => ({
      name: r.referrer || "Direct / Email",
      clicks: r._count.id,
    }));

    // ── Browsers ──────────────────────────────────────────────────────────────
    const browsers = browserGroups.map((b) => ({
      name: b.browser || "Unknown",
      clicks: b._count.id,
    }));

    // ── Device split ──────────────────────────────────────────────────────────
    const totalNonBots = totalClicks || 1;
    const mobileCount = deviceGroups
      .filter((d) => d.device.toLowerCase() === "mobile")
      .reduce((sum, d) => sum + d._count.id, 0);
    const mobilePercentage = Math.round((mobileCount / totalNonBots) * 100);

    // ── Locations ─────────────────────────────────────────────────────────────
    const locations = locationGroups.map((l) => {
      const hasCountry = l.country && l.country !== "Unknown";
      const hasRegion  = l.region  && l.region  !== "Unknown";
      const name =
        hasCountry && hasRegion ? `${l.region}, ${l.country}` :
        hasCountry              ? l.country :
                                  "Unknown";
      return { name, clicks: l._count.id };
    });

    return NextResponse.json({
      originalUrl: linkRecord.originalUrl,
      shortCode:   linkRecord.shortCode,
      summary: { totalClicks, uniqueClicks, botsBlocked },
      timeline,
      referrers,
      browsers,
      locations,
      devices: { mobile: mobilePercentage, desktop: 100 - mobilePercentage },
    });

  } catch (error) {
    console.error("Failed to gather link analytics:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}