"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Check, X, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

interface PendingPost {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string | null; image: string | null };
  category: { id: string; name: string; slug: string } | null;
}

interface PendingPostsQueueProps {
  groupId: string;
}

export function PendingPostsQueue({ groupId }: PendingPostsQueueProps) {
  const [posts, setPosts] = useState<PendingPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectionNotes, setRejectionNotes] = useState<Record<string, string>>({});
  const [showRejectForm, setShowRejectForm] = useState<Record<string, boolean>>({});
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const fetchPending = async () => {
    try {
      const res = await fetch(`/api/posts/pending?groupId=${groupId}`);
      const data = await res.json();
      if (res.ok) setPosts(data.posts);
    } catch {
      toast.error("Failed to fetch pending posts");
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount
  useState(() => {
    fetchPending();
  });

  const handleAction = async (postId: string, action: "approve" | "reject") => {
    setActionLoading((prev) => ({ ...prev, [postId]: true }));
    try {
      const res = await fetch(`/api/posts/${postId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          rejectionNote: action === "reject" ? rejectionNotes[postId] : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || `Failed to ${action} post`);
        return;
      }

      toast.success(action === "approve" ? "Post approved!" : "Post rejected");
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch {
      toast.error(`Failed to ${action} post`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [postId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <ShieldAlert className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No posts pending review</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-5 w-5 text-amber-600" />
        <h2 className="font-semibold">
          Pending Posts ({posts.length})
        </h2>
      </div>

      {posts.map((post) => {
        const initials = post.author.name
          ?.split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase() || "?";

        return (
          <Card key={post.id} className="border-yellow-200 bg-yellow-50/30">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={post.author.image || undefined} />
                  <AvatarFallback className="bg-blue-100 text-blue-700 text-sm">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{post.author.name}</span>
                    {post.category && (
                      <Badge variant="secondary" className="text-xs">
                        {post.category.name}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                    </span>
                  </div>

                  <div className="mt-2 text-sm whitespace-pre-wrap">{post.content}</div>

                  {showRejectForm[post.id] && (
                    <div className="mt-3">
                      <Textarea
                        placeholder="Reason for rejection (optional)..."
                        value={rejectionNotes[post.id] || ""}
                        onChange={(e) =>
                          setRejectionNotes((prev) => ({
                            ...prev,
                            [post.id]: e.target.value,
                          }))
                        }
                        rows={2}
                        className="text-sm"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-3">
                    <Button
                      size="sm"
                      onClick={() => handleAction(post.id, "approve")}
                      disabled={actionLoading[post.id]}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {actionLoading[post.id] ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </>
                      )}
                    </Button>

                    {showRejectForm[post.id] ? (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleAction(post.id, "reject")}
                        disabled={actionLoading[post.id]}
                      >
                        {actionLoading[post.id] ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <X className="h-4 w-4 mr-1" />
                            Confirm Reject
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setShowRejectForm((prev) => ({
                            ...prev,
                            [post.id]: true,
                          }))
                        }
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
