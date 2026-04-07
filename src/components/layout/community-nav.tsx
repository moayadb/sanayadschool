"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  MessageSquareText,
  BookOpen,
  Calendar,
  Trophy,
  Users,
  Info,
} from "lucide-react";

const tabs = [
  { label: "Community", href: "/community", icon: MessageSquareText },
  { label: "Classroom", href: "/classroom", icon: BookOpen },
  { label: "Calendar", href: "/calendar", icon: Calendar },
  { label: "Leaderboards", href: "/community/leaderboards", icon: Trophy },
  { label: "Members", href: "/community/members", icon: Users },
  { label: "About", href: "/about", icon: Info },
];

export function CommunityNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const isActive =
              pathname === tab.href || pathname.startsWith(tab.href + "/");
            const Icon = tab.icon;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                  isActive
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
