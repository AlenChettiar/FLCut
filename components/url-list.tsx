import { Button } from "@/components/ui/button";
import { CopyIcon, EyeIcon } from "lucide-react";
import Link from "next/link"
import React from "react";

export default function RecentURLs() {
  return (
     <div className="space-y-4">
      <h2 className="text-xl font-bold tracking-tight text-neutral-900">
        Recent URLs
      </h2>
      
      <ul className="space-y-3">
        
        <li className="flex items-center justify-between w-full gap-4 p-3 bg-neutral-50/50 border border-neutral-100 rounded-xl">
          
          
        <div className="flex-1 min-w-0">
            <Link 
              href="https://www.github.com/AlenChettiar"
              className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline block truncate"
              target="_black"
            >
              https://www.github.com/AlenChettiar
            </Link>
          </div>
          
          
          <div className="flex items-center gap-1 shrink-0 text-neutral-500">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-200/50" 
            >
              <CopyIcon className="w-4 h-4" />
            </Button>
            
            <div className="flex items-center gap-1 px-2 py-1 text-xs font-medium">
              <EyeIcon className="h-4 w-4 text-neutral-400" />
              <span>12</span> 
            </div>
          </div>

        </li>
      </ul>
    </div>
  ); 
}
