"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  Check,
  X,
  HelpCircle,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, startOfWeek, endOfWeek } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CreateEventDialog } from "./create-event-dialog";

interface Event {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  location: string | null;
  repeat: string;
  requiredLevel: number | null;
  totalRsvps: number;
  goingCount: number;
  myRsvp: "GOING" | "NOT_GOING" | "MAYBE" | null;
  canAccess: boolean;
}

interface CalendarProps {
  groupId: string;
  isAdmin?: boolean;
}

export function Calendar({ groupId, isAdmin }: CalendarProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [view, setView] = useState<"upcoming" | "past">("upcoming");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [groupId, view]);

  const fetchEvents = async () => {
    try {
      const res = await fetch(`/api/events?groupId=${groupId}&view=${view}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setEvents(data.events);
    } catch (error) {
      toast.error("Failed to load events");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRsvp = async (eventId: string, status: "GOING" | "NOT_GOING" | "MAYBE") => {
    try {
      const res = await fetch("/api/events/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, status }),
      });

      if (!res.ok) throw new Error("Failed to RSVP");

      toast.success(status === "GOING" ? "You're going!" : "RSVP updated");
      fetchEvents();
    } catch (error) {
      toast.error("Failed to update RSVP");
    }
  };

  // Calendar grid generation
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => isSameDay(new Date(event.startTime), day));
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-96 bg-gray-100 animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Tabs value={view} onValueChange={(v) => setView(v as "upcoming" | "past")}>
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
          </TabsList>
        </Tabs>

        {isAdmin && (
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Event
          </Button>
        )}
      </div>

      {/* Create Event Dialog */}
      {isAdmin && (
        <CreateEventDialog
          groupId={groupId}
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onEventCreated={fetchEvents}
          defaultDate={selectedDate || new Date()}
        />
      )}

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-4">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => {
              const dayEvents = getEventsForDay(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, currentMonth);

              return (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "min-h-[80px] p-2 rounded-lg border transition-colors text-left",
                    !isCurrentMonth && "bg-gray-50/50 text-gray-400",
                    isToday(day) && "bg-blue-50 border-blue-200",
                    isSelected && "ring-2 ring-blue-500 border-blue-500",
                    !isSelected && isCurrentMonth && "hover:bg-gray-50"
                  )}
                >
                  <span className={cn(
                    "text-sm font-medium",
                    isToday(day) && "text-blue-600"
                  )}>
                    {format(day, "d")}
                  </span>
                  <div className="mt-1 space-y-1">
                    {dayEvents.slice(0, 2).map((event) => (
                      <div
                        key={event.id}
                        className={cn(
                          "text-xs truncate px-1.5 py-0.5 rounded",
                          event.myRsvp === "GOING" && "bg-green-100 text-green-700",
                          event.myRsvp === "MAYBE" && "bg-yellow-100 text-yellow-700",
                          !event.myRsvp && "bg-blue-100 text-blue-700"
                        )}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-muted-foreground pl-1">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Events List for Selected Date */}
      <AnimatePresence mode="wait">
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <h3 className="font-semibold flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Events for {format(selectedDate, "MMMM d, yyyy")}
            </h3>

            {getEventsForDay(selectedDate).length === 0 ? (
              <p className="text-muted-foreground">No events scheduled</p>
            ) : (
              <div className="space-y-3">
                {getEventsForDay(selectedDate).map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onRsvp={handleRsvp}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* All Events List (when no date selected) */}
      {!selectedDate && (
        <div className="space-y-4">
          <h3 className="font-semibold">
            {view === "upcoming" ? "Upcoming Events" : "Past Events"}
          </h3>
          {events.length === 0 ? (
            <p className="text-muted-foreground">No events found</p>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onRsvp={handleRsvp}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EventCard({
  event,
  onRsvp,
}: {
  event: Event;
  onRsvp: (eventId: string, status: "GOING" | "NOT_GOING" | "MAYBE") => void;
}) {
  const startDate = new Date(event.startTime);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
    >
      <Card className={cn(
        "overflow-hidden",
        !event.canAccess && "opacity-60"
      )}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold">{event.title}</h4>
                {event.requiredLevel && (
                  <Badge variant="secondary" className="text-xs">
                    L{event.requiredLevel}+
                  </Badge>
                )}
              </div>

              {event.description && (
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                  {event.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{format(startDate, "h:mm a")}</span>
                  {event.duration && (
                    <span>({event.duration} min)</span>
                  )}
                </div>

                {event.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{event.location}</span>
                  </div>
                )}

                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{event.goingCount} going</span>
                </div>
              </div>
            </div>

            {/* RSVP Buttons */}
            {event.canAccess && (
              <div className="flex flex-col gap-1">
                <Button
                  size="sm"
                  variant={event.myRsvp === "GOING" ? "default" : "outline"}
                  className="gap-1"
                  onClick={() => onRsvp(event.id, "GOING")}
                >
                  <Check className="h-3 w-3" />
                  Going
                </Button>
                <Button
                  size="sm"
                  variant={event.myRsvp === "MAYBE" ? "default" : "outline"}
                  className="gap-1"
                  onClick={() => onRsvp(event.id, "MAYBE")}
                >
                  <HelpCircle className="h-3 w-3" />
                  Maybe
                </Button>
                <Button
                  size="sm"
                  variant={event.myRsvp === "NOT_GOING" ? "default" : "outline"}
                  className="gap-1"
                  onClick={() => onRsvp(event.id, "NOT_GOING")}
                >
                  <X className="h-3 w-3" />
                  Can&apos;t go
                </Button>
              </div>
            )}

            {!event.canAccess && (
              <Badge variant="outline" className="text-xs">
                Level {event.requiredLevel} required
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
