import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { customAlphabet } from "nanoid";

const base62Alphabet =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const createSecureNanoId = customAlphabet(base62Alphabet, 7);

//absolute blocklist array 
const RESERVED_PATHS = new Set([
  "admin",
  "api",
  "dashboard",
  "login",
  "signup",
  "settings",
  "favicon.ico",
  "robots.txt"
]);

function normalizeSlug(value: string) {
 
  return value.trim().toLowerCase();
}

export async function POST(request: NextRequest) {
  try {
    const { link, goLiveAt, expiresAt, shortCode } = await request.json();
    let finalShortCode = createSecureNanoId();

    if (shortCode && typeof shortCode === "string") {
      const normalized = normalizeSlug(shortCode);

      if (!normalized) {
        return NextResponse.json({ error: "Alias cannot be empty" }, { status: 400 });
      }

      
      //drops on all slashes (/), dots (.), spaces, and backslashes.
      const isValidSlugPattern = /^[a-z0-9-_]+$/.test(normalized);
      if (!isValidSlugPattern) {
        return NextResponse.json(
          { error: "Alias can only contain letters, numbers, hyphens, and underscores" }, 
          { status: 400 }
        );
      }

      
      // Prevents grabbing sub-paths like "admin/settings" or "api-v2"
      const isReserved = Array.from(RESERVED_PATHS).some(
        (path) => normalized === path || normalized.startsWith(`${path}/`) || normalized.startsWith(`${path}-`)
      );
      if (isReserved) {
        return NextResponse.json({ error: "That alias is reserved" }, { status: 400 });
      }

      // Prevent overflow rendering breakage lengths
      if (normalized.length < 3 || normalized.length > 30) {
        return NextResponse.json({ error: "Alias must be between 3 and 30 characters" }, { status: 400 });
      }

      const existing = await prisma.shortLink.findUnique({
        where: { shortCode: normalized },
      });
      if (existing) {
        return NextResponse.json({ error: "Alias already taken" }, { status: 409 });
      }

      finalShortCode = normalized;
    }

    if (!link) {
      return NextResponse.json({ error: "URL field is required" }, { status: 400 });
    }

    // 4. ✨ FIXED DATE LAYER: Explicitly mapping empty input strings directly to true null states
    const liveDate = goLiveAt && goLiveAt.trim() !== "" ? new Date(goLiveAt) : null;
    const expiryDate = expiresAt && expiresAt.trim() !== "" ? new Date(expiresAt) : null;

    if (liveDate && expiryDate && liveDate >= expiryDate) {
      return NextResponse.json(
        { error: "Expiration date must be later than the Go-Live date" },
        { status: 400 }
      );
    }

    const databaseRecord = await prisma.shortLink.create({
      data: {
        originalUrl: link,
        shortCode: finalShortCode,
        goLiveAt: liveDate,    
        expiresAt: expiryDate,  
      },
    });

    return NextResponse.json(
      { shortCode: databaseRecord.shortCode },
      { status: 201 }
    );
  } catch (error) {
    console.error("Database save failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> } 
) {
  const { code } = await params; 

  const linkRecord = await prisma.shortLink.findUnique({
    where: { shortCode: code },
  });

  if (!linkRecord) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const now = new Date();

  if (linkRecord.goLiveAt && now < linkRecord.goLiveAt) {
    return NextResponse.json(
      { error: "Link is not active yet" },
      { status: 403 }
    );
  }

  if (linkRecord.expiresAt && now >= linkRecord.expiresAt) {
    return NextResponse.json({ error: "Link has expired" }, { status: 410 });
  }

  await prisma.shortLink.update({
    where: { id: linkRecord.id },
    data: { currentClicks: { increment: 1 } },
  });

  // Convert destination cleanly into a true absolute URL instance to prevent routing traps
  const redirectUrl = new URL(linkRecord.originalUrl);
  return NextResponse.redirect(redirectUrl, 307);
}
