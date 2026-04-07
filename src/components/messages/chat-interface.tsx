"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageSquare, User, ChevronLeft, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  read: boolean;
  createdAt: string;
  sender: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface Conversation {
  id: string;
  memberId: string;
  groupId: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

interface ChatInterfaceProps {
  groupId: string;
  currentUserId: string;
}

export function ChatInterface({ groupId, currentUserId }: ChatInterfaceProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, [groupId]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeConversation?.messages]);

  const fetchConversations = async () => {
    try {
      const res = await fetch(`/api/conversations?groupId=${groupId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setConversations(data.conversations);
      if (data.conversations.length > 0) {
        setActiveConversation(data.conversations[0]);
      }
    } catch (error) {
      toast.error("Failed to load conversations");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;

    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConversation.id,
          content: newMessage,
        }),
      });

      if (!res.ok) throw new Error("Failed to send");

      const data = await res.json();
      
      // Add message to conversation
      setActiveConversation((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          messages: [data.message, ...prev.messages],
        };
      });

      setNewMessage("");
    } catch (error) {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[600px] bg-gray-100 animate-pulse rounded-lg" />
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
        <p className="text-muted-foreground">
          Start a conversation with an instructor
        </p>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-4 h-[600px]">
      {/* Conversations List */}
      <Card className="lg:col-span-1 overflow-hidden">
        <CardContent className="p-0">
          <div className="p-4 border-b">
            <h3 className="font-semibold flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Messages
            </h3>
          </div>
          <ScrollArea className="h-[520px]">
            <div className="divide-y">
              {conversations.map((conversation) => {
                const lastMessage = conversation.messages[0];
                return (
                  <button
                    key={conversation.id}
                    onClick={() => setActiveConversation(conversation)}
                    className={cn(
                      "w-full p-4 text-left hover:bg-gray-50 transition-colors",
                      activeConversation?.id === conversation.id && "bg-blue-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={lastMessage?.sender.image || undefined} />
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {lastMessage?.sender.name || "Instructor"}
                        </p>
                        {lastMessage && (
                          <p className="text-sm text-muted-foreground truncate">
                            {lastMessage.content}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat Area */}
      <Card className="lg:col-span-2 overflow-hidden flex flex-col">
        {activeConversation ? (
          <>
            {/* Header */}
            <div className="p-4 border-b flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setActiveConversation(null)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">Instructor</p>
                <p className="text-xs text-muted-foreground">Online</p>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea ref={scrollRef} className="flex-1 p-4">
              <div className="space-y-4">
                {[...activeConversation.messages].reverse().map((message, index) => {
                  const isMe = message.senderId === currentUserId;
                  const showAvatar = index === 0 || 
                    activeConversation.messages[index - 1]?.senderId !== message.senderId;

                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "flex gap-3",
                        isMe && "flex-row-reverse"
                      )}
                    >
                      {showAvatar && !isMe ? (
                        <Avatar className="h-8 w-8 mt-1">
                          <AvatarImage src={message.sender.image || undefined} />
                          <AvatarFallback>
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="w-8" />
                      )}

                      <div className={cn(
                        "max-w-[70%] space-y-1",
                        isMe && "items-end"
                      )}>
                        <div
                          className={cn(
                            "px-4 py-2 rounded-2xl text-sm",
                            isMe
                              ? "bg-blue-600 text-white rounded-br-md"
                              : "bg-gray-100 text-gray-900 rounded-bl-md"
                          )}
                        >
                          {message.content}
                        </div>
                        <div className={cn(
                          "flex items-center gap-1 text-xs text-muted-foreground",
                          isMe && "justify-end"
                        )}>
                          <span>{format(new Date(message.createdAt), "h:mm a")}</span>
                          {isMe && (
                            message.read ? (
                              <CheckCheck className="h-3 w-3 text-blue-500" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={sending}
                className="flex-1"
              />
              <Button type="submit" disabled={sending || !newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a conversation to start messaging
          </div>
        )}
      </Card>
    </div>
  );
}
