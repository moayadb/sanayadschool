"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, MessageCircle, ArrowLeft, Pin, Send, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Author {
  id: string;
  name: string | null;
  image: string | null;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: Author;
  _count: { likes: number };
  replies?: Comment[];
}

interface Post {
  id: string;
  content: string;
  status: string;
  isPinned: boolean;
  createdAt: string;
  author: Author;
  category: { id: string; name: string; slug: string } | null;
  comments: Comment[];
  _count: { comments: number; likes: number };
}

export default function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>();
  const { data: session } = useSession();
  const router = useRouter();

  const [post, setPost] = useState<Post | null>(null);
  const [userLiked, setUserLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/posts/${postId}`);
        if (!res.ok) {
          router.push("/community");
          return;
        }
        const data = await res.json();
        setPost(data.post);
        setUserLiked(data.userLiked);
        setLikeCount(data.post._count.likes);
      } catch {
        router.push("/community");
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [postId, router]);

  const handleLike = async () => {
    if (!session?.user) return;
    setUserLiked(!userLiked);
    setLikeCount((prev) => (userLiked ? prev - 1 : prev + 1));
    try {
      await fetch(`/api/posts/${postId}/like`, { method: "POST" });
    } catch {
      setUserLiked(userLiked);
      setLikeCount((prev) => (userLiked ? prev + 1 : prev - 1));
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: comment.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setPost((prev) =>
          prev ? { ...prev, comments: [...prev.comments, { ...data.comment, replies: [] }] } : prev
        );
        setComment("");
        toast.success("Comment posted");
      }
    } catch {
      toast.error("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (parentId: string) => {
    if (!replyContent.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyContent.trim(), parentId }),
      });
      if (res.ok) {
        const data = await res.json();
        setPost((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            comments: prev.comments.map((c) =>
              c.id === parentId
                ? { ...c, replies: [...(c.replies || []), data.comment] }
                : c
            ),
          };
        });
        setReplyContent("");
        setReplyTo(null);
        toast.success("Reply posted");
      }
    } catch {
      toast.error("Failed to post reply");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this post?")) return;
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Post deleted");
        router.push("/community");
      }
    } catch {
      toast.error("Failed to delete post");
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-32" />
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <div className="flex gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) return null;

  const authorInitials = post.author.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "?";

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Button variant="ghost" size="sm" onClick={() => router.push("/community")}>
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to feed
      </Button>

      {/* Post */}
      <Card className={cn(post.isPinned && "border-blue-200 bg-blue-50/30")}>
        <CardContent className="p-6">
          <div className="flex gap-3">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarImage src={post.author.image || undefined} />
              <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-medium">
                {authorInitials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold">{post.author.name}</span>
                {post.category && (
                  <Badge variant="secondary" className="text-xs">{post.category.name}</Badge>
                )}
                {post.isPinned && (
                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                    <Pin className="h-3 w-3 mr-1" /> Pinned
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                </span>
              </div>

              <div className="mt-3 text-sm whitespace-pre-wrap">{post.content}</div>

              <div className="flex items-center gap-4 mt-4 pt-3 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn("gap-1.5", userLiked && "text-red-500")}
                  onClick={handleLike}
                  disabled={!session?.user}
                >
                  <Heart className={cn("h-4 w-4", userLiked && "fill-red-500")} />
                  {likeCount > 0 && likeCount}
                </Button>

                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  {post._count.comments} comments
                </span>

                {session?.user?.id === post.author.id && (
                  <Button variant="ghost" size="sm" className="ml-auto text-red-500" onClick={handleDelete}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comment Form */}
      {session?.user && (
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleComment} className="flex gap-2">
              <Textarea
                placeholder="Write a comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                className="resize-none flex-1"
              />
              <Button type="submit" size="icon" disabled={submitting || !comment.trim()}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Comments */}
      <div className="space-y-3">
        {post.comments.map((c) => {
          const cInitials = c.author.name?.split(" ").map((n) => n[0]).join("").toUpperCase() || "?";
          return (
            <Card key={c.id}>
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={c.author.image || undefined} />
                    <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">{cInitials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{c.author.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{c.content}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground mt-1 h-6 px-1"
                      onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}
                    >
                      Reply
                    </Button>

                    {replyTo === c.id && (
                      <div className="flex gap-2 mt-2">
                        <Textarea
                          placeholder="Write a reply..."
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          rows={1}
                          className="resize-none flex-1 text-sm"
                        />
                        <Button size="icon" className="h-8 w-8" onClick={() => handleReply(c.id)} disabled={submitting}>
                          {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                        </Button>
                      </div>
                    )}

                    {/* Replies */}
                    {c.replies && c.replies.length > 0 && (
                      <div className="mt-3 pl-4 border-l-2 border-gray-100 space-y-3">
                        {c.replies.map((r) => {
                          const rInitials = r.author.name?.split(" ").map((n) => n[0]).join("").toUpperCase() || "?";
                          return (
                            <div key={r.id} className="flex gap-2">
                              <Avatar className="h-6 w-6 shrink-0">
                                <AvatarImage src={r.author.image || undefined} />
                                <AvatarFallback className="bg-gray-100 text-gray-600 text-[10px]">{rInitials}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-xs">{r.author.name}</span>
                                  <span className="text-[10px] text-muted-foreground">
                                    {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                                  </span>
                                </div>
                                <p className="text-xs mt-0.5 whitespace-pre-wrap">{r.content}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
