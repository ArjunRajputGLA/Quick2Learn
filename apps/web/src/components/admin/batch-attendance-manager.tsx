"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Wifi,
  Users,
  Save,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import {
  getBatchAttendanceAdminAction,
  saveBatchAttendanceAction,
} from "@/server/admin-actions";

interface StudentAttendanceItem {
  studentId: string;
  studentName: string;
  phone: string | null;
  status: "present" | "absent" | "late" | "excused" | null;
  source: "joined_online" | "marked" | null;
  note: string | null;
  isJoinedOnline?: boolean;
}

interface BatchAttendanceManagerProps {
  batchId: string;
  batchTitle?: string;
}

export function BatchAttendanceManager({
  batchId,
  batchTitle: _batchTitle,
}: BatchAttendanceManagerProps) {
  const getTodayIST = () => {
    return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  };

  const [date, setDate] = useState<string>(getTodayIST());
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentAttendanceItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const fetchAttendance = async (targetDate: string) => {
    setLoading(true);
    try {
      const res = await getBatchAttendanceAdminAction(batchId, targetDate);
      if (res.success && res.data) {
        const payload = res.data as {
          students: StudentAttendanceItem[];
        };
        setStudents(payload.students || []);
        setHasUnsavedChanges(false);
      } else {
        toast.error(res.error || "Failed to load attendance sheet");
      }
    } catch {
      toast.error("Failed to load attendance");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance(date);
  }, [batchId, date]);

  const handleStatusChange = (
    studentId: string,
    newStatus: "present" | "absent" | "late" | "excused"
  ) => {
    setStudents((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, status: newStatus } : s))
    );
    setHasUnsavedChanges(true);
  };

  const handleNoteChange = (studentId: string, note: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, note } : s))
    );
    setHasUnsavedChanges(true);
  };

  const handleMarkAllPresent = () => {
    setStudents((prev) =>
      prev.map((s) => ({
        ...s,
        status: "present",
      }))
    );
    setHasUnsavedChanges(true);
    toast.info("All students marked as Present. Click 'Save Attendance' or wait for instant sync.", {
      icon: <Sparkles className="w-4 h-4 text-emerald-500" />,
    });
  };

  const handleSaveAttendance = async () => {
    setIsSaving(true);
    try {
      const entries = students
        .filter((s) => s.status !== null)
        .map((s) => ({
          studentId: s.studentId,
          status: s.status as "present" | "absent" | "late" | "excused",
          note: s.note || undefined,
        }));

      const res = await saveBatchAttendanceAction({
        batchId,
        date,
        entries,
      });

      if (res.success) {
        const absences = entries.filter((e) => e.status === "absent").length;
        if (absences > 0) {
          toast.success(
            `Attendance saved! Push alerts sent to parents of ${absences} absent student(s).`,
            { icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" /> }
          );
        } else {
          toast.success("Attendance saved successfully!");
        }
        setHasUnsavedChanges(false);
        fetchAttendance(date);
      } else {
        toast.error(res.error || "Failed to save attendance");
      }
    } catch {
      toast.error("Error saving attendance");
    } finally {
      setIsSaving(false);
    }
  };

  // Stats calculation
  const total = students.length;
  const presentCount = students.filter((s) => s.status === "present").length;
  const lateCount = students.filter((s) => s.status === "late").length;
  const absentCount = students.filter((s) => s.status === "absent").length;
  const excusedCount = students.filter((s) => s.status === "excused").length;
  const onlineCount = students.filter((s) => s.isJoinedOnline).length;
  const attendanceRate = total > 0 ? Math.round(((presentCount + lateCount) / total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Controls & Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-border shadow-xs">
        <div>
          <h2 className="text-xl font-black text-ink flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            <span>Batch Attendance Sheet</span>
          </h2>
          <p className="text-body-sm text-ink-muted mt-1">
            Pick date to view or mark attendance. Online joiners are automatically marked present/late.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-neutral-50 px-3 py-1.5 rounded-xl border border-border">
            <Calendar className="w-4 h-4 text-ink-muted" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent text-sm font-bold text-ink outline-none cursor-pointer"
            />
          </div>

          <button
            type="button"
            onClick={handleMarkAllPresent}
            disabled={students.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-body-sm transition-all shadow-xs disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Mark All Present</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAttendance}
            disabled={isSaving || students.length === 0}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-body-sm shadow-xs transition-all ${
              hasUnsavedChanges
                ? "bg-primary hover:bg-primary/90 text-white animate-pulse"
                : "bg-neutral-800 hover:bg-neutral-900 text-white"
            } disabled:opacity-50`}
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? "Saving..." : hasUnsavedChanges ? "Save Changes *" : "Save Attendance"}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-border">
          <span className="text-xs font-semibold text-ink-muted">Enrolled Students</span>
          <div className="text-2xl font-black text-ink mt-1">{total}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/30">
          <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Present
          </span>
          <div className="text-2xl font-black text-emerald-700 mt-1">{presentCount}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/30">
          <span className="text-xs font-semibold text-amber-800 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Late (&gt;10m)
          </span>
          <div className="text-2xl font-black text-amber-700 mt-1">{lateCount}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200 bg-rose-50/30">
          <span className="text-xs font-semibold text-rose-800 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Absent
          </span>
          <div className="text-2xl font-black text-rose-700 mt-1">{absentCount}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200 bg-neutral-50/40">
          <span className="text-xs font-semibold text-neutral-700 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-neutral-600" />
            Excused
          </span>
          <div className="text-2xl font-black text-neutral-700 mt-1">{excusedCount}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-cyan-200 bg-cyan-50/30">
          <span className="text-xs font-semibold text-cyan-800 flex items-center gap-1">
            <Wifi className="w-3.5 h-3.5 text-cyan-600" />
            Joined Online
          </span>
          <div className="text-2xl font-black text-cyan-700 mt-1">{onlineCount}</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-primary/20 bg-primary/5">
          <span className="text-xs font-semibold text-primary">Turnout Rate</span>
          <div className="text-2xl font-black text-primary mt-1">{attendanceRate}%</div>
        </div>
      </div>

      {/* Student List Sheet */}
      <div className="bg-white rounded-2xl border border-border shadow-xs overflow-hidden">
        <div className="p-4 border-b border-border bg-neutral-50/60 flex items-center justify-between">
          <span className="text-xs font-bold text-ink-muted uppercase tracking-wider">
            Student Details & Attendance Status
          </span>
          {hasUnsavedChanges && (
            <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Unsaved changes
            </span>
          )}
        </div>

        {loading ? (
          <div className="p-12 text-center text-ink-muted">
            <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3" />
            <p className="font-semibold text-sm">Loading attendance sheet...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="p-8 text-center text-ink-muted">
            <Users className="w-8 h-8 mx-auto text-ink-muted/40 mb-2" />
            <p className="text-sm font-semibold">No students currently enrolled in this batch.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {students.map((student) => (
              <div
                key={student.studentId}
                className="p-4 sm:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 hover:bg-neutral-50/50 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-[240px]">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center text-sm">
                    {student.studentName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-extrabold text-ink">{student.studentName}</h4>
                      {student.isJoinedOnline && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold flex items-center gap-1">
                          <Wifi className="w-3 h-3" />
                          Joined Online
                        </span>
                      )}
                    </div>
                    {student.phone && (
                      <p className="text-xs font-mono text-ink-muted mt-0.5">{student.phone}</p>
                    )}
                  </div>
                </div>

                {/* Status Selector Pills */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleStatusChange(student.studentId, "present")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border ${
                      student.status === "present"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Present</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusChange(student.studentId, "late")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border ${
                      student.status === "late"
                        ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                        : "bg-white text-amber-700 border-amber-200 hover:bg-amber-50"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Late</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusChange(student.studentId, "absent")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border ${
                      student.status === "absent"
                        ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                        : "bg-white text-rose-700 border-rose-200 hover:bg-rose-50"
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Absent</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusChange(student.studentId, "excused")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border ${
                      student.status === "excused"
                        ? "bg-neutral-700 text-white border-neutral-700 shadow-xs"
                        : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Excused</span>
                  </button>
                </div>

                {/* Optional Note & Absence Parent Notice */}
                <div className="w-full lg:w-72">
                  <input
                    type="text"
                    value={student.note || ""}
                    onChange={(e) => handleNoteChange(student.studentId, e.target.value)}
                    placeholder="Add note (optional)..."
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-border focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                  {student.status === "absent" && (
                    <p className="text-[10px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Parent will receive absent notification upon saving.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
