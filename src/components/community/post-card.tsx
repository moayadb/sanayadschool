"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, MessageCircle, Pin, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface PostAuthor {
  id: string;
  name: string | null;
  image: string | null;
}

interface PostCategory {
  id: string;
  name: string;
  slug: string;
}

interface PostCardProps {
  post: {
    id: string;
    content: string;
    status: string;
    isPinned: boolean;
    rejectionNote?: string | null;
    createdAt: string;
    author: PostAuthor;
    category: PostCategory | null;
    _count: { comments: number; likes: number };
    poll?: unknown;
    attachments?: unknown;
  };
  currentUserId?: string;
  onLike?: (postId: string) => void;
  liked?: boolean;
  showStatus?: boolean;
}

export function PostCard({ post, currentUserId, onLike, liked = false, showStatus = false }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(liked);
  const [likeCount, setLikeCount] = useState(post._count.likes);

  const initials = post.author.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "?";

  const handleLike = async () => {
    if (!currentUserId) return;
    setIsLiked(!isLiked);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
    onLike?.(post.id);
  };

  return (
    <Card className={cn(
      "transition-shadow hover:shadow-md",
      post.isPinned && "border-blue-200 bg-blue-50/30",
      post.status === "PENDING" && "border-yellow-200 bg-yellow-50/30",
      post.status === "REJECTED" && "border-red-200 bg-red-50/30"
    )}>
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={post.author.image || undefined} />
            <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-medium">
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
              {post.isPinned && (
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                  <Pin className="h-3 w-3 mr-1" />
                  Pinned
                </Badge>
              )}
              {showStatus && post.status === "PENDING" && (
                <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-700">
                  <Clock className="h-3 w-3 mr-1" />
                  Awaiting Approval
                </Badge>
              )}
              {showStatus && post.status === "REJECTED" && (
                <Badge variant="secondary" className="text-xs bg-red-100 text-red-700">
                  Rejected
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </span>
            </div>

            <Link href={`/community/post/${post.id}`} className="block mt-2">
              <div
                className="text-sm prose prose-sm max-w-none line-clamp-6"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            </Link>

            {post.status === "REJECTED" && post.rejectionNote && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                <strong>Rejection note:</strong> {post.rejectionNote}
              </div>
            )}

            {post.status === "APPROVED" && (
              <div className="flex items-center gap-4 mt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "gap-1.5 text-muted-foreground",
                    isLiked && "text-red-500"
                  )}
                  onClick={handleLike}
                  disabled={!currentUserId}
                >
                  <Heart className={cn("h-4 w-4", isLiked && "fill-red-500")} />
                  {likeCount > 0 && <span className="text-xs">{likeCount}</span>}
                </Button>

                <Link href={`/community/post/${post.id}`}>
                  <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                    <MessageCircle className="h-4 w-4" />
                    {post._count.comments > 0 && (
                      <span className="text-xs">{post._count.comments}</span>
                    )}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
