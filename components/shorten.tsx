"use client";

import { Input } from "@base-ui/react";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import { ArrowRight, Link, Calendar, Copy, Check } from "lucide-react";

interface ShortenProps {
  onLinkCreated: () => void;
}
export default function Shorten({ onLinkCreated }: ShortenProps) {
  const [shortenedUrl, setShortenedUrl] = useState<string>("");
  const [isCopied, setIsCopied] = useState<boolean>(false);

  async function handleSubmit(formData: FormData) {
    const link = formData.get("link");
    const goLiveAt = formData.get("goLiveAt");
    const expiresAt = formData.get("expiresAt");
    const shortCode=formData.get("shortCode");
    setShortenedUrl("");
    setIsCopied(false);

    try {
      const response = await fetch("/api/shortenLink", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ link, goLiveAt, expiresAt ,shortCode}),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server API returned an error:", response.status, errorText);
        return;
      }
      
      const data = await response.json();
      console.log("Successfully Shortened:", data);
      onLinkCreated();

      if (data.shortCode) {
        const fullShortUrl = `${window.location.origin}/${data.shortCode}`;
        setShortenedUrl(fullShortUrl);
      }

    } catch (error) {
      console.error("Error in shortening : ", error);
    }
  }
  const handleCopyLink = async () => {
    if (!shortenedUrl) return;
    try {
      await navigator.clipboard.writeText(shortenedUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); 
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <div className="w-full space-y-6">
      <form action={handleSubmit} className="w-full">
        <div className="space-y-5 mt-10">
          
          {/* Main Input */}
          <div className="relative flex items-center">
            <Link className="absolute left-4 h-5 w-5 text-neutral-400 pointer-events-none" />
            <Input
              name="link"
              type="url"
              placeholder="Paste your long link here..."
              required
              className="h-14 w-full pl-12 pr-4 text-base bg-neutral-50/50 border-neutral-200/80 rounded-2xl transition-all duration-200 placeholder:text-neutral-400 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-black/5 focus-visible:border-black"
            />
          </div>
          {/* Custom Alias */}
          <Input
  name="shortCode"
  type="text"
  placeholder="Custom alias (optional)"
  className="h-14 w-full px-4 text-base bg-neutral-50/50 border-neutral-200/80 rounded-2xl"
/>

          {/* Live date input */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 pl-1 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                Go-Live Date (Optional)
              </label>
              <Input 
                name="goLiveAt" 
                type="datetime-local" 
                className="h-12 w-full px-4 text-sm bg-neutral-50/50 border-neutral-200/80 rounded-xl transition-all duration-200 text-neutral-700 cursor-pointer focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-black/5 focus-visible:border-black [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 [&::-webkit-calendar-picker-indicator]:transition-opacity"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 pl-1 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                Expiration Date (Optional)
              </label>
              <Input 
                name="expiresAt" 
                type="datetime-local" 
                className="h-12 w-full px-4 text-sm bg-neutral-50/50 border-neutral-200/80 rounded-xl transition-all duration-200 text-neutral-700 cursor-pointer focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-black/5 focus-visible:border-black [&::-webkit-calendar-picker-indicator]:opacity-60 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 [&::-webkit-calendar-picker-indicator]:transition-opacity"
              />
            </div>
          </div>
          
          <Button
            type="submit"
            className="group h-14 w-full bg-neutral-900 text-white font-semibold text-base rounded-2xl transition-all duration-300 hover:bg-black hover:shadow-lg hover:shadow-neutral-900/10 active:scale-[0.99] flex items-center justify-center gap-2"
          >
            <span>Shorten URL</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Button>
        </div>
      </form>
      {/* {shortenedUrl && (
        <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-600 pl-1">
            Your Shortened URL is Ready!!
          </p>
          <div className="flex items-center justify-between gap-3 bg-white border border-neutral-200/60 rounded-xl p-2 pl-3">
            <a 
              href={shortenedUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-sm font-medium text-neutral-800 hover:text-blue-600 hover:underline truncate"
            >
              {shortenedUrl}
            </a>
            <Button
              type="button"
              onClick={handleCopyLink}
              variant={isCopied ? "default" : "ghost"}
              size="icon"
              className={`h-9 w-9 rounded-lg shrink-0 transition-all duration-200 ${
                isCopied 
                  ? "bg-green-600 hover:bg-green-600 text-white" 
                  : "text-neutral-500 hover:bg-neutral-100"
              }`}
            >
              {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )} */}

    </div>
  );
}
