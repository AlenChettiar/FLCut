import prisma from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { customAlphabet } from "nanoid";

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
]);

function normalizeSlug(value: string) {
  return value.trim().replace(/^\/+/, "").toLowerCase();
}

export async function POST(request: NextRequest) {
  try {
    const { link, goLiveAt, expiresAt } = await request.json();
    

    if (!link) {
      return NextResponse.json(
        { error: "URL field is required" },
        { status: 400 },
      );
    }
    if (goLiveAt && expiresAt && new Date(goLiveAt) >= new Date(expiresAt)) {
      return NextResponse.json(
        { error: "Expiration date must be later than the Go-Live date" },
        { status: 400 },
      );
    }
    const databaseRecord = await prisma.shortLink.create({
      data: {
        originalUrl: link,
        shortCode: createSecureNanoId(),
        goLiveAt: goLiveAt ? new Date(goLiveAt) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    return NextResponse.json(
      { shortCode: databaseRecord.shortCode },
      { status: 201 },
    );
  } catch (error) {
    console.error("Database save failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function GET(
  _request: Request,
  { params }: { params: { code: string } },
) {
  const linkRecord = await prisma.shortLink.findUnique({
    where: { shortCode: params.code },
  });

  if (!linkRecord) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const now = new Date();

  if (linkRecord.goLiveAt && now < linkRecord.goLiveAt) {
    return NextResponse.json(
      { error: "Link is not active yet" },
      { status: 403 },
    );
  }

  if (linkRecord.expiresAt && now >= linkRecord.expiresAt) {
    return NextResponse.json({ error: "Link has expired" }, { status: 410 });
  }

  await prisma.shortLink.update({
    where: { id: linkRecord.id },
    data: { currentClicks: { increment: 1 } },
  });

  return NextResponse.redirect(linkRecord.originalUrl, 307);
}
