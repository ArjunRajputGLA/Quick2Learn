import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

export const ADMIN_DATA_STORAGE_KEY = 'q2l_admin_portal_data_v6';

export interface AdminCourseItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  thumbnailUrl: string;
  classLevel: 9 | 10 | 11 | 12;
  targetClass?: 9 | 10 | 11 | 12;
  board: 'cbse' | 'icse' | 'isc' | 'all';
  subjects: string[];
  price: number;
  originalPrice?: number;
  discountedPrice?: number;
  validityDays?: number;
  validity?: string;
  badge?: string;
  features: string[];
  enrolledCount: number;
  isPublished: boolean;
  status?: 'published' | 'draft';
  faculty: string;
  rating: number;
  reviewsCount: number;
  batchId?: string;
  createdAt: string;
}

export interface ChatMessageItem {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'admin' | 'teacher' | 'student';
  senderType?: 'admin' | 'teacher' | 'student';
  text: string;
  time?: string;
  imageUrl?: string;
  createdAt: string;
  isOutgoing?: boolean;
}

export interface AdminChatChannelItem {
  id: string;
  type: 'batch_group' | 'direct' | 'announcements';
  title: string;
  subtitle?: string;
  batchId?: string;
  studentId?: string;
  studentName?: string;
  facultyName?: string;
  avatarUrl?: string;
  unreadCount: number;
  lastMessage?: string;
  lastMessageTime?: string;
  messages: ChatMessageItem[];
  createdAt: string;
}

export interface BatchTimingItem {
  id: string;
  subject: string;
  dayTime: string;
  faculty: string;
  avatarUrl?: string;
}

export interface BatchItem {
  id: string;
  title: string;
  subject: string;
  courseName?: string;
  classLevel: 9 | 10 | 11 | 12;
  board: 'cbse' | 'icse' | 'isc';
  mode: 'offline' | 'hybrid' | 'online';
  status: 'upcoming' | 'ongoing' | 'completed';
  startDate: string;
  endDate: string;
  fee: number; // in ₹
  capacity: number;
  enrolledCount: number;
  joinCode: string;
  room: string;
  faculty: string;
  scheduleDays: string[];
  scheduleTime: string;
  timings?: BatchTimingItem[];
}

export interface JoinRequestItem {
  id: string;
  batchId: string;
  batchTitle: string;
  studentId: string;
  studentName: string;
  studentPhone: string;
  classLevel: number;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  note?: string;
}

export interface AdminLectureItem {
  id: string;
  title: string;
  youtubeId: string;
  youtubeUrl: string;
  subject: string;
  classLevel: 9 | 10 | 11 | 12;
  board: 'cbse' | 'icse' | 'isc';
  chapter: string;
  duration: string;
  viewsCount: number;
  orderNo: number;
  isPublished: boolean;
  uploadedAt: string;
  batchId?: string;
  batchTitle?: string;
  folderName?: string;
  faculty?: string;
  tag?: string;
}

export interface AdminResourceItem {
  id: string;
  title: string;
  type: 'notes' | 'dpp' | 'formula_sheet' | 'pyq' | 'solution';
  fileUrl: string;
  fileSize: string;
  filePages: number;
  subject: string;
  classLevel: 9 | 10 | 11 | 12;
  chapter: string;
  visibility: 'public' | 'batch_only';
  batchTitle?: string;
  batchId?: string;
  folderName?: string;
  uploadedAt: string;
  downloadCount: number;
  subtext?: string;
}

export interface AdminAssignmentSubmission {
  id: string;
  studentId: string;
  studentName: string;
  submittedAt: string;
  status: 'submitted' | 'evaluated' | 'pending';
  marksObtained?: number;
  remarks?: string;
  fileUrl?: string;
}

export interface AdminAssignmentItem {
  id: string;
  batchId: string;
  batchTitle: string;
  title: string;
  subject: string;
  classLevel: 9 | 10 | 11 | 12;
  chapter: string;
  dueDate: string;
  totalMarks: number;
  instructions: string;
  attachmentUrl?: string;
  submissionsCount: number;
  createdAt: string;
  submissions: AdminAssignmentSubmission[];
}

export interface AdminLiveClassItem {
  id: string;
  batchId: string;
  batchTitle: string;
  title: string;
  subject: string;
  classLevel: 9 | 10 | 11 | 12;
  faculty: string;
  platform: 'zoom' | 'youtube' | 'meet';
  meetingUrl: string;
  meetingId?: string;
  passcode?: string;
  scheduledAt: string;
  duration: string;
  isLive: boolean;
  createdAt: string;
}

export interface BatchAttendanceRecord {
  id: string;
  batchId: string;
  date: string; // YYYY-MM-DD
  records: Record<string, 'P' | 'A' | 'L'>; // studentId -> status
  savedAt: string;
}

