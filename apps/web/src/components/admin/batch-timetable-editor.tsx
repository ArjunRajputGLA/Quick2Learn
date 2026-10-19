"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveBatchTimetableAction } from "@/server/admin-actions";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Clock,
  Save,
  Loader2,
} from "lucide-react";

export interface TimetableSlotItem {
  id?: string;
  weekday: number;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  subjectId?: string | null;
  teacherId?: string | null;
  mode: "offline" | "online" | "hybrid";
  roomOrLinkNote?: string | null;
}

interface BatchTimetableEditorProps {
  batchId: string;
  batchTitle: string;
  initialSlots: TimetableSlotItem[];
  subjects: Array<{ id: string; name: string }>;
  faculty: Array<{ id: string; name: string }>;
}

const WEEKDAYS = [
  { day: 1, name: "Monday", short: "Mon" },
  { day: 2, name: "Tuesday", short: "Tue" },
  { day: 3, name: "Wednesday", short: "Wed" },
  { day: 4, name: "Thursday", short: "Thu" },
  { day: 5, name: "Friday", short: "Fri" },
  { day: 6, name: "Saturday", short: "Sat" },
  { day: 7, name: "Sunday", short: "Sun" },
];

export function BatchTimetableEditor({
  batchId,
  batchTitle,
  initialSlots,
  subjects,
  faculty,
}: BatchTimetableEditorProps) {
  const [slots, setSlots] = useState<TimetableSlotItem[]>(initialSlots);
  const [activeDay, setActiveDay] = useState<number>(1);
  const [isSaving, setIsSaving] = useState(false);

  const addSlot = (weekday: number) => {
    const newSlot: TimetableSlotItem = {
      weekday,
      startTime: "16:00",
      endTime: "17:30",
      subjectId: subjects[0]?.id || null,
      teacherId: faculty[0]?.id || null,
      mode: "offline",
      roomOrLinkNote: "Room 101",
    };
    setSlots((prev) => [...prev, newSlot]);
  };

  const removeSlot = (indexToRemove: number) => {
    setSlots((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const updateSlot = (indexToUpdate: number, patch: Partial<TimetableSlotItem>) => {
    setSlots((prev) =>
      prev.map((slot, idx) => (idx === indexToUpdate ? { ...slot, ...patch } : slot))
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await saveBatchTimetableAction(
        batchId,
        slots.map((s) => ({
          weekday: s.weekday,
          startTime: s.startTime,
          endTime: s.endTime,
          subjectId: s.subjectId || null,
          teacherId: s.teacherId || null,
          mode: s.mode,
          roomOrLinkNote: s.roomOrLinkNote || null,
        }))
      );

      if (res.success) {
        toast.success("Timetable saved successfully");
      } else {
        toast.error(res.error || "Failed to save timetable");
      }
    } catch {
      toast.error("Failed to save timetable");
    } finally {
      setIsSaving(false);
    }
  };

  const daySlotsWithOriginalIndex = slots
    .map((slot, originalIndex) => ({ slot, originalIndex }))
    .filter((item) => item.slot.weekday === activeDay);

  return (
    <div className="space-y-6 rounded-2xl border border-border bg-white p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h3 className="text-display-xs font-bold text-ink">Weekly Timetable</h3>
          <p className="text-body-xs text-ink-muted">
            Configure days and recurring class time slots for {batchTitle}.
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="gap-2 font-bold shadow-xs"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>Save Timetable</span>
        </Button>
      </div>

      {/* Weekday Switcher Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {WEEKDAYS.map((wd) => {
          const count = slots.filter((s) => s.weekday === wd.day).length;
          const isActive = activeDay === wd.day;
          return (
            <button
              key={wd.day}
              type="button"
              onClick={() => setActiveDay(wd.day)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-body-xs font-bold transition-all ${
                isActive
                  ? "bg-primary text-white shadow-xs"
                  : "bg-surface-subtle text-ink-muted hover:text-ink hover:bg-surface-subtle/80"
              }`}
            >
              <span>{wd.name}</span>
              {count > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                    isActive ? "bg-white/20 text-white" : "bg-neutral-200 text-ink"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Slots for Active Day */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-body-sm font-bold text-ink">
            {WEEKDAYS.find((w) => w.day === activeDay)?.name} Classes (
            {daySlotsWithOriginalIndex.length})
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addSlot(activeDay)}
            className="gap-1.5 text-xs h-8"
          >
            <Plus className="w-3.5 h-3.5" /> Add Class Slot
          </Button>
        </div>

        {daySlotsWithOriginalIndex.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface-subtle/50 p-8 text-center">
            <Clock className="w-8 h-8 text-ink-muted mx-auto opacity-40 mb-2" />
            <p className="text-body-xs text-ink-muted font-medium">
              No classes scheduled on this day.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addSlot(activeDay)}
              className="mt-3 gap-1.5 text-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Schedule Class
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {daySlotsWithOriginalIndex.map(({ slot, originalIndex }, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-border bg-white p-4 shadow-2xs hover:border-primary/40 transition-colors space-y-3"
              >
                <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-[11px] flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-body-xs font-bold text-ink">
                      Class Slot #{idx + 1}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSlot(originalIndex)}
                    className="p-1 rounded-md text-ink-muted hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Remove slot"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-ink-muted uppercase block mb-1">
                      Start Time
                    </label>
                    <Input
                      type="time"
                      value={slot.startTime}
                      onChange={(e) =>
                        updateSlot(originalIndex, { startTime: e.target.value })
                      }
                      className="text-body-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-ink-muted uppercase block mb-1">
                      End Time
                    </label>
                    <Input
                      type="time"
                      value={slot.endTime}
                      onChange={(e) =>
                        updateSlot(originalIndex, { endTime: e.target.value })
                      }
                      className="text-body-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-ink-muted uppercase block mb-1">
                      Subject
                    </label>
                    <select
                      value={slot.subjectId || ""}
                      onChange={(e) =>
                        updateSlot(originalIndex, {
                          subjectId: e.target.value || null,
                        })
                      }
                      className="w-full h-9 rounded-lg border border-border bg-white px-2.5 text-body-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Select subject...</option>
                      {subjects.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-ink-muted uppercase block mb-1">
                      Teacher / Faculty
                    </label>
                    <select
                      value={slot.teacherId || ""}
                      onChange={(e) =>
                        updateSlot(originalIndex, {
                          teacherId: e.target.value || null,
                        })
                      }
                      className="w-full h-9 rounded-lg border border-border bg-white px-2.5 text-body-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Select teacher...</option>
                      {faculty.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-bold text-ink-muted uppercase block mb-1">
                      Mode
                    </label>
                    <div className="flex gap-2">
                      {(["offline", "online", "hybrid"] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => updateSlot(originalIndex, { mode: m })}
                          className={`flex-1 py-1.5 px-2 rounded-lg text-body-xs font-bold capitalize transition-colors ${
                            slot.mode === m
                              ? "bg-ink text-white"
                              : "bg-surface-subtle text-ink-muted hover:text-ink"
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-ink-muted uppercase block mb-1">
                      Room No. or Link Note
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. Room 204 or Live Stream Link"
                      value={slot.roomOrLinkNote || ""}
                      onChange={(e) =>
                        updateSlot(originalIndex, {
                          roomOrLinkNote: e.target.value,
                        })
                      }
                      className="text-body-xs"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
