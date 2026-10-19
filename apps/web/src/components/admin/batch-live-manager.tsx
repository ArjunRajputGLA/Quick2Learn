"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Video,
  Play,
  Square,
  Plus,
  Calendar,
  Clock,
  ExternalLink,
  PlaySquare,
  Trash2,
  Edit2,
  Sparkles,
  Radio,
  Link as LinkIcon,
} from "lucide-react";
import {
  getBatchLiveSessionsAdminAction,
  createLiveSessionAction,
  updateLiveSessionAction,
  startLiveSessionAction,
  endLiveSessionAction,
  deleteLiveSessionAction,
  generateBatchSessionsFromTimetableAction,
} from "@/server/admin-actions";
import type { LiveSessionItem, BatchLiveResponse } from "@quick2learn/shared";

interface BatchLiveManagerProps {
  batchId: string;
  batchTitle?: string;
  subjects: Array<{ id: string; name: string }>;
  faculty: Array<{ id: string; name: string }>;
}

export function BatchLiveManager({
  batchId,
  batchTitle: _batchTitle,
  subjects,
  faculty,
}: BatchLiveManagerProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<BatchLiveResponse | null>(null);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<LiveSessionItem | null>(null);
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [provider, setProvider] = useState<"zoom" | "google_meet" | "youtube_live" | "offline">("zoom");
  const [joinUrl, setJoinUrl] = useState("");
  const [passcode, setPasscode] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [recordingYoutubeId, setRecordingYoutubeId] = useState("");

  // Attach recording modal state
  const [recordingModalSession, setRecordingModalSession] = useState<LiveSessionItem | null>(null);
  const [inputRecordingId, setInputRecordingId] = useState("");

  // Generating state
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await getBatchLiveSessionsAdminAction(batchId);
      if (res.success && res.data) {
        setData(res.data as BatchLiveResponse);
      } else {
        toast.error(res.error || "Failed to load live sessions");
      }
    } catch {
      toast.error("Failed to load live sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [batchId]);

  const openCreateModal = () => {
    setEditingSession(null);
    setTitle("Live Class");
    setSubjectId(subjects[0]?.id || "");
    setTeacherId(faculty[0]?.id || "");
    setProvider("zoom");
    setJoinUrl("");
    setPasscode("");
    setRecordingYoutubeId("");

    // Default time: today at next hour
    const start = new Date();
    start.setHours(start.getHours() + 1, 0, 0, 0);
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    const pad = (n: number) => n.toString().padStart(2, "0");
    const toLocalISO = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

    setStartsAt(toLocalISO(start));
    setEndsAt(toLocalISO(end));
    setIsModalOpen(true);
  };

  const openEditModal = (session: LiveSessionItem) => {
    setEditingSession(session);
    setTitle(session.title);
    setSubjectId(session.subjectId || "");
    setTeacherId(session.teacherId || "");
    setProvider(session.provider);
    setJoinUrl(session.joinUrl || "");
    setPasscode(session.passcode || "");
    setRecordingYoutubeId(session.recordingYoutubeId || "");

    const pad = (n: number) => n.toString().padStart(2, "0");
    const toLocalISO = (isoStr: string) => {
      const d = new Date(isoStr);
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    setStartsAt(toLocalISO(session.startsAt));
    setEndsAt(toLocalISO(session.endsAt));
    setIsModalOpen(true);
  };

  const handleSaveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startsAt || !endsAt) {
      toast.error("Please fill in title, start time, and end time");
      return;
    }

    try {
      const startIso = new Date(startsAt).toISOString();
      const endIso = new Date(endsAt).toISOString();

      if (editingSession) {
        const res = await updateLiveSessionAction(editingSession.id, batchId, {
          title: title.trim(),
          subjectId: subjectId || null,
          teacherId: teacherId || null,
          provider,
          joinUrl: joinUrl.trim() || null,
          passcode: passcode.trim() || null,
          startsAt: startIso,
          endsAt: endIso,
          recordingYoutubeId: recordingYoutubeId.trim() || null,
        });
        if (res.success) {
          toast.success("Session updated successfully");
          setIsModalOpen(false);
          fetchSessions();
        } else {
          toast.error(res.error || "Failed to update session");
        }
      } else {
        const res = await createLiveSessionAction({
          batchId,
          title: title.trim(),
          subjectId: subjectId || null,
          teacherId: teacherId || null,
          provider,
          joinUrl: joinUrl.trim() || null,
          passcode: passcode.trim() || null,
          startsAt: startIso,
          endsAt: endIso,
          recordingYoutubeId: recordingYoutubeId.trim() || null,
        });
        if (res.success) {
          toast.success("Session scheduled successfully");
          setIsModalOpen(false);
          fetchSessions();
        } else {
          toast.error(res.error || "Failed to create session");
        }
      }
    } catch {
      toast.error("An unexpected error occurred");
    }
  };

  const handleStartSession = async (session: LiveSessionItem) => {
    setActiveActionId(session.id);
    try {
      const res = await startLiveSessionAction(session.id, batchId);
      if (res.success) {
        toast.success(`Started "${session.title}"! Push notification sent to students.`, {
          icon: <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />,
        });
        fetchSessions();
      } else {
        toast.error(res.error || "Failed to start session");
      }
    } catch {
      toast.error("Error starting live session");
    } finally {
      setActiveActionId(null);
    }
  };

  const handleEndSession = async (session: LiveSessionItem) => {
    setRecordingModalSession(session);
    setInputRecordingId(session.recordingYoutubeId || "");
  };

  const confirmEndSession = async () => {
    if (!recordingModalSession) return;
    setActiveActionId(recordingModalSession.id);
    try {
      const res = await endLiveSessionAction(
        recordingModalSession.id,
        batchId,
        inputRecordingId.trim() || null
      );
      if (res.success) {
        toast.success(`Ended "${recordingModalSession.title}"`);
        setRecordingModalSession(null);
        fetchSessions();
      } else {
        toast.error(res.error || "Failed to end session");
      }
    } catch {
      toast.error("Error ending live session");
    } finally {
      setActiveActionId(null);
    }
  };

  const handleDeleteSession = async (sessionId: string, sessionTitle: string) => {
    if (!confirm(`Are you sure you want to cancel and delete "${sessionTitle}"?`)) return;
    try {
      const res = await deleteLiveSessionAction(sessionId, batchId);
      if (res.success) {
        toast.success("Session deleted");
        fetchSessions();
      } else {
        toast.error(res.error || "Failed to delete session");
      }
    } catch {
      toast.error("Error deleting session");
    }
  };

  const handleGenerateTimetable = async () => {
    setIsGenerating(true);
    try {
      const res = await generateBatchSessionsFromTimetableAction(batchId, 14);
      if (res.success) {
        const count = (res.data as { generatedCount: number })?.generatedCount || 0;
        toast.success(`Generated ${count} sessions for the next 14 days from weekly timetable!`);
        fetchSessions();
      } else {
        toast.error(res.error || "Failed to generate sessions");
      }
    } catch {
      toast.error("Error generating timetable sessions");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-border shadow-xs">
        <div>
          <h2 className="text-xl font-black text-ink flex items-center gap-2">
            <Video className="w-6 h-6 text-primary" />
            <span>Scheduled Live Classes</span>
          </h2>
          <p className="text-body-sm text-ink-muted mt-1">
            Manage live Zoom, Google Meet, or YouTube streams with 1-tap push notifications and automatic attendance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleGenerateTimetable}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary font-bold text-body-sm transition-all disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isGenerating ? "Generating..." : "Generate 14 Days from Timetable"}</span>
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-body-sm shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Live Session</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-ink-muted bg-white rounded-2xl border border-border">
          <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3" />
          <p className="font-semibold">Loading live sessions...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Live Session Highlight Banner */}
          {data?.liveNow && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border-2 border-emerald-500/30 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500 text-white shadow-md">
                  <Radio className="w-6 h-6 animate-pulse" />
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[11px] font-extrabold uppercase tracking-wider">
                      LIVE NOW
                    </span>
                    <span className="text-body-sm font-semibold text-emerald-800">
                      {data.liveNow.provider.replace("_", " ").toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-ink mt-0.5">{data.liveNow.title}</h3>
                  <p className="text-xs text-ink-muted">
                    {data.liveNow.timeFormatted} • Started & active
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                {data.liveNow.joinUrl && (
                  <a
                    href={data.liveNow.joinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-50 font-bold text-xs shadow-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Join Class</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => handleEndSession(data.liveNow!)}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-all"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>End Class</span>
                </button>
              </div>
            </div>
          )}

          {/* Upcoming Sessions List */}
          <div className="bg-white rounded-2xl border border-border shadow-xs overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-ink flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>Upcoming & Scheduled Classes</span>
                </h3>
                <p className="text-xs text-ink-muted mt-0.5">
                  Sessions will automatically alert students 10 minutes before start. Click Start to send instant push.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-neutral-100 text-xs font-bold text-ink">
                {data?.allUpcoming?.length || 0} Scheduled
              </span>
            </div>

            {(!data?.allUpcoming || data.allUpcoming.length === 0) ? (
              <div className="p-8 text-center text-ink-muted">
                <Clock className="w-8 h-8 mx-auto text-ink-muted/40 mb-2" />
                <p className="text-sm font-semibold">No upcoming sessions scheduled.</p>
                <p className="text-xs text-ink-muted mt-1">
                  Click "Generate 14 Days from Timetable" or create a one-off session.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {data.allUpcoming.map((session) => (
                  <div
                    key={session.id}
                    className={`p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${
                      session.isLive ? "bg-emerald-50/40" : "hover:bg-neutral-50/60"
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`mt-1 p-2.5 rounded-xl flex items-center justify-center ${
                          session.isLive
                            ? "bg-emerald-500 text-white"
                            : session.provider === "zoom"
                            ? "bg-blue-100 text-blue-700"
                            : session.provider === "google_meet"
                            ? "bg-green-100 text-green-700"
                            : session.provider === "youtube_live"
                            ? "bg-red-100 text-red-700"
                            : "bg-neutral-100 text-neutral-700"
                        }`}
                      >
                        <Video className="w-5 h-5" />
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide ${
                              session.status === "live"
                                ? "bg-emerald-500 text-white animate-pulse"
                                : "bg-neutral-100 text-ink-muted"
                            }`}
                          >
                            {session.status}
                          </span>
                          <span className="text-xs font-semibold text-primary">
                            {session.subjectName || "Subject"}
                          </span>
                          {session.teacherName && (
                            <span className="text-xs text-ink-muted">• {session.teacherName}</span>
                          )}
                          <span className="text-xs font-mono font-medium px-1.5 py-0.2 rounded bg-neutral-100 text-ink-muted">
                            {session.provider.replace("_", " ")}
                          </span>
                        </div>

                        <h4 className="text-base font-extrabold text-ink mt-1">
                          {session.title}
                        </h4>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-ink-muted mt-1.5">
                          <span className="flex items-center gap-1 font-medium">
                            <Clock className="w-3.5 h-3.5 text-ink-muted/70" />
                            {session.startsAtFormatted} ({session.timeFormatted})
                          </span>

                          {session.joinUrl && (
                            <span className="flex items-center gap-1 text-primary truncate max-w-xs">
                              <LinkIcon className="w-3 h-3" />
                              <span className="truncate">{session.joinUrl}</span>
                            </span>
                          )}

                          {session.passcode && (
                            <span className="bg-amber-50 text-amber-900 border border-amber-200 px-1.5 py-0.2 rounded text-[11px] font-mono">
                              Passcode: {session.passcode}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
                      {session.status !== "live" ? (
                        <button
                          type="button"
                          onClick={() => handleStartSession(session)}
                          disabled={activeActionId === session.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Start Class</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleEndSession(session)}
                          disabled={activeActionId === session.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50"
                        >
                          <Square className="w-3.5 h-3.5 fill-current" />
                          <span>End Class</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => openEditModal(session)}
                        className="p-1.5 rounded-xl border border-border bg-white hover:bg-neutral-50 text-ink-muted hover:text-ink transition-colors"
                        title="Edit session"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteSession(session.id, session.title)}
                        className="p-1.5 rounded-xl border border-border bg-white hover:bg-rose-50 text-ink-muted hover:text-rose-600 transition-colors"
                        title="Cancel session"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past Recordings & Archives */}
          <div className="bg-white rounded-2xl border border-border shadow-xs overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-ink flex items-center gap-2">
                  <PlaySquare className="w-4 h-4 text-rose-600" />
                  <span>Class Recordings & Archive</span>
                </h3>
                <p className="text-xs text-ink-muted mt-0.5">
                  Recordings linked here appear in the student & parent app under "Past sessions" with "Watch recording".
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-neutral-100 text-xs font-bold text-ink">
                {data?.recentRecordings?.length || 0} Recordings
              </span>
            </div>

            {(!data?.recentRecordings || data.recentRecordings.length === 0) ? (
              <div className="p-8 text-center text-ink-muted">
                <PlaySquare className="w-8 h-8 mx-auto text-ink-muted/40 mb-2" />
                <p className="text-sm font-semibold">No recordings attached yet.</p>
                <p className="text-xs text-ink-muted mt-1">
                  When a session ends, attach its YouTube recording ID so students can rewatch it anytime.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {data.recentRecordings.map((session) => (
                  <div
                    key={session.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div>
                      <h4 className="text-sm font-extrabold text-ink">{session.title}</h4>
                      <p className="text-xs text-ink-muted mt-0.5">
                        {session.startsAtFormatted} • YouTube ID:{" "}
                        <span className="font-mono font-bold text-ink">
                          {session.recordingYoutubeId}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`https://www.youtube.com/watch?v=${session.recordingYoutubeId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-white hover:bg-neutral-50 text-ink font-bold text-xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Watch on YouTube</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => openEditModal(session)}
                        className="p-1.5 rounded-xl border border-border bg-white hover:bg-neutral-50 text-ink-muted hover:text-ink transition-colors"
                        title="Edit Recording"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create / Edit Live Session Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-border max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-black text-ink">
              {editingSession ? "Edit Live Session" : "Schedule Live Class"}
            </h3>
            <p className="text-xs text-ink-muted mt-1">
              Configure session details, paste conference link, and set scheduled time.
            </p>

            <form onSubmit={handleSaveSession} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-bold text-ink mb-1">Session Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Coordinate Geometry - Practice & PYQs"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Subject</label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm"
                  >
                    <option value="">Select subject...</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Teacher</label>
                  <select
                    value={teacherId}
                    onChange={(e) => setTeacherId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm"
                  >
                    <option value="">Select faculty...</option>
                    {faculty.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Starts At (IST)</label>
                  <input
                    type="datetime-local"
                    required
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Ends At (IST)</label>
                  <input
                    type="datetime-local"
                    required
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">Provider</label>
                <div className="grid grid-cols-4 gap-2">
                  {(["zoom", "google_meet", "youtube_live", "offline"] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setProvider(p)}
                      className={`px-2 py-2 rounded-xl text-xs font-bold capitalize transition-all border ${
                        provider === p
                          ? "bg-primary text-white border-primary shadow-xs"
                          : "bg-white text-ink-muted border-border hover:bg-neutral-50"
                      }`}
                    >
                      {p.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">
                  Join URL (Zoom / Meet / Stream Link)
                </label>
                <input
                  type="url"
                  value={joinUrl}
                  onChange={(e) => setJoinUrl(e.target.value)}
                  placeholder="https://zoom.us/j/... or https://meet.google.com/..."
                  className="w-full px-3.5 py-2 rounded-xl border border-border text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Passcode (Optional)</label>
                  <input
                    type="text"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="e.g. 123456"
                    className="w-full px-3 py-2 rounded-xl border border-border text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Recording YouTube ID</label>
                  <input
                    type="text"
                    value={recordingYoutubeId}
                    onChange={(e) => setRecordingYoutubeId(e.target.value)}
                    placeholder="e.g. dQw4w9WgXcQ"
                    className="w-full px-3 py-2 rounded-xl border border-border text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border text-ink-muted hover:text-ink text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold shadow-xs"
                >
                  {editingSession ? "Save Changes" : "Schedule Session"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* End Session & Attach Recording Modal */}
      {recordingModalSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-border">
            <h3 className="text-lg font-black text-ink">End Live Session</h3>
            <p className="text-xs text-ink-muted mt-1">
              Ending "{recordingModalSession.title}". You can optionally attach the YouTube recording ID now or later.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-ink mb-1">
                  YouTube Recording ID (Optional)
                </label>
                <input
                  type="text"
                  value={inputRecordingId}
                  onChange={(e) => setInputRecordingId(e.target.value)}
                  placeholder="e.g. dQw4w9WgXcQ or leave empty"
                  className="w-full px-3 py-2.5 rounded-xl border border-border text-sm font-mono"
                />
                <p className="text-[11px] text-ink-muted mt-1">
                  Students will see a "Watch recording" button in their batch screen.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setRecordingModalSession(null)}
                  className="px-4 py-2 rounded-xl border border-border text-ink-muted text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmEndSession}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs"
                >
                  Confirm End Class
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