export interface AdminQuestionItem {
  id: string;
  statement: string;
  options: string[];
  correctOptionIndex: number;
  subject: string;
  classLevel: 9 | 10 | 11 | 12;
  chapter: string;
  batchId?: string;
  batchTitle?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  negativeMarks: number;
  explanation: string;
  createdAt: string;
}

export interface AdminTestItem {
  id: string;
  title: string;
  subject: string;
  classLevel: 9 | 10 | 11 | 12;
  batchId?: string;
  batchTitle?: string;
  chapters: string[];
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  questionsCount: number;
  scheduledStart: string;
  scheduledEnd: string;
  status: 'upcoming' | 'live' | 'completed';
  isPublished: boolean;
  submissionsCount: number;
  averageScore: number;
  submissions?: Array<{
    studentId: string;
    studentName: string;
    score: number;
    totalMarks: number;
    submittedAt: string;
    status: 'evaluated' | 'pending';
  }>;
}

export interface AdminStudentItem {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  email: string;
  classLevel: 9 | 10 | 11 | 12;
  board: 'cbse' | 'icse';
  school: string;
  parentName: string | null;
  parentPhone: string | null;
  parentInviteCode: string;
  attendanceRate: number;
  enrolledBatchIds: string[];
  enrolledBatchNames: string[];
  feeStatus: 'paid' | 'due' | 'overdue';
  joinedAt: string;
}

export interface AdminPaymentItem {
  id: string;
  receiptNo: string;
  studentId: string;
  studentName: string;
  batchTitle: string;
  amount: number;
  paymentMethod: 'cash' | 'upi' | 'cheque' | 'razorpay' | 'bank_transfer';
  status: 'paid' | 'due' | 'overdue';
  paidAt: string;
  notes: string | null;
}

export interface AdminFeeDueItem {
  id: string;
  studentId: string;
  studentName: string;
  batchTitle: string;
  amount: number;
  dueDate: string;
  status: 'due' | 'overdue';
}

export interface AdminDoubtItem {
  id: string;
  studentId: string;
  studentName: string;
  batchTitle: string;
  subject: string;
  questionText: string;
  imageUrl?: string | null;
  status: 'open' | 'resolved';
  createdAt: string;
  replies: Array<{
    id: string;
    authorName: string;
    authorRole: 'teacher' | 'admin' | 'student';
    text: string;
    imageUrl?: string | null;
    createdAt: string;
  }>;
}

export interface AdminAnnouncementItem {
  id: string;
  title: string;
  body: string;
  priority: 'normal' | 'urgent';
  targetAudience: string;
  createdAt: string;
  authorName: string;
}

export interface AdminEnquiryItem {
  id: string;
  studentName: string;
  parentName?: string | null;
  phone: string;
  email?: string | null;
  classLevel: number;
  board: 'cbse' | 'icse';
  message: string;
  status: 'new' | 'contacted' | 'enrolled' | 'closed';
  createdAt: string;
  notes?: string | null;
}

export interface AdminPortalState {
  batches: BatchItem[];
  courses: AdminCourseItem[];
  chats: AdminChatChannelItem[];
  joinRequests: JoinRequestItem[];
  lectures: AdminLectureItem[];
  resources: AdminResourceItem[];
  questions: AdminQuestionItem[];
  tests: AdminTestItem[];
  students: AdminStudentItem[];
  payments: AdminPaymentItem[];
  feeDues: AdminFeeDueItem[];
  doubts: AdminDoubtItem[];
  announcements: AdminAnnouncementItem[];
  enquiries: AdminEnquiryItem[];
  assignments: AdminAssignmentItem[];
  liveClasses: AdminLiveClassItem[];
  attendanceRecords: BatchAttendanceRecord[];
  isInitialized: boolean;
}

// Initial clean state for Admin Portal (no dummy data)
export const INITIAL_ADMIN_DATA: Omit<AdminPortalState, 'isInitialized'> = {
  batches: [],
  courses: [],
  chats: [],
  joinRequests: [],
  lectures: [],
  resources: [],
  questions: [],
  tests: [],
  students: [],
  payments: [],
  feeDues: [],
  doubts: [],
  announcements: [],
  enquiries: [],
  assignments: [],
  liveClasses: [],
  attendanceRecords: [],
};

interface AdminStoreActions {
  init: () => Promise<void>;
  // Courses
  createCourse: (course: Omit<AdminCourseItem, 'id' | 'createdAt' | 'enrolledCount' | 'rating' | 'reviewsCount'>) => Promise<AdminCourseItem>;
  updateCourse: (id: string, updates: Partial<AdminCourseItem>) => Promise<void>;
  deleteCourse: (id: string) => Promise<void>;

