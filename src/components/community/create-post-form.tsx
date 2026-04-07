"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  slug: string;
  readOnly: boolean;
}

interface CreatePostFormProps {
  groupId: string;
  categories: Category[];
  user: { name?: string | null; image?: string | null };
  isStaff: boolean;
  requiresApproval: boolean;
  onPostCreated?: () => void;
}

export function CreatePostForm({
  groupId,
  categories,
  user,
  isStaff,
  requiresApproval,
  onPostCreated,
}: CreatePostFormProps) {
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(false);

  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "?";

  const availableCategories = categories.filter(
    (c) => !c.readOnly || isStaff
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          groupId,
          categoryId: categoryId || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to create post");
        return;
      }

      setContent("");
      setCategoryId("");

      if (data.status === "PENDING") {
        toast.info("Your post has been submitted for review. It will appear once approved.");
      } else {
        toast.success("Post published!");
      }

      onPostCreated?.();
    } catch {
      toast.error("Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit}>
          <div className="flex gap-3">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarImage src={user.image || undefined} />
              <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-3">
              <Textarea
                placeholder="Share something with the community..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={3}
                className="resize-none"
              />

              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="text-sm border rounded-md px-2 py-1.5 bg-white text-gray-700"
                  >
                    <option value="">No category</option>
                    {availableCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>

                  {requiresApproval && !isStaff && (
                    <span className="text-xs text-amber-600">
                      Posts require admin approval
                    </span>
                  )}
                </div>

                <Button type="submit" size="sm" disabled={loading || !content.trim()}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-1" />
                      Post
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
