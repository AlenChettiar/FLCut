import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";


export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const expectedToken = process.env.ANALYTICS_TOKEN;
    const token = request.nextUrl.searchParams.get("token");

    if (expectedToken && token !== expectedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const linkRecord = await prisma.shortLink.findUnique({
      where: { shortCode: code },
      include: {
        analytics: true,
      },
    });

    if (!linkRecord) {
      return NextResponse.json({ error: "Short link not found" }, { status: 404 });
    }

    const logs: any[] = linkRecord.analytics;

    const totalClicks = logs.length;
    const uniqueClicks = logs.filter((log) => log.isUnique && !log.isBot).length;
    const botsBlocked = logs.filter((log) => log.isBot).length;

    const hourlyMap: Record<string, number> = {
      "12 AM": 0,
      "2 AM": 0,
      "4 AM": 0,
      "6 AM": 0,
      "8 AM": 0,
      "10 AM": 0,
      "12 PM": 0,
      "2 PM": 0,
      "4 PM": 0,
      "6 PM": 0,
      "8 PM": 0,
      "10 PM": 0,
    };

    logs.forEach((log) => {
      if (log.isBot) return;

      const hour = new Date(log.timestamp).getHours();
      const bucket = Math.floor(hour / 2) * 2; // round down to nearest even hour
      const label =
        bucket === 0  ? "12 AM" :
        bucket === 2  ? "2 AM"  :
        bucket === 4  ? "4 AM"  :
        bucket === 6  ? "6 AM"  :
        bucket === 8  ? "8 AM"  :
        bucket === 10 ? "10 AM" :
        bucket === 12 ? "12 PM" :
        bucket === 14 ? "2 PM"  :
        bucket === 16 ? "4 PM"  :
        bucket === 18 ? "6 PM"  :
        bucket === 20 ? "8 PM"  : "10 PM";
      hourlyMap[label]++;
    });

    const graphTimelineData = Object.entries(hourlyMap).map(([time, clicks]) => ({ time, clicks }));

    const referrerMap: Record<string, number> = {};
    logs.forEach((log) => {
      if (log.isBot) return;
      const referrer = log.referrer || "Direct / Email";
      referrerMap[referrer] = (referrerMap[referrer] || 0) + 1;
    });

    const referrerData = Object.entries(referrerMap)
      .map(([name, clicks]) => ({ name, clicks }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 3);

    const browserMap: Record<string, number> = {};
    const locationMap: Record<string, number> = {};

    logs.forEach((log) => {
      if (log.isBot) return;
      
      const browser = log.browser || "Unknown";
      browserMap[browser] = (browserMap[browser] || 0) + 1;

      const location =
        log.country && log.region && log.country !== "Unknown" && log.region !== "Unknown"
          ? `${log.region}, ${log.country}`
          : log.country && log.country !== "Unknown"
            ? log.country
            : "Unknown";
      locationMap[location] = (locationMap[location] || 0) + 1;
    });

    const browserData = Object.entries(browserMap)
      .map(([name, clicks]) => ({ name, clicks }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 4);

    const locationData = Object.entries(locationMap)
      .map(([name, clicks]) => ({ name, clicks }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 4);

    const nonBotLogs = logs.filter((log) => !log.isBot);
    const mobileCount = nonBotLogs.filter((log) => log.device.toLowerCase() === "mobile").length;
    const totalNonBots = nonBotLogs.length || 1;
    const mobilePercentage = Math.round((mobileCount / totalNonBots) * 100);
    const desktopPercentage = 100 - mobilePercentage;

    return NextResponse.json({
      originalUrl: linkRecord.originalUrl,
      shortCode: linkRecord.shortCode,
      summary: { totalClicks, uniqueClicks, botsBlocked },
      timeline: graphTimelineData,
      referrers: referrerData,
      browsers: browserData,
      locations: locationData,
      devices: { mobile: mobilePercentage, desktop: desktopPercentage },
    });
  } catch (error) {
    console.error("Failed to gather link analytics:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}