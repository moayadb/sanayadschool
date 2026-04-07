"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { GraduationCap, Bell, MessageSquare, LogOut, User, Settings } from "lucide-react";

export function Header() {
  const { data: session } = useSession();
  const router = useRouter();

  const initials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "?";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg hidden sm:inline">Sanayad Learn</span>
        </Link>

        <div className="flex items-center gap-2">
          {session?.user ? (
            <>
              <Link
                href="/messages"
                className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "relative")}
              >
                <MessageSquare className="h-5 w-5" />
              </Link>
              <Link
                href="/notifications"
                className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "relative")}
              >
                <Bell className="h-5 w-5" />
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger className="relative h-8 w-8 rounded-full outline-none">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session.user.image || undefined} alt={session.user.name || ""} />
                    <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <div className="flex items-center gap-2 p-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={session.user.image || undefined} />
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-sm">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <p className="text-sm font-medium">{session.user.name}</p>
                      <p className="text-xs text-muted-foreground">{session.user.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => router.push("/profile")}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => router.push("/settings")}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-red-600 focus:text-red-600"
                    onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/signin" className={buttonVariants({ variant: "ghost" })}>
                Sign in
              </Link>
              <Link href="/auth/signup" className={buttonVariants()}>
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
