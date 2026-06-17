import { auth } from "@/auth";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import { notFound, redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function PerLinkDashboardPage({ params }: PageProps) {
  // Require authentication before rendering the page at all
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { code } = await params;

  if (!code) {
    notFound();
  }

  // Passes the dynamic shortcode directly into your dashboard layout.
  // The API it calls enforces ownership, so a 403 will surface in the UI
  // if this user doesn't own the requested shortcode.
  return <AnalyticsDashboard shortCode={code} />;
}
