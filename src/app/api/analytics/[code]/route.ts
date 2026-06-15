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

    const logs = linkRecord.analytics;

    const totalClicks = logs.length;
    const uniqueClicks = logs.filter((log) => log.isUnique && !log.isBot).length;
    const botsBlocked = logs.filter((log) => log.isBot).length;

    const hourlyMap: Record<string, number> = {
      "9 AM": 0,
      "11 AM": 0,
      "1 PM": 0,
      "3 PM": 0,
      "5 PM": 0,
      "7 PM": 0,
    };

    logs.forEach((log) => {
      if (log.isBot) return;

      const hour = new Date(log.timestamp).getHours();

      if (hour >= 8 && hour < 10) hourlyMap["9 AM"]++;
      else if (hour >= 10 && hour < 12) hourlyMap["11 AM"]++;
      else if (hour >= 12 && hour < 14) hourlyMap["1 PM"]++;
      else if (hour >= 14 && hour < 16) hourlyMap["3 PM"]++;
      else if (hour >= 16 && hour < 18) hourlyMap["5 PM"]++;
      else hourlyMap["7 PM"]++;
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