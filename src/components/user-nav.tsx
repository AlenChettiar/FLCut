"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { LogOut, LayoutDashboard } from "lucide-react";

interface UserNavProps {
  name: string;
  email: string;
}

export default function UserNav({ name, email }: UserNavProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="w-full border-b border-neutral-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto max-w-xl px-4 py-3 flex items-center justify-between">
        {/* Brand */}
        <span className="text-lg font-black tracking-tight text-black">
          FLCut<span className="text-blue-600">.</span>
        </span>

        {/* User actions */}
        <div className="flex items-center gap-3">
          
         
          {/* Avatar + name */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold select-none">
              {initials}
            </div>
            <span className="hidden sm:block text-sm font-medium text-neutral-700 max-w-[120px] truncate">
              {name}
            </span>
          </div>

          {/* Logout */}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-red-600 transition-colors"
            title="Sign out"
          >
            <LogOut size={15} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
