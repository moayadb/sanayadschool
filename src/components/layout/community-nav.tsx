"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
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
    <nav className="border-b bg-white sticky top-0 z-40">
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
                  "relative flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 ease-out whitespace-nowrap",
                  isActive
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50/80"
                )}
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                >
                  <Icon className="h-4 w-4" />
                </motion.div>
                <span>{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
