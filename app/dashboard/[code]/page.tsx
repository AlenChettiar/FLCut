import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function PerLinkDashboardPage({ params }: PageProps) {
  const { code } = await params;

  if (!code) {
    notFound();
  }

  // Passes the dynamic shortcode directly into your dashboard layout
  return <AnalyticsDashboard shortCode={code} />;
}
