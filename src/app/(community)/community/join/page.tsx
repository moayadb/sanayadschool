"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function JoinCommunityPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [answers, setAnswers] = useState<string[]>(["", ""]);
  const [loading, setLoading] = useState(false);

  if (!session?.user) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center space-y-4">
        <div className="h-16 w-16 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto">
          <GraduationCap className="h-9 w-9 text-white" />
        </div>
        <h1 className="text-2xl font-bold">Join Sanayad Learn</h1>
        <p className="text-muted-foreground">Sign in to join the community</p>
        <div className="flex gap-2 justify-center">
          <Link href="/auth/signin">
            <Button>Sign in</Button>
          </Link>
          <Link href="/auth/signup">
            <Button variant="outline">Sign up</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/groups/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to join");
        return;
      }

      if (data.status === "PENDING") {
        toast.info("Your request has been submitted! An admin will review it shortly.");
      } else {
        toast.success("Welcome to the community!");
        router.push("/community");
        router.refresh();
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <Card>
        <CardHeader className="text-center">
          <div className="h-16 w-16 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-3">
            <GraduationCap className="h-9 w-9 text-white" />
          </div>
          <CardTitle className="text-xl">Join Sanayad Learn</CardTitle>
          <CardDescription>
            Answer a few questions to request access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleJoin} className="space-y-4">
            <div className="space-y-2">
              <Label>What is your primary learning goal?</Label>
              <Input
                value={answers[0]}
                onChange={(e) =>
                  setAnswers((prev) => [e.target.value, prev[1]])
                }
                placeholder="Your answer..."
                required
              />
            </div>
            <div className="space-y-2">
              <Label>How did you hear about us?</Label>
              <Input
                value={answers[1]}
                onChange={(e) =>
                  setAnswers((prev) => [prev[0], e.target.value])
                }
                placeholder="Your answer..."
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Request to Join
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
