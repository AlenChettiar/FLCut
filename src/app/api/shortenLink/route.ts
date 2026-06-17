import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { customAlphabet } from "nanoid";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth"; 

const base62Alphabet =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const createSecureNanoId = customAlphabet(base62Alphabet, 7);

const RESERVED_PATHS = new Set([
  "admin",
  "api",
  "dashboard",
  "login",
  "signup",
  "settings",
  "favicon.ico",
  "robots.txt",
]);

function normalizeSlug(value: string) {
  return value.trim().toLowerCase();
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized: You must be logged in to create short links." },
        { status: 401 }
      );
    }

    const { link, goLiveAt, expiresAt, shortCode } = await request.json();

    if (!link) {
      return NextResponse.json(
        { error: "URL field is required" },
        { status: 400 },
      );
    }

    // Checking for Looping issues
    try {
      const appBaseUrl =
        process.env.NEXT_PUBLIC_BASE_URL || request.headers.get("host") || "";
      const sanitizedAppUrl = appBaseUrl.startsWith("http")
        ? appBaseUrl
        : `https://${appBaseUrl}`;
      const appHost = new URL(sanitizedAppUrl).hostname.toLowerCase();
      const targetHost = new URL(link).hostname.toLowerCase();

      if (
        appHost &&
        (targetHost === appHost || targetHost.endsWith("." + appHost))
      ) {
        return NextResponse.json(
          {
            error:
              "You cannot shorten links belonging to this shortener application website itself",
          },
          { status: 400 },
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Invalid target URL format provided" },
        { status: 400 },
      );
    }

    const liveDate =
      goLiveAt && goLiveAt.trim() !== "" ? new Date(goLiveAt) : null;
    const expiryDate =
      expiresAt && expiresAt.trim() !== "" ? new Date(expiresAt) : null;

    if (liveDate && expiryDate && liveDate >= expiryDate) {
      return NextResponse.json(
        { error: "Expiration date must be later than the Go-Live date" },
        { status: 400 },
      );
    }

    let finalShortCode: string;

    if (shortCode && typeof shortCode === "string") {
      const normalized = normalizeSlug(shortCode);

      if (!normalized) {
        return NextResponse.json(
          { error: "Alias cannot be empty" },
          { status: 400 },
        );
      }

      if (normalized.length < 3 || normalized.length > 30) {
        return NextResponse.json(
          { error: "Alias length must be strictly between 3 and 30 characters" },
          { status: 400 },
        );
      }

      if (!/^[a-z0-9-_]+$/.test(normalized)) {
        return NextResponse.json(
          {
            error:
              "Alias can only contain letters, numbers, hyphens, and underscores",
          },
          { status: 400 },
        );
      }

      if (RESERVED_PATHS.has(normalized)) {
        return NextResponse.json(
          { error: "That alias is reserved" },
          { status: 400 },
        );
      }

      // Check if custom alias is already used by someone else
      const existingAlias = await prisma.shortLink.findUnique({
        where: { shortCode: normalized },
      });
      if (existingAlias) {
        return NextResponse.json(
          { error: "Alias already taken" },
          { status: 409 },
        );
      }

      finalShortCode = normalized;
    } else {
      finalShortCode = createSecureNanoId();
    }

    const uniqueOwnerToken = customAlphabet(base62Alphabet, 24)();
    
    // To check whether the shortUrl exists or not
    const databaseRecord = await prisma.shortLink.create({ 
      data:
       { originalUrl: link, 
        shortCode: finalShortCode, 
        secretToken: uniqueOwnerToken, 
        goLiveAt: liveDate, 
        expiresAt: expiryDate, 
        userId: session.user.id 
      } });

    const isNew = databaseRecord.shortCode === finalShortCode;

    return NextResponse.json(
  {
    shortCode: databaseRecord.shortCode,
    secretToken: databaseRecord.secretToken,
    message: "Short link created",
  },
  { status: 201 },
);
  } catch (error) {
    console.error("Database save failed:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "Alias is already taken" },
          { status: 409 },
        );
      }
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
