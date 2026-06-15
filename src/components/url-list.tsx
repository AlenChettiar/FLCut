"use client";

import { Button } from "@/components/ui/button";
import { CopyIcon, EyeIcon, Check, BarChart2 } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";

type ShortLink = {
  id: string;
  originalUrl: string;
  shortCode?: string;
  currentClicks?: number;
};

interface RecentURLsProps {
  refreshKey: number;
}

export default function RecentURLs({ refreshKey }: RecentURLsProps) {
  const [urls, setUrls] = useState<ShortLink[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const shortURL = (code: string) =>
    `${process.env.NEXT_PUBLIC_BASE_URL || window.location.origin}/${code}`;

  const handleUrlAction = async (code: string) => {
    const fullUrl = shortURL(code);
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 3000);
    } catch (error) {
      console.error("Copy failed", error);
    }
  };

  useEffect(() => {
    const fetchLink = async () => {
      try {
        const response = await fetch(`/api/urls?t=${Date.now()}`, { cache: 'no-store' });
        if (!response.ok) throw new Error(await response.text());
        const data: ShortLink[] = await response.json();
        setUrls(data);
      } catch (error) {
        console.error("Error fetching URLs", error);
      }
    };
    fetchLink();
  }, [refreshKey]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold tracking-tight text-neutral-900">
        Recent URLs
      </h2>
      
      <div className="max-h-72 md:max-h-96 overflow-y-auto">
        <ul className="space-y-3">
          {urls.map((url) => {
            if (!url.shortCode) return null;

            return (
              <li
                key={url.id}
                className="flex items-center justify-between w-full gap-4 p-3 bg-neutral-50/50 border border-neutral-100 rounded-xl"
              >
                <div className="flex-1 min-w-0">
                  <Link
                    href={shortURL(url.shortCode)}
                    className="text-sm font-medium text-neutral-700 hover:text-blue-600 hover:underline block truncate"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {shortURL(url.shortCode)}
                  </Link>
                </div>

                <div className="flex items-center gap-1 shrink-0 text-neutral-500">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-200/50"
                    onClick={() => url.shortCode && handleUrlAction(url.shortCode)}
                  >
                    {copiedCode === url.shortCode ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <CopyIcon className="w-4 h-4" />
                    )}
                  </Button>

                  <div className="flex items-center gap-1 px-2 py-1 text-xs font-medium">
                    <EyeIcon className="h-4 w-4 text-neutral-400" />
                    <span>{url.currentClicks ?? 0}</span>
                  </div>

                  <Link href={`/dashboard/${url.shortCode}`}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-neutral-400 hover:text-blue-600 hover:bg-blue-50"
                      title="View analytics"
                    >
                      <BarChart2 className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
