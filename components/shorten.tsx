"use client";

import { Input } from "@base-ui/react";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import { ArrowRight, Link, Calendar, Copy, Check, X, ArrowUpRight } from "lucide-react";

interface ShortenProps {
  onLinkCreated: () => void;
}

export default function Shorten({ onLinkCreated }: ShortenProps) {
  
  const [activePopupUrl, setActivePopupUrl] = useState<string>("");
  const [isCopied, setIsCopied] = useState<boolean>(false);
 
const [dashboardUrl, setDashboardUrl] = useState<string>("");


 
   async function handleSubmit(formData: FormData) {
    const link = formData.get("link");
    const goLiveAt = formData.get("goLiveAt");
    const expiresAt = formData.get("expiresAt");
    

    setActivePopupUrl("");
    setDashboardUrl(""); 
    setIsCopied(false);

    try {
      const response = await fetch("/api/shortenLink", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ link, goLiveAt, expiresAt }),
      });
      
      if (!response.ok) {
        let errorMsg = "An unknown error occurred";
        try {
          const errData = await response.json();
          errorMsg = errData.error || errorMsg;
        } catch {
          errorMsg = `Server API returned an error: ${response.status}`;
        }
        console.error(errorMsg);
        alert(errorMsg); 
        return;
      }
      
      const data = await response.json();
      // console.log("Successfully Shortened:", data);

      // Check for shortCode
      if (data.shortCode && data.secretToken) {
        const fullShortUrl = `${window.location.origin}/${data.shortCode}`;
        const fullyProtectedDashboardUrl = `/dashboard/${data.shortCode}?token=${data.secretToken}`;
        setActivePopupUrl(fullShortUrl);             
        setDashboardUrl(fullyProtectedDashboardUrl);
        try {
          await navigator.clipboard.writeText(fullShortUrl);
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 3000);
        } catch (clipError) {
          console.warn("Browser blocked automatic clipboard injection:", clipError);
        }
        onLinkCreated();
      }

    } catch (error) {
      console.error("Error in shortening : ", error);
    }
  }



      
      {/*Pop up*/}
      return (
  <div className="w-full relative">
    
    {/* Top pop up*/}
    {activePopupUrl && (
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4 animate-in fade-in slide-in-from-top-4 duration-300">
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-2xl shadow-neutral-900/10 flex flex-col space-y-3">
          
          {/* Row 1: Header Text Info & Close Cross Action */}
          <div className="flex items-center justify-between pl-1">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              {isCopied ? "Link Copied to Clipboard!" : "Short URL Generated!! "}
            </span>
            <button
              type="button"
              onClick={() => setActivePopupUrl("")} // Safely clears and closes the whole window
              className="text-neutral-400 hover:text-neutral-600 p-1 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Row 2: Displaying the Clickable Link with its Copy Icon Button */}
          <div className="flex items-center justify-between gap-3 bg-neutral-50 border border-neutral-150 rounded-xl p-2 pl-3">
            <a 
              href={activePopupUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-neutral-800 hover:text-blue-600 hover:underline truncate max-w-[240px]"
            >
              {activePopupUrl}
            </a>
            <Button
              type="button"
              variant={isCopied ? "default" : "ghost"}
              size="icon"
              onClick={() => {
                navigator.clipboard.writeText(activePopupUrl);
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 3000);
              }}
              className={`h-9 w-9 rounded-xl transition-all duration-200 shrink-0 ${
                isCopied 
                  ? "bg-green-600 hover:bg-green-600 text-white" 
                  : "text-neutral-500 hover:bg-neutral-100"
              }`}
            >
              {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          {dashboardUrl && (
            <div className="pt-1 border-t border-neutral-100 flex justify-end">
              <a 
                href={dashboardUrl} 
                className="text-xs font-bold text-neutral-500 hover:text-blue-600 flex items-center gap-1 group transition-colors"
              >
                <span>View Private Live Performance Metrics</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-neutral-400 group-hover:text-blue-500 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </div>
          )}

        </div>
      </div>
    )} 



      


      {/* Input Form Layout */}
      <form action={handleSubmit} className="w-full">
        <div className="space-y-5 mt-10">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 pl-1 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                Go-Live Date (Optional)
              </label>
              <Input 
                name="goLiveAt" 
                type="datetime-local" 
                className="h-12 w-full px-4 text-sm bg-neutral-50/50 border-neutral-200/80 rounded-xl transition-all duration-200 text-neutral-700 cursor-pointer focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-black/5 focus-visible:border-black"
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
                className="h-12 w-full px-4 text-sm bg-neutral-50/50 border-neutral-200/80 rounded-xl transition-all duration-200 text-neutral-700 cursor-pointer focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-black/5 focus-visible:border-black"
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
    </div>
  );
}
