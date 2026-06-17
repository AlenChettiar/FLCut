import { headers } from "next/headers";
import prisma from "@/lib/db";
import { trackClick } from "@/lib/track";
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

  // Call the tracking function directly — no HTTP fetch, works in all environments.
  try {
    const incomingHeaders = await headers();

    await trackClick({
      linkId:  linkRecord.id,
      ua:      incomingHeaders.get("user-agent")               ?? "",
      referer: incomingHeaders.get("referer"),
      ip:      incomingHeaders.get("x-forwarded-for")?.split(",")[0].trim() ?? "0.0.0.0",
      country: incomingHeaders.get("x-vercel-ip-country")        ?? "Unknown",
      region:  incomingHeaders.get("x-vercel-ip-country-region") ?? "Unknown",
    });
  } catch (err) {
    // Tracking errors must never block the redirect
    console.error("Click tracking failed:", err);
  }

  redirect(linkRecord.originalUrl);
}