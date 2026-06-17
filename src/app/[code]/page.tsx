import { headers } from "next/headers";
import prisma from "@/lib/db";
import { notFound, redirect } from "next/navigation";

interface CodePageProps {
  params: Promise<{ code: string }>;
}

export default async function CodePage({ params }: CodePageProps) {
  const { code } = await params;

  const linkRecord = await prisma.shortLink.findUnique({
    where: { shortCode: code },
    select: {
      id: true,
      originalUrl: true,
      goLiveAt: true,
      expiresAt: true,
      clickCap: true,
      currentClicks: true,
    },
  });

  if (!linkRecord) notFound();

  const now = new Date();

  if (linkRecord.goLiveAt && now < linkRecord.goLiveAt) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl items-center justify-center px-4">
        <div className="w-full rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-neutral-900">Link not active yet</h1>
          <p className="mt-2 text-sm text-neutral-600">
            This short link will be available at{" "}
            <span className="font-medium">{linkRecord.goLiveAt.toLocaleString()}</span>
          </p>
        </div>
      </main>
    );
  }

  if (linkRecord.expiresAt && now >= linkRecord.expiresAt) {
    return (
      <main className="mx-auto flex min-h-screen max-w-xl items-center justify-center px-4">
        <div className="w-full rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-neutral-900">Link expired</h1>
          <p className="mt-2 text-sm text-neutral-600">
            This short link expired at{" "}
            <span className="font-medium">{linkRecord.expiresAt.toLocaleString()}</span>
          </p>
        </div>
      </main>
    );
  }

  // Fire the tracking call before redirecting.
  // We forward the incoming request headers so the tracker can read
  // User-Agent, Referer, and Vercel geo headers directly.
  try {
    const incomingHeaders = await headers();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000/";

    await fetch(`${baseUrl}api/track/${code}`, {
      method: "POST",
      headers: {
        // Forward the headers the tracking route needs
        "user-agent":               incomingHeaders.get("user-agent")               ?? "",
        "referer":                  incomingHeaders.get("referer")                  ?? "",
        "x-forwarded-for":          incomingHeaders.get("x-forwarded-for")          ?? "",
        "x-vercel-ip-country":      incomingHeaders.get("x-vercel-ip-country")      ?? "",
        "x-vercel-ip-country-region": incomingHeaders.get("x-vercel-ip-country-region") ?? "",
      },
    });
  } catch (err) {
    // Tracking errors must never block the redirect
    console.error("Tracking call failed:", err);
  }

  redirect(linkRecord.originalUrl);
}