  // Chats
  sendChatMessage: (
    channelId: string,
    text: string,
    senderRole?: 'admin' | 'teacher' | 'student',
    senderName?: string,
    imageUrl?: string,
    isOutgoing?: boolean
  ) => Promise<ChatMessageItem>;
  createChatChannel: (channel: Omit<AdminChatChannelItem, 'id' | 'createdAt' | 'messages' | 'unreadCount'>) => Promise<AdminChatChannelItem>;

  // Batches
  createBatch: (batch: Omit<BatchItem, 'id' | 'enrolledCount' | 'joinCode'>) => Promise<BatchItem>;
  updateBatch: (id: string, updates: Partial<BatchItem>) => Promise<void>;
  deleteBatch: (id: string) => Promise<void>;
  regenerateJoinCode: (id: string) => Promise<string>;
  approveJoinRequest: (id: string) => Promise<void>;
  rejectJoinRequest: (id: string) => Promise<void>;
  approveAllPendingJoinRequests: () => Promise<void>;
  deleteJoinRequest: (id: string) => Promise<void>;
  addJoinRequest: (request: Omit<JoinRequestItem, 'id' | 'requestedAt'>) => Promise<JoinRequestItem>;

  // Lectures
  addLecture: (lecture: Omit<AdminLectureItem, 'id' | 'viewsCount' | 'uploadedAt'>) => Promise<AdminLectureItem>;
  updateLecture: (id: string, updates: Partial<AdminLectureItem>) => Promise<void>;
  deleteLecture: (id: string) => Promise<void>;

  // Resources
  uploadResource: (resource: Omit<AdminResourceItem, 'id' | 'uploadedAt' | 'downloadCount'>) => Promise<AdminResourceItem>;
  updateResource: (id: string, updates: Partial<AdminResourceItem>) => Promise<void>;
  deleteResource: (id: string) => Promise<void>;

  // Assignments
  createAssignment: (assignment: Omit<AdminAssignmentItem, 'id' | 'submissionsCount' | 'createdAt' | 'submissions'>) => Promise<AdminAssignmentItem>;
  updateAssignment: (id: string, updates: Partial<AdminAssignmentItem>) => Promise<void>;
  deleteAssignment: (id: string) => Promise<void>;
  gradeAssignmentSubmission: (assignmentId: string, submissionId: string, marks: number, remarks?: string) => Promise<void>;

  // Live Classes
  scheduleLiveClass: (liveClass: Omit<AdminLiveClassItem, 'id' | 'isLive' | 'createdAt'>) => Promise<AdminLiveClassItem>;
  updateLiveClass: (id: string, updates: Partial<AdminLiveClassItem>) => Promise<void>;
  deleteLiveClass: (id: string) => Promise<void>;
  toggleLiveClassState: (id: string) => Promise<void>;

  // Attendance
  saveBatchAttendance: (batchId: string, date: string, records: Record<string, 'P' | 'A' | 'L'>) => Promise<void>;

  // Questions
  addQuestion: (question: Omit<AdminQuestionItem, 'id' | 'createdAt'>) => Promise<AdminQuestionItem>;
  updateQuestion: (id: string, updates: Partial<AdminQuestionItem>) => Promise<void>;
  deleteQuestion: (id: string) => Promise<void>;

  // Tests
  createTest: (test: Omit<AdminTestItem, 'id' | 'submissionsCount' | 'averageScore'>) => Promise<AdminTestItem>;
  updateTest: (id: string, updates: Partial<AdminTestItem>) => Promise<void>;
  deleteTest: (id: string) => Promise<void>;
  publishTestResults: (id: string) => Promise<void>;

  // Students
  enrollNewStudent: (student: Omit<AdminStudentItem, 'id' | 'joinedAt'>) => Promise<AdminStudentItem>;
  deleteStudent: (id: string) => Promise<void>;
  enrollStudentInBatch: (studentId: string, batchId: string) => Promise<void>;
  removeStudentFromBatch: (studentId: string, batchId: string) => Promise<void>;
  addStudentToBatch: (studentId: string, batchId: string) => Promise<void>;
  updateStudent: (id: string, updates: Partial<AdminStudentItem>) => Promise<void>;
  generateParentCode: (studentId: string) => Promise<string>;

  // Fees & Payments
  recordOfflinePayment: (payment: {
    studentId: string;
    batchTitle: string;
    amount: number;
    paymentMethod: 'cash' | 'upi' | 'cheque' | 'bank_transfer';
    notes?: string;
  }) => Promise<AdminPaymentItem>;

  // Doubts
  replyDoubt: (doubtId: string, replyText: string) => Promise<void>;
  resolveDoubt: (doubtId: string) => Promise<void>;

