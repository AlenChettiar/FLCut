import prisma from "@/lib/db";

// Bot UA patterns — covers major crawlers, CLI tools, and headless browsers
const BOT_REGEX =
  /bot|crawl|spider|slurp|mediapartners|facebookexternalhit|whatsapp|telegram|curl|wget|python-requests|axios|okhttp|java\/|go-http-client|ruby|perl|php|node-fetch|scrapy|headless|phantomjs|puppeteer|playwright/i;

/** Parse a User-Agent string into device type and browser name. */
export function parseUserAgent(ua: string): { device: string; browser: string } {
  const isMobile = /mobile|android|iphone|ipad|ipod|windows phone/i.test(ua);

  let browser = "Unknown";
  if (/edg\//i.test(ua))              browser = "Edge";
  else if (/opr\//i.test(ua))         browser = "Opera";
  else if (/chrome\//i.test(ua))      browser = "Chrome";
  else if (/firefox\//i.test(ua))     browser = "Firefox";
  else if (/safari\//i.test(ua))      browser = "Safari";
  else if (/msie|trident/i.test(ua))  browser = "IE";

  return { device: isMobile ? "mobile" : "desktop", browser };
}

/** Normalise a Referer URL to a clean source name. */
export function parseReferrer(referer: string | null): string {
  if (!referer) return "Direct / Email";
  try {
    const hostname = new URL(referer).hostname.replace(/^www\./, "");
    if (hostname.includes("instagram"))                                            return "Instagram";
    if (hostname.includes("facebook"))                                             return "Facebook";
    if (hostname.includes("twitter") || hostname.includes("t.co") || hostname.includes("x.com"))
                                                                                   return "Twitter / X";
    if (hostname.includes("linkedin"))                                             return "LinkedIn";
    if (hostname.includes("youtube"))                                              return "YouTube";
    if (hostname.includes("google"))                                               return "Google";
    if (hostname.includes("whatsapp"))                                             return "WhatsApp";
    return hostname;
  } catch {
    return "Direct / Email";
  }
}

export interface TrackClickOptions {
  linkId:   string;
  ua:       string;
  referer:  string | null;
  ip:       string;
  country:  string;
  region:   string;
}

/**
 * Insert one ClickAnalytics row and increment currentClicks atomically.
 * Called directly from the server component — no HTTP round-trip required.
 */
export async function trackClick(opts: TrackClickOptions): Promise<void> {
  const { linkId, ua, referer, ip, country, region } = opts;

  const isBot = BOT_REGEX.test(ua);
  const { device, browser } = parseUserAgent(ua);
  const referrer = parseReferrer(referer);

  // 24-hour uniqueness window: look for a prior non-bot hit with the same
  // device + browser + geo combination (pragmatic approximation — avoids
  // storing fingerprints or PII in the database).
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const recentSimilar = await prisma.clickAnalytics.count({
    where: {
      linkId,
      device,
      browser,
      country,
      region,
      isBot:     false,
      timestamp: { gte: since },
    },
  });

  const isUnique = recentSimilar === 0;

  // Atomic insert + counter increment
  await prisma.$transaction([
    prisma.clickAnalytics.create({
      data: { linkId, referrer, device, browser, country, region, isBot, isUnique },
    }),
    prisma.shortLink.update({
      where: { id: linkId },
      data:  { currentClicks: { increment: 1 } },
    }),
  ]);
}
