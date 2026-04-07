"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, BookOpen, MessageSquare, Shield, Edit, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Group {
  id: string;
  name: string;
  description: string | null;
  coverImage: string | null;
  icon: string | null;
  rules: string | null;
  welcomeMessage: string | null;
  memberCount: number;
  isMember: boolean;
  userRole: string | null;
  categories: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

interface AboutPageProps {
  groupId: string;
}

export function AboutPageContent({ groupId }: AboutPageProps) {
  const [group, setGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedGroup, setEditedGroup] = useState<Partial<Group>>({});

  useEffect(() => {
    fetchGroup();
  }, [groupId]);

  const fetchGroup = async () => {
    try {
      const res = await fetch(`/api/group/${groupId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setGroup(data.group);
    } catch (error) {
      toast.error("Failed to load group info");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`/api/group/${groupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editedGroup),
      });

      if (!res.ok) throw new Error("Failed to save");

      toast.success("Changes saved!");
      setIsEditing(false);
      fetchGroup();
    } catch (error) {
      toast.error("Failed to save changes");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-48 bg-gray-100 animate-pulse rounded-lg" />
        <div className="h-96 bg-gray-100 animate-pulse rounded-lg" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Group not found</p>
      </div>
    );
  }

  const isAdmin = group.userRole === "OWNER" || group.userRole === "ADMIN";

  return (
    <div className="space-y-6">
      {/* Cover Image */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative h-48 rounded-lg overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600"
      >
        {group.coverImage && (
          <img
            src={group.coverImage}
            alt={group.name}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-end gap-4">
            <Avatar className="h-20 w-20 border-4 border-white">
              <AvatarImage src={group.icon || undefined} />
              <AvatarFallback className="text-2xl bg-blue-600 text-white">
                {group.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="text-white">
              <h1 className="text-3xl font-bold">{group.name}</h1>
              <p className="text-white/80">{group.memberCount} members</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Edit Button */}
      {isAdmin && (
        <div className="flex justify-end">
          {isEditing ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          ) : (
            <Button onClick={() => { setIsEditing(true); setEditedGroup(group); }}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Group
            </Button>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* About */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                About
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={editedGroup.description || ""}
                  onChange={(e) => setEditedGroup({ ...editedGroup, description: e.target.value })}
                  placeholder="Enter group description..."
                  rows={4}
                />
              ) : (
                <p className="text-muted-foreground">
                  {group.description || "No description yet."}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Rules */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Rules
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={editedGroup.rules || ""}
                  onChange={(e) => setEditedGroup({ ...editedGroup, rules: e.target.value })}
                  placeholder="Enter community rules..."
                  rows={6}
                />
              ) : (
                <div className="prose prose-sm max-w-none">
                  {group.rules ? (
                    <pre className="whitespace-pre-wrap font-sans text-muted-foreground">
                      {group.rules}
                    </pre>
                  ) : (
                    <p className="text-muted-foreground">No rules defined yet.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {group.categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50"
                  >
                    <span className="text-sm font-medium">{category.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Members</span>
                  <span className="font-semibold">{group.memberCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Categories</span>
                  <span className="font-semibold">{group.categories.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Your Role</span>
                  <span className="font-semibold capitalize">{group.userRole?.toLowerCase() || "Guest"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Welcome Message */}
          {group.welcomeMessage && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <p className="text-sm text-blue-800 italic">
                  &ldquo;{group.welcomeMessage}&rdquo;
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