  // Announcements
  createAnnouncement: (announcement: Omit<AdminAnnouncementItem, 'id' | 'createdAt'>) => Promise<AdminAnnouncementItem>;
  deleteAnnouncement: (id: string) => Promise<void>;

  // Enquiries
  updateEnquiryStatus: (id: string, status: AdminEnquiryItem['status'], notes?: string) => Promise<void>;
  deleteEnquiry: (id: string) => Promise<void>;

  // Reset
  resetToDefault: () => Promise<void>;
}

export type AdminStore = AdminPortalState & AdminStoreActions;

export const useAdminStore = create<AdminStore>((set, get) => ({
  ...INITIAL_ADMIN_DATA,
  isInitialized: false,

  init: async () => {
    try {
      const raw = await SecureStore.getItemAsync(ADMIN_DATA_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        set({
          ...INITIAL_ADMIN_DATA,
          ...parsed,
          batches: (parsed.batches || INITIAL_ADMIN_DATA.batches).map((b: any) => ({
            ...b,
            mode: b.id === 'batch-ix-icse-maths-sci' && (b.mode === 'hybrid' || !b.mode) ? 'online' : (b.mode || 'online'),
          })),
          assignments: parsed.assignments || INITIAL_ADMIN_DATA.assignments,
          liveClasses: parsed.liveClasses || INITIAL_ADMIN_DATA.liveClasses,
          attendanceRecords: parsed.attendanceRecords || INITIAL_ADMIN_DATA.attendanceRecords,
          courses: (parsed.courses || INITIAL_ADMIN_DATA.courses).map((c: any) => {
            const classLevel = c.classLevel || c.targetClass || 9;
            const isPublished = c.isPublished !== undefined ? c.isPublished : c.status === 'published';
            const price = c.price || c.originalPrice || 9999;
            const discountedPrice = c.discountedPrice ?? price;
            return {
              ...c,
              classLevel,
              targetClass: classLevel,
              isPublished,
              status: isPublished ? 'published' : 'draft',
              price,
              originalPrice: c.originalPrice || price,
              discountedPrice,
              validity: c.validity || `${c.validityDays || 365} Days Access`,
            };
          }),
          chats: parsed.chats || INITIAL_ADMIN_DATA.chats,
          isInitialized: true,
        });
        return;
      }
    } catch (e) {
      console.warn('[AdminStore] Error reading storage, initializing with seed data', e);
    }
    set({ ...INITIAL_ADMIN_DATA, isInitialized: true });
    try {
      await SecureStore.setItemAsync(ADMIN_DATA_STORAGE_KEY, JSON.stringify(INITIAL_ADMIN_DATA));
    } catch {}
  },

  createBatch: async (batchInput) => {
    const newId = `batch-${Date.now()}`;
    const code = `${batchInput.subject.slice(0, 4).toUpperCase()}-${batchInput.classLevel}${Math.floor(10 + Math.random() * 90)}`;
    const newBatch: BatchItem = {
      ...batchInput,
      mode: batchInput.mode || 'online',
      id: newId,
      enrolledCount: 0,
      joinCode: code,
    };
    const updatedBatches = [newBatch, ...get().batches];
    set({ batches: updatedBatches });
    await persistState(get());
    return newBatch;
  },

  updateBatch: async (id, updates) => {
    const updated = get().batches.map((b) => (b.id === id ? { ...b, ...updates } : b));
    set({ batches: updated });
    await persistState(get());
  },

  deleteBatch: async (id) => {
    const updated = get().batches.filter((b) => b.id !== id);
    set({ batches: updated });
    await persistState(get());
  },

  regenerateJoinCode: async (id) => {
    const b = get().batches.find((item) => item.id === id);
    if (!b) return '';
    const newCode = `${b.subject.slice(0, 4).toUpperCase()}-${b.classLevel}${Math.floor(100 + Math.random() * 900)}`;
    await get().updateBatch(id, { joinCode: newCode });
    return newCode;
  },

  approveJoinRequest: async (requestId) => {
    const req = get().joinRequests.find((r) => r.id === requestId);
    if (!req) return;
    const updatedReqs = get().joinRequests.map((r) =>
      r.id === requestId ? { ...r, status: 'approved' as const } : r
    );
    // Increment batch count
    const updatedBatches = get().batches.map((b) =>
      b.id === req.batchId ? { ...b, enrolledCount: b.enrolledCount + 1 } : b
    );
    set({ joinRequests: updatedReqs, batches: updatedBatches });
    await persistState(get());
  },

  rejectJoinRequest: async (requestId) => {
    const updatedReqs = get().joinRequests.map((r) =>
      r.id === requestId ? { ...r, status: 'rejected' as const } : r
    );
    set({ joinRequests: updatedReqs });
    await persistState(get());
  },

  approveAllPendingJoinRequests: async () => {
    const pendingReqs = get().joinRequests.filter((r) => r.status === 'pending');
    if (pendingReqs.length === 0) return;
    const batchIncrementMap = new Map<string, number>();
    for (const r of pendingReqs) {
      batchIncrementMap.set(r.batchId, (batchIncrementMap.get(r.batchId) || 0) + 1);
    }
    const updatedReqs = get().joinRequests.map((r) =>
      r.status === 'pending' ? { ...r, status: 'approved' as const } : r
    );
    const updatedBatches = get().batches.map((b) => {
      const increment = batchIncrementMap.get(b.id) || 0;
      return increment > 0 ? { ...b, enrolledCount: b.enrolledCount + increment } : b;
    });
    set({ joinRequests: updatedReqs, batches: updatedBatches });
    await persistState(get());
  },

  deleteJoinRequest: async (requestId) => {
    const updatedReqs = get().joinRequests.filter((r) => r.id !== requestId);
    set({ joinRequests: updatedReqs });
    await persistState(get());
  },

  addJoinRequest: async (requestInput) => {
    const newId = `req-${Date.now()}`;
    const newReq: JoinRequestItem = {
      ...requestInput,
      id: newId,
      requestedAt: new Date().toISOString(),
    };
    const updated = [newReq, ...get().joinRequests];
    set({ joinRequests: updated });
    await persistState(get());
    return newReq;
  },

  addLecture: async (lectureInput) => {
    const newId = `lec-${Date.now()}`;
    const newLecture: AdminLectureItem = {
      ...lectureInput,
      id: newId,
      viewsCount: 0,
      uploadedAt: new Date().toISOString().split('T')[0],
    };
    const updated = [newLecture, ...get().lectures];
    set({ lectures: updated });
    await persistState(get());
    return newLecture;
  },

  updateLecture: async (id, updates) => {
    const updated = get().lectures.map((l) => (l.id === id ? { ...l, ...updates } : l));
    set({ lectures: updated });
    await persistState(get());
  },

  deleteLecture: async (id) => {
    const updated = get().lectures.filter((l) => l.id !== id);
    set({ lectures: updated });
    await persistState(get());
  },

  uploadResource: async (resourceInput) => {
    const newId = `res-${Date.now()}`;
    const newResource: AdminResourceItem = {
      ...resourceInput,
      id: newId,
      downloadCount: 0,
      uploadedAt: new Date().toISOString().split('T')[0],
    };
    const updated = [newResource, ...get().resources];
    set({ resources: updated });
    await persistState(get());
    return newResource;
  },

  updateResource: async (id, updates) => {
    const updated = get().resources.map((r) => (r.id === id ? { ...r, ...updates } : r));
    set({ resources: updated });
    await persistState(get());
  },

  deleteResource: async (id) => {
    const updated = get().resources.filter((r) => r.id !== id);
    set({ resources: updated });
    await persistState(get());
  },

  createAssignment: async (asgInput) => {
    const newId = `asg-${Date.now()}`;
    const newAsg: AdminAssignmentItem = {
      ...asgInput,
      id: newId,
      submissionsCount: 0,
      createdAt: new Date().toISOString(),
      submissions: [],
    };
    const updated = [newAsg, ...get().assignments];
    set({ assignments: updated });
    await persistState(get());
    return newAsg;
  },

  updateAssignment: async (id, updates) => {
    const updated = get().assignments.map((a) => (a.id === id ? { ...a, ...updates } : a));
    set({ assignments: updated });
    await persistState(get());
  },

  deleteAssignment: async (id) => {
    const updated = get().assignments.filter((a) => a.id !== id);
    set({ assignments: updated });
    await persistState(get());
  },

  gradeAssignmentSubmission: async (assignmentId, submissionId, marks, remarks) => {
    const updated = get().assignments.map((a) => {
      if (a.id !== assignmentId) return a;
      const updatedSubs = a.submissions.map((s) =>
        s.id === submissionId
          ? { ...s, marksObtained: marks, remarks, status: 'evaluated' as const }
          : s
      );
      return { ...a, submissions: updatedSubs };
    });
    set({ assignments: updated });
    await persistState(get());
  },

  scheduleLiveClass: async (liveInput) => {
    const newId = `live-${Date.now()}`;
    const newLive: AdminLiveClassItem = {
      ...liveInput,
      id: newId,
      isLive: false,
      createdAt: new Date().toISOString(),
    };
    const updated = [newLive, ...get().liveClasses];
    set({ liveClasses: updated });
    await persistState(get());
    return newLive;
  },

  updateLiveClass: async (id, updates) => {
    const updated = get().liveClasses.map((l) => (l.id === id ? { ...l, ...updates } : l));
    set({ liveClasses: updated });
    await persistState(get());
  },

  deleteLiveClass: async (id) => {
    const updated = get().liveClasses.filter((l) => l.id !== id);
    set({ liveClasses: updated });
    await persistState(get());
  },

  toggleLiveClassState: async (id) => {
    const updated = get().liveClasses.map((l) =>
      l.id === id ? { ...l, isLive: !l.isLive } : l
    );
    set({ liveClasses: updated });
    await persistState(get());
  },

  saveBatchAttendance: async (batchId, date, records) => {
    const existingIndex = get().attendanceRecords.findIndex(
      (a) => a.batchId === batchId && a.date === date
    );
    let updatedRecords: BatchAttendanceRecord[];
    if (existingIndex >= 0) {
      updatedRecords = [...get().attendanceRecords];
      updatedRecords[existingIndex] = {
        ...updatedRecords[existingIndex],
        records,
        savedAt: new Date().toISOString(),
      };
    } else {
      const newRec: BatchAttendanceRecord = {
        id: `att-${Date.now()}`,
        batchId,
        date,
        records,
        savedAt: new Date().toISOString(),
      };
      updatedRecords = [newRec, ...get().attendanceRecords];
    }
    set({ attendanceRecords: updatedRecords });
    await persistState(get());
  },

  addQuestion: async (questionInput) => {
    const newId = `q-${Date.now()}`;
    const newQuestion: AdminQuestionItem = {
      ...questionInput,
      id: newId,
      createdAt: new Date().toISOString().split('T')[0],
    };
    const updated = [newQuestion, ...get().questions];
    set({ questions: updated });
    await persistState(get());
    return newQuestion;
  },

  updateQuestion: async (id, updates) => {
    const updated = get().questions.map((q) => (q.id === id ? { ...q, ...updates } : q));
    set({ questions: updated });
    await persistState(get());
  },

  deleteQuestion: async (id) => {
    const updated = get().questions.filter((q) => q.id !== id);
    set({ questions: updated });
    await persistState(get());
  },

  createTest: async (testInput) => {
    const newId = `test-${Date.now()}`;
    const newTest: AdminTestItem = {
      ...testInput,
      id: newId,
      submissionsCount: 0,
      averageScore: 0,
    };
    const updated = [newTest, ...get().tests];
    set({ tests: updated });
    await persistState(get());
    return newTest;
  },

  updateTest: async (id, updates) => {
    const updated = get().tests.map((t) => (t.id === id ? { ...t, ...updates } : t));
    set({ tests: updated });
    await persistState(get());
  },

  deleteTest: async (id) => {
    const updated = get().tests.filter((t) => t.id !== id);
    set({ tests: updated });
    await persistState(get());
  },

  publishTestResults: async (id) => {
    const updated = get().tests.map((t) =>
      t.id === id ? { ...t, isPublished: true, status: 'completed' as const } : t
    );
    set({ tests: updated });
    await persistState(get());
  },

  enrollNewStudent: async (studentInput) => {
    const newId = `stud-${Date.now()}`;
    const newStudent: AdminStudentItem = {
      ...studentInput,
      id: newId,
      joinedAt: new Date().toISOString(),
    };
    let updatedBatches = get().batches;
    if (newStudent.enrolledBatchIds && newStudent.enrolledBatchIds.length > 0) {
      updatedBatches = updatedBatches.map((b) =>
        newStudent.enrolledBatchIds.includes(b.id)
          ? { ...b, enrolledCount: b.enrolledCount + 1 }
          : b
      );
    }
    const updatedStudents = [newStudent, ...get().students];
    set({ students: updatedStudents, batches: updatedBatches });
    await persistState(get());
    return newStudent;
  },

  deleteStudent: async (id) => {
    const target = get().students.find((s) => s.id === id);
    let updatedBatches = get().batches;
    if (target?.enrolledBatchIds?.length) {
      updatedBatches = updatedBatches.map((b) =>
        target.enrolledBatchIds.includes(b.id)
          ? { ...b, enrolledCount: Math.max(0, b.enrolledCount - 1) }
          : b
      );
    }
    const updated = get().students.filter((s) => s.id !== id);
    set({ students: updated, batches: updatedBatches });
    await persistState(get());
  },

  enrollStudentInBatch: async (studentId, batchId) => {
    const batch = get().batches.find((b) => b.id === batchId);
    if (!batch) return;
    const updatedStudents = get().students.map((s) => {
      if (s.id === studentId) {
        const batchIds = s.enrolledBatchIds.includes(batchId)
          ? s.enrolledBatchIds
          : [...s.enrolledBatchIds, batchId];
        const batchNames = s.enrolledBatchNames.includes(batch.title)
          ? s.enrolledBatchNames
          : [...s.enrolledBatchNames, batch.title];
        return { ...s, enrolledBatchIds: batchIds, enrolledBatchNames: batchNames };
      }
      return s;
    });
    set({ students: updatedStudents });
    await persistState(get());
  },

  removeStudentFromBatch: async (studentId, batchId) => {
    const batch = get().batches.find((b) => b.id === batchId);
    const updatedStudents = get().students.map((s) => {
      if (s.id === studentId) {
        return {
          ...s,
          enrolledBatchIds: s.enrolledBatchIds.filter((id) => id !== batchId),
          enrolledBatchNames: batch
            ? s.enrolledBatchNames.filter((name) => name !== batch.title)
            : s.enrolledBatchNames,
        };
      }
      return s;
    });
    const updatedBatches = get().batches.map((b) =>
      b.id === batchId ? { ...b, enrolledCount: Math.max(0, b.enrolledCount - 1) } : b
    );
    set({ students: updatedStudents, batches: updatedBatches });
    await persistState(get());
  },

  addStudentToBatch: async (studentId, batchId) => {
    await get().enrollStudentInBatch(studentId, batchId);
    const updatedBatches = get().batches.map((b) =>
      b.id === batchId ? { ...b, enrolledCount: b.enrolledCount + 1 } : b
    );
    set({ batches: updatedBatches });
    await persistState(get());
  },

  updateStudent: async (id, updates) => {
    const updated = get().students.map((s) => (s.id === id ? { ...s, ...updates } : s));
    set({ students: updated });
    await persistState(get());
  },

  generateParentCode: async (studentId) => {
    const student = get().students.find((s) => s.id === studentId);
    const prefix = student ? student.fullName.slice(0, 3).toUpperCase() : 'PRT';
    const newCode = `${prefix}${Math.floor(100 + Math.random() * 900)}`;
    await get().updateStudent(studentId, { parentInviteCode: newCode });
    return newCode;
  },

  recordOfflinePayment: async ({ studentId, batchTitle, amount, paymentMethod, notes }) => {
    const student = get().students.find((s) => s.id === studentId);
    const studentName = student ? student.fullName : 'Enrolled Student';
    const seq = Math.floor(1000 + Math.random() * 9000);
    const receiptNo = `Q2L-2026-00${seq}`;
    const newPayment: AdminPaymentItem = {
      id: `pay-${Date.now()}`,
      receiptNo,
      studentId,
      studentName,
      batchTitle,
      amount,
      paymentMethod,
      status: 'paid',
      paidAt: new Date().toISOString(),
      notes: notes || `Offline fee collected via ${paymentMethod.toUpperCase()}`,
    };

    // Update dues if any
    const updatedDues = get().feeDues.filter(
      (d) => !(d.studentId === studentId && d.batchTitle === batchTitle)
    );

    // Update student feeStatus to paid if no other dues
    const updatedStudents = get().students.map((s) =>
      s.id === studentId ? { ...s, feeStatus: 'paid' as const } : s
    );

    const updatedPayments = [newPayment, ...get().payments];
    set({ payments: updatedPayments, feeDues: updatedDues, students: updatedStudents });
    await persistState(get());
    return newPayment;
  },

  replyDoubt: async (doubtId, replyText) => {
    const doubt = get().doubts.find((d) => d.id === doubtId);
    if (!doubt) return;
    const newReply = {
      id: `rep-${Date.now()}`,
      authorName: 'Dinesh Sir (Administrator)',
      authorRole: 'admin' as const,
      text: replyText,
      createdAt: new Date().toISOString(),
    };
    const updated = get().doubts.map((d) =>
      d.id === doubtId
        ? { ...d, replies: [...d.replies, newReply], status: 'resolved' as const }
        : d
    );
    set({ doubts: updated });
    await persistState(get());
  },

  resolveDoubt: async (doubtId) => {
    const updated = get().doubts.map((d) =>
      d.id === doubtId ? { ...d, status: 'resolved' as const } : d
    );
    set({ doubts: updated });
    await persistState(get());
  },

  createAnnouncement: async (annInput) => {
    const newAnn: AdminAnnouncementItem = {
      ...annInput,
      id: `ann-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newAnn, ...get().announcements];
    set({ announcements: updated });
    await persistState(get());
    return newAnn;
  },

  deleteAnnouncement: async (id) => {
    const updated = get().announcements.filter((a) => a.id !== id);
    set({ announcements: updated });
    await persistState(get());
  },

  updateEnquiryStatus: async (id, status, notes) => {
    const updated = get().enquiries.map((e) =>
      e.id === id ? { ...e, status, notes: notes !== undefined ? notes : e.notes } : e
    );
    set({ enquiries: updated });
    await persistState(get());
  },

  deleteEnquiry: async (id) => {
    const updated = get().enquiries.filter((e) => e.id !== id);
    set({ enquiries: updated });
    await persistState(get());
  },

  // Courses Actions
  createCourse: async (courseInput) => {
    const newId = `course-${Date.now()}`;
    const classLevel = courseInput.classLevel || courseInput.targetClass || 9;
    const isPublished =
      courseInput.isPublished !== undefined
        ? courseInput.isPublished
        : courseInput.status === 'published';
    const price = courseInput.price || courseInput.originalPrice || 9999;
    const discountedPrice = courseInput.discountedPrice ?? price;
    const newCourse: AdminCourseItem = {
      ...courseInput,
      id: newId,
      classLevel,
      targetClass: classLevel,
      isPublished,
      status: isPublished ? 'published' : 'draft',
      price,
      originalPrice: courseInput.originalPrice || price,
      discountedPrice,
      validity: courseInput.validity || `${courseInput.validityDays || 365} Days Access`,
      enrolledCount: 0,
      rating: 5.0,
      reviewsCount: 1,
      createdAt: new Date().toISOString(),
    };
    const updated = [newCourse, ...get().courses];
    set({ courses: updated });
    await persistState(get());
    return newCourse;
  },

  updateCourse: async (id, updates) => {
    const updated = get().courses.map((c) => {
      if (c.id !== id) return c;
      const classLevel = updates.classLevel || updates.targetClass || c.classLevel;
      const isPublished =
        updates.isPublished !== undefined
          ? updates.isPublished
          : updates.status !== undefined
          ? updates.status === 'published'
          : c.isPublished;
      const status = updates.status || (isPublished ? 'published' : 'draft');
      const discountedPrice = updates.discountedPrice ?? updates.price ?? c.discountedPrice;
      return {
        ...c,
        ...updates,
        classLevel,
        targetClass: classLevel,
        isPublished,
        status,
        discountedPrice,
      };
    });
    set({ courses: updated });
    await persistState(get());
  },

  deleteCourse: async (id) => {
    const updated = get().courses.filter((c) => c.id !== id);
    set({ courses: updated });
    await persistState(get());
  },

  // Chats Actions
  sendChatMessage: async (channelId, text, senderRole = 'admin', senderName, imageUrl, isOutgoing = true) => {
    const role = senderRole || 'admin';
    const name =
      senderName ||
      (role === 'admin'
        ? 'Dinesh Singh Rajput (Administrator)'
        : role === 'teacher'
        ? 'Dinesh Singh Rajput (Faculty)'
        : 'Student');
    const newMsg: ChatMessageItem = {
      id: `msg-${Date.now()}`,
      senderId: role === 'student' ? 'stud-01' : 'faculty-dinesh',
      senderName: name,
      senderRole: role,
      senderType: role,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      imageUrl,
      createdAt: new Date().toISOString(),
      isOutgoing: isOutgoing !== undefined ? isOutgoing : true,
    };
    const updated = get().chats.map((c) =>
      c.id === channelId
        ? {
            ...c,
            lastMessage: text,
            lastMessageTime: newMsg.createdAt,
            messages: [...c.messages, newMsg],
          }
        : c
    );
    set({ chats: updated });
    await persistState(get());
    return newMsg;
  },

  createChatChannel: async (channelInput) => {
    const newId = `chat-${Date.now()}`;
    const newChannel: AdminChatChannelItem = {
      ...channelInput,
      id: newId,
      unreadCount: 0,
      messages: [],
      createdAt: new Date().toISOString(),
    };
    const updated = [newChannel, ...get().chats];
    set({ chats: updated });
    await persistState(get());
    return newChannel;
  },

  resetToDefault: async () => {
    set({ ...INITIAL_ADMIN_DATA });
    await persistState(get());
  },
}));

async function persistState(state: AdminPortalState) {
  try {
    const dataToSave = {
      batches: state.batches,
      courses: state.courses,
      chats: state.chats,
      joinRequests: state.joinRequests,
      lectures: state.lectures,
      resources: state.resources,
      questions: state.questions,
      tests: state.tests,
      students: state.students,
      payments: state.payments,
      feeDues: state.feeDues,
      doubts: state.doubts,
      announcements: state.announcements,
      enquiries: state.enquiries,
      assignments: state.assignments,
      liveClasses: state.liveClasses,
      attendanceRecords: state.attendanceRecords,
    };
    await SecureStore.setItemAsync(ADMIN_DATA_STORAGE_KEY, JSON.stringify(dataToSave));
  } catch (err) {
    console.warn('[AdminStore] Error persisting state to SecureStore', err);
  }
}
