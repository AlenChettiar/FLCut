"use client";

import React, { useEffect, useMemo, useState } from "react";
import { BarChart3, Globe, HelpCircle, Smartphone, Users } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type AnalyticsSummary = {
  totalClicks: number;
  uniqueClicks: number;
  botsBlocked: number;
};

type TimelinePoint = {
  time: string;
  clicks: number;
};

type ReferrerPoint = {
  name: string;
  clicks: number;
};

type DeviceSplit = {
  mobile: number;
  desktop: number;
};

type AnalyticsPayload = {
  originalUrl: string;
  shortCode: string;
  summary: AnalyticsSummary;
  timeline: TimelinePoint[];
  referrers: ReferrerPoint[];
  browsers: ReferrerPoint[];
  locations: ReferrerPoint[];
  devices: DeviceSplit;
};

type AnalyticsDashboardProps = {
  shortCode?: string;
};

const fallbackData: AnalyticsPayload = {
  originalUrl: "https://flcut.finiteloop.club/hackfest26",
  shortCode: "hackfest26",
  summary: { totalClicks: 315, uniqueClicks: 240, botsBlocked: 42 },
  timeline: [
    { time: "9 AM", clicks: 14 },
    { time: "11 AM", clicks: 28 },
    { time: "1 PM", clicks: 45 },
    { time: "3 PM", clicks: 145 },
    { time: "5 PM", clicks: 82 },
    { time: "7 PM", clicks: 35 },
  ],
  referrers: [
    { name: "Instagram", clicks: 180 }, 
    { name: "Twitter / X", clicks: 95 },
    { name: "Direct / Email", clicks: 40 },
  ],
  browsers: [
    { name: "Chrome", clicks: 190 },
    { name: "Safari", clicks: 85 },
    { name: "Firefox", clicks: 40 },
  ],
  locations: [
    { name: "Karnataka, IN", clicks: 160 },
    { name: "California, US", clicks: 100 },
    { name: "Unknown", clicks: 55 },
  ],
  devices: { mobile: 75, desktop: 25 },
};

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

//  using recharts
function MetricCard({
  label,
  value,
  accent,
  note,
  icon,
}: {
  label: string;
  value: string;
  accent?: string;
  note: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
      <div className="flex items-start justify-between gap-4 text-neutral-400">
        <p className="text-xs font-bold uppercase tracking-[0.18em]">{label}</p>
        {icon}
      </div>
      <div className="mt-6 space-y-1">
        <div
          className={`text-4xl font-black tracking-tight ${accent ?? "text-neutral-950"}`}
        >
          {value}
        </div>
        <p className="text-xs font-medium text-neutral-400">{note}</p>
      </div>
    </div>
  );
}

