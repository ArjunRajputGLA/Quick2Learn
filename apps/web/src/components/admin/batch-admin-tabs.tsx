"use client";

import { useState } from "react";
import { BatchEditor, type BatchEditorProps } from "./batch-editor";
import { BatchTimetableEditor, type TimetableSlotItem } from "./batch-timetable-editor";
import { BatchJoinCodeManager } from "./batch-join-code-manager";
import { BatchJoinRequestsInbox, type JoinRequestItem, type BatchFeePlanOption } from "./batch-join-requests-inbox";
import { BatchContentManager } from "./batch-content-manager";
import { BatchLiveManager } from "./batch-live-manager";
import { BatchAttendanceManager } from "./batch-attendance-manager";
import { Sliders, Calendar, QrCode, Users, BookOpen, Video, CheckCircle2 } from "lucide-react";

interface BatchAdminTabsProps {
  batch: NonNullable<BatchEditorProps["initialBatch"]> & {
    joinCode: string;
    academicYear?: string | null;
  };
  subjects: Array<{ id: string; name: string }>;
  faculty: Array<{ id: string; name: string }>;
  availableChapters: Array<{ id: string; title: string; classLevel: number; subjectId: string }>;
  timetableSlots: TimetableSlotItem[];
  joinRequests: JoinRequestItem[];
}

export function BatchAdminTabs({
  batch,
  subjects,
  faculty,
  availableChapters,
  timetableSlots,
  joinRequests,
}: BatchAdminTabsProps) {
  const [activeTab, setActiveTab] = useState<
    "details" | "content" | "timetable" | "live" | "attendance" | "code" | "requests"
  >("details");


  const pendingCount = joinRequests.filter((r) => r.status === "pending").length;

  const feePlanOptions: BatchFeePlanOption[] = (batch.feePlans || [])
    .filter((p) => p.id)
    .map((p) => ({
      id: p.id!,
      name: p.name,
      totalPaise: p.totalPaise,
    }));

  return (
    <div className="space-y-6">
      {/* Subnav Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3 print:hidden">
        <button
          type="button"
          onClick={() => setActiveTab("details")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-body-sm font-bold transition-all ${
            activeTab === "details"
              ? "bg-primary text-white shadow-xs"
              : "bg-white text-ink-muted hover:text-ink border border-border"
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Batch Details & Fees</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("content")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-body-sm font-bold transition-all ${
            activeTab === "content"
              ? "bg-primary text-white shadow-xs"
              : "bg-white text-ink-muted hover:text-ink border border-border"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Study Material & Content</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("timetable")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-body-sm font-bold transition-all ${
            activeTab === "timetable"
              ? "bg-primary text-white shadow-xs"
              : "bg-white text-ink-muted hover:text-ink border border-border"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Weekly Timetable</span>
          {timetableSlots.length > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                activeTab === "timetable" ? "bg-white/20 text-white" : "bg-neutral-100 text-ink"
              }`}
            >
              {timetableSlots.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("live")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-body-sm font-bold transition-all ${
            activeTab === "live"
              ? "bg-primary text-white shadow-xs"
              : "bg-white text-ink-muted hover:text-ink border border-border"
          }`}
        >
          <Video className="w-4 h-4" />
          <span>Live Classes</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("attendance")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-body-sm font-bold transition-all ${
            activeTab === "attendance"
              ? "bg-primary text-white shadow-xs"
              : "bg-white text-ink-muted hover:text-ink border border-border"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Attendance</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("code")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-body-sm font-bold transition-all ${
            activeTab === "code"
              ? "bg-primary text-white shadow-xs"
              : "bg-white text-ink-muted hover:text-ink border border-border"
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Join Code & QR Poster</span>
          <span className="font-mono text-xs font-black uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
            {batch.joinCode}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("requests")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-body-sm font-bold transition-all ${
            activeTab === "requests"
              ? "bg-primary text-white shadow-xs"
              : "bg-white text-ink-muted hover:text-ink border border-border"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Join Requests</span>
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-amber-500 text-white">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "details" && (
        <BatchEditor
          initialBatch={batch}
          subjects={subjects}
          faculty={faculty}
          availableChapters={availableChapters}
        />
      )}

      {activeTab === "content" && (
        <BatchContentManager batchId={batch.id} />
      )}

      {activeTab === "timetable" && (
        <BatchTimetableEditor
          batchId={batch.id}
          batchTitle={batch.title}
          initialSlots={timetableSlots}
          subjects={subjects}
          faculty={faculty}
        />
      )}

      {activeTab === "live" && (
        <BatchLiveManager
          batchId={batch.id}
          batchTitle={batch.title}
          subjects={subjects}
          faculty={faculty}
        />
      )}

      {activeTab === "attendance" && (
        <BatchAttendanceManager
          batchId={batch.id}
          batchTitle={batch.title}
        />
      )}

      {activeTab === "code" && (
        <BatchJoinCodeManager
          batchId={batch.id}
          batchTitle={batch.title}
          classLevel={batch.classLevel}
          board={batch.board}
          academicYear={batch.academicYear}
          initialJoinCode={batch.joinCode}
        />
      )}

      {activeTab === "requests" && (
        <BatchJoinRequestsInbox
          initialRequests={joinRequests}
          feePlansByBatch={{ [batch.id]: feePlanOptions }}
          currentBatchId={batch.id}
        />
      )}
    </div>
  );
}
