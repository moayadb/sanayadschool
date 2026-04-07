"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { PostCard } from "./post-card";
import { CreatePostForm } from "./create-post-form";
import { PendingPostsQueue } from "./pending-posts-queue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, SlidersHorizontal } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  readOnly: boolean;
}

interface Post {
  id: string;
  content: string;
  status: string;
  isPinned: boolean;
  rejectionNote?: string | null;
  createdAt: string;
  author: { id: string; name: string | null; image: string | null };
  category: { id: string; name: string; slug: string } | null;
  _count: { comments: number; likes: number };
  poll?: unknown;
  attachments?: unknown;
}

interface CommunityFeedProps {
  groupId: string;
  groupName: string;
  requiresApproval: boolean;
  memberRole: string;
  categories: Category[];
}

export function CommunityFeed({
  groupId,
  groupName,
  requiresApproval,
  memberRole,
  categories,
}: CommunityFeedProps) {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [sort, setSort] = useState<"recent" | "popular">("recent");

  const isStaffMember = ["OWNER", "ADMIN", "MODERATOR"].includes(memberRole);

  const fetchPosts = useCallback(async (reset = false) => {
    if (reset) setLoading(true);
    else setLoadingMore(true);

    try {
      const params = new URLSearchParams({
        groupId,
        sort,
        ...(selectedCategory ? { categoryId: selectedCategory } : {}),
        ...(!reset && nextCursor ? { cursor: nextCursor } : {}),
      });

      const res = await fetch(`/api/posts?${params}`);
      const data = await res.json();

      if (res.ok) {
        if (reset) {
          setPosts(data.posts);
        } else {
          setPosts((prev) => [...prev, ...data.posts]);
        }
        setNextCursor(data.nextCursor);
      }
    } catch {
      console.error("Failed to fetch posts");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [groupId, sort, selectedCategory, nextCursor]);

  useEffect(() => {
    fetchPosts(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, sort, selectedCategory]);

  const handleLike = async (postId: string) => {
    try {
      await fetch(`/api/posts/${postId}/like`, { method: "POST" });
    } catch {
      console.error("Failed to toggle like");
    }
  };

  const handlePostCreated = () => {
    fetchPosts(true);
  };

  return (
    <div className="space-y-6">
      {/* Admin: Pending Posts Queue */}
      {isStaffMember && (
        <PendingPostsQueue groupId={groupId} />
      )}

      {/* Create Post Form */}
      {session?.user && (
        <CreatePostForm
          groupId={groupId}
          categories={categories}
          user={session.user}
          isStaff={isStaffMember}
          requiresApproval={requiresApproval}
          onPostCreated={handlePostCreated}
        />
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 mr-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
        </div>

        <Button
          variant={selectedCategory === "" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory("")}
        >
          All
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat.id}
            variant={selectedCategory === cat.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.name}
          </Button>
        ))}

        <div className="ml-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSort(sort === "recent" ? "popular" : "recent")}
          >
            {sort === "recent" ? "Recent" : "Popular"}
          </Button>
        </div>
      </div>

      {/* Posts Feed */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg border p-4 space-y-3">
              <div className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-lg border p-12 text-center">
          <p className="text-muted-foreground">No posts yet in {groupName}.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Be the first to share something!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={session?.user?.id}
              onLike={handleLike}
            />
          ))}

          {nextCursor && (
            <div className="text-center py-4">
              <Button
                variant="outline"
                onClick={() => fetchPosts(false)}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Load more
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