function BarRow({
  name,
  value,
  maxValue,
}: {
  name: string;
  value: number;
  maxValue: number;
}) {
  const width = maxValue === 0 ? 0 : Math.max((value / maxValue) * 100, 6);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="font-medium text-neutral-700">{name}</span>
        <span className="font-semibold text-neutral-900">{value}</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-100">
        <div
          className="h-full rounded-full bg-neutral-900 transition-all duration-500"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

export default function AnalyticsDashboard({
  shortCode,
}: AnalyticsDashboardProps) {
  const token = process.env.NEXT_PUBLIC_ANALYTICS_TOKEN ?? "";
  const [analytics, setAnalytics] = useState<AnalyticsPayload>(fallbackData);
  const [loading, setLoading] = useState<boolean>(Boolean(shortCode));
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const endpoint = useMemo(() => {
    if (!shortCode) return "";
    return `/api/analytics/${shortCode}?token=${token}`;
  }, [shortCode, token]);

  useEffect(() => {
    const analyticsEndpoint = endpoint;

    if (!analyticsEndpoint) {
      setAnalytics(fallbackData);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function loadAnalytics() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(analyticsEndpoint, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }

        const data: AnalyticsPayload = await response.json();
        setAnalytics(data);
      } catch (fetchError) {
        if (controller.signal.aborted) return;
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Failed to load analytics",
        );
        setAnalytics(fallbackData);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadAnalytics();

    return () => controller.abort();
  }, [endpoint]);

   const referrerMax = Math.max(
    ...(analytics.referrers || []).map((referrer) => referrer.clicks),
    1,
  );
  const browserMax = Math.max(
    ...(analytics.browsers || []).map((browser) => browser.clicks),
    1,
  );
  const locationMax = Math.max(
    ...(analytics.locations || []).map((loc) => loc.clicks),
    1,
  );


  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 md:px-8 md:py-12">
        <header className="flex flex-col gap-4 border-b border-neutral-200/70 pb-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight md:text-4xl">
              Link Analytics
            </h1>
            <p className="max-w-2xl text-sm text-neutral-500 md:text-base">
              Spacious, premium analytics for Short Lyncs with totals, unique
              visitors, bot filtering, and traffic breakdowns.
            </p>
          </div>

          <div className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500 shadow-sm">
            {shortCode ? `Short Code: ${shortCode}` : "Overview"}
          </div>
        </header>

        {error ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {error}
          </div>
        ) : null}

        <section className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
          <MetricCard
            label="Total Clicks"
            value={loading ? "—" : `${analytics.summary.totalClicks}`}
            note="All tracked interactions across the selected link"
            icon={<BarChart3 className="h-4 w-4" />}
          />
          <MetricCard
            label="Unique Visitors"
            value={loading ? "—" : `${analytics.summary.uniqueClicks}`}
            accent="text-blue-600"
            note="Visitor sessions filtered to exclude repeats"
            icon={<Users className="h-4 w-4 text-blue-500" />}
          />
          <MetricCard
            label="Bots Blocked"
            value={loading ? "—" : `${analytics.summary.botsBlocked}`}
            accent="text-neutral-600"
            note="Scrapers and automated traffic excluded from the UI"
            icon={<Globe className="h-4 w-4" />}
          />
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold tracking-tight md:text-xl">
                Hourly Traffic Flow
              </h2>
              <p className="text-sm text-neutral-500">
                A smooth spike view for hourly engagement trends.
              </p>
            </div>
            <HelpCircle className="h-4 w-4 shrink-0 text-neutral-300" />
          </div>

          <div className="mt-6 w-full h-[320px] min-h-[320px] rounded-2xl bg-white">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={analytics.timeline}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis
                    dataKey="time"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9ca3af", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
                      fontWeight: 500,
                    }}
                    cursor={{ stroke: "#d1d5db", strokeWidth: 1, strokeDasharray: "4 4" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="clicks"
                    stroke="#2563eb"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorClicks)"
                    activeDot={{ r: 6, strokeWidth: 0, fill: "#2563eb" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Referrers */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
            <div className="space-y-1">
              <h3 className="text-lg font-bold tracking-tight">
                Top Referrers
              </h3>
              <p className="text-sm text-neutral-500">
                Where traffic is actually coming from.
              </p>
            </div>

            <div className="mt-6 space-y-4">
              {(analytics.referrers || []).map((referrer) => (
                <BarRow
                  key={referrer.name}
                  name={referrer.name}
                  value={referrer.clicks}
                  maxValue={referrerMax}
                />
              ))}
            </div>
          </div>

          {/* Devices */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
            <div className="space-y-1">
              <h3 className="text-lg font-bold tracking-tight">
                Device Profile
              </h3>
              <p className="text-sm text-neutral-500">
                A clean split of mobile and desktop behavior.
              </p>
            </div>

            <div className="mt-6 space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm font-medium text-neutral-700">
                  <span>Mobile</span>
                  <span className="font-semibold text-neutral-950">
                    {formatPercent(analytics.devices.mobile)}
                  </span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className="h-full rounded-full bg-neutral-900"
                    style={{ width: `${analytics.devices.mobile}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm font-medium text-neutral-700">
                  <span>Desktop</span>
                  <span className="font-semibold text-neutral-950">
                    {formatPercent(analytics.devices.desktop)}
                  </span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className="h-full rounded-full bg-blue-400"
                    style={{ width: `${analytics.devices.desktop}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Browsers */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
            <div className="space-y-1">
              <h3 className="text-lg font-bold tracking-tight">
                Browser Profile
              </h3>
              <p className="text-sm text-neutral-500">
                Top browsers used by your visitors.
              </p>
            </div>

            <div className="mt-6 space-y-4">
              {(analytics.browsers|| []).map((browser) => (
                <BarRow
                  key={browser.name}
                  name={browser.name}
                  value={browser.clicks}
                  maxValue={browserMax}
                />
              ))}
            </div>
          </div>

          {/* Locations */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
            <div className="space-y-1">
              <h3 className="text-lg font-bold tracking-tight">
                Top Locations
              </h3>
              <p className="text-sm text-neutral-500">
                Geographic breakdown by region and country.
              </p>
            </div>

            <div className="mt-6 space-y-4">
              {(analytics.locations || []).map((loc) => (
                <BarRow
                  key={loc.name}
                  name={loc.name}
                  value={loc.clicks}
                  maxValue={locationMax}
                />
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
