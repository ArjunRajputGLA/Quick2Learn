import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

export const ADMIN_DATA_STORAGE_KEY = 'q2l_admin_portal_data_v5';

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

// Initial realistic institute seed data for Dinesh Sir's Quick2Learn
export const INITIAL_ADMIN_DATA: Omit<AdminPortalState, 'isInitialized'> = {
  batches: [
    {
      id: 'batch-ix-icse-maths-sci',
      title: 'IX ICSE ( 2026 - 2027 )',
      subject: 'Maths, Science',
      courseName: 'Class 9 - Tests available',
      classLevel: 9,
      board: 'icse',
      mode: 'online',
      status: 'ongoing',
      startDate: '2026-04-22',
      endDate: '2027-02-28',
      fee: 16000,
      capacity: 40,
      enrolledCount: 28,
      joinCode: 'iiwbpg',
      room: 'Hall 2',
      faculty: 'DINESH SINGH RAJPUT',
      scheduleDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      scheduleTime: '08:00 PM - 09:00 PM',
      timings: [
        {
          id: 'timing-01',
          subject: 'Maths',
          dayTime: 'Mon, 08:00 PM - 09:00 PM',
          faculty: 'DINESH RAJPUT',
        },
        {
          id: 'timing-02',
          subject: 'Maths',
          dayTime: 'Wed, 08:00 PM - 09:00 PM',
          faculty: 'DINESH RAJPUT',
        },
        {
          id: 'timing-03',
          subject: 'Science',
          dayTime: 'Tue, 07:00 PM - 08:00 PM',
          faculty: 'DINESH RAJPUT',
        },
        {
          id: 'timing-04',
          subject: 'Science',
          dayTime: 'Thu, 07:00 PM - 08:00 PM',
          faculty: 'DINESH RAJPUT',
        },
      ],
    },
    {
      id: 'batch-xii-cbse-maths',
      title: 'Class XII CBSE Maths Target 100',
      subject: 'Mathematics',
      classLevel: 12,
      board: 'cbse',
      mode: 'online',
      status: 'ongoing',
      startDate: '2026-04-10',
      endDate: '2027-02-28',
      fee: 22000,
      capacity: 35,
      enrolledCount: 29,
      joinCode: 'MATH-12A',
      room: 'Hall 1',
      faculty: 'Dinesh Singh Rajput',
      scheduleDays: ['Mon', 'Wed', 'Fri'],
      scheduleTime: '5:00 PM - 6:30 PM',
    },
    {
      id: 'batch-xi-cbse-maths',
      title: 'Class XI CBSE Foundation & Calculus',
      subject: 'Mathematics',
      classLevel: 11,
      board: 'cbse',
      mode: 'online',
      status: 'ongoing',
      startDate: '2026-04-15',
      endDate: '2027-02-20',
      fee: 18000,
      capacity: 30,
      enrolledCount: 24,
      joinCode: 'MATH-11F',
      room: 'Room 2',
      faculty: 'Dinesh Singh Rajput',
      scheduleDays: ['Tue', 'Thu', 'Sat'],
      scheduleTime: '4:00 PM - 5:30 PM',
    },
    {
      id: 'batch-x-cbse-board',
      title: 'Class X CBSE Board Excellence',
      subject: 'Mathematics',
      classLevel: 10,
      board: 'cbse',
      mode: 'online',
      status: 'ongoing',
      startDate: '2026-04-01',
      endDate: '2027-02-15',
      fee: 15000,
      capacity: 40,
      enrolledCount: 36,
      joinCode: 'MATH-10X',
      room: 'Hall 1',
      faculty: 'Dinesh Singh Rajput',
      scheduleDays: ['Mon', 'Wed', 'Fri'],
      scheduleTime: '6:30 PM - 7:45 PM',
    },
    {
      id: 'batch-xii-che-icse',
      title: 'Class XII ISC Chemistry Super 30',
      subject: 'Chemistry',
      classLevel: 12,
      board: 'isc',
      mode: 'online',
      status: 'ongoing',
      startDate: '2026-04-12',
      endDate: '2027-02-25',
      fee: 20000,
      capacity: 30,
      enrolledCount: 22,
      joinCode: 'CHEM-12S',
      room: 'Science Lab',
      faculty: 'Namita Singh Rajput',
      scheduleDays: ['Tue', 'Thu', 'Sat'],
      scheduleTime: '5:30 PM - 7:00 PM',
    },
    {
      id: 'batch-x-bio-icse',
      title: 'Class X ICSE Biology Revision Batch',
      subject: 'Biology',
      classLevel: 10,
      board: 'icse',
      mode: 'online',
      status: 'upcoming',
      startDate: '2026-11-01',
      endDate: '2027-02-10',
      fee: 12000,
      capacity: 25,
      enrolledCount: 14,
      joinCode: 'BIO-10REV',
      room: 'Room 3',
      faculty: 'Namita Singh Rajput',
      scheduleDays: ['Sun'],
      scheduleTime: '9:00 AM - 12:00 PM',
    },
  ],

  joinRequests: [
    {
      id: 'req-01',
      batchId: 'batch-xii-cbse-maths',
      batchTitle: 'Class XII CBSE Maths Target 100',
      studentId: 'stud-ayush',
      studentName: 'Ayush Agarwal',
      studentPhone: '+91 98765 43299',
      classLevel: 12,
      requestedAt: '2026-10-22T10:15:00Z',
      status: 'pending',
      note: 'Wants to attend online calculus problem sessions',
    },
    {
      id: 'req-02',
      batchId: 'batch-xi-cbse-maths',
      batchTitle: 'Class XI CBSE Foundation & Calculus',
      studentId: 'stud-shreya',
      studentName: 'Shreya Sharma',
      studentPhone: '+91 98765 43110',
      classLevel: 11,
      requestedAt: '2026-10-22T08:30:00Z',
      status: 'pending',
      note: 'Transferring from evening offline batch',
    },
    {
      id: 'req-03',
      batchId: 'batch-x-cbse-board',
      batchTitle: 'Class X CBSE Board Excellence',
      studentId: 'stud-kabir',
      studentName: 'Kabir Sen',
      studentPhone: '+91 98765 43555',
      classLevel: 10,
      requestedAt: '2026-10-21T18:45:00Z',
      status: 'pending',
      note: 'Board revision & formula practice',
    },
    {
      id: 'req-04',
      batchId: 'batch-ix-icse-maths-sci',
      batchTitle: 'IX ICSE ( 2026 - 2027 )',
      studentId: 'stud-aarav',
      studentName: 'Aarav Sharma',
      studentPhone: '+91 98765 43210',
      classLevel: 9,
      requestedAt: '2026-10-20T12:00:00Z',
      status: 'approved',
      note: 'Joined via code iiwbpg • Fee confirmed',
    },
    {
      id: 'req-05',
      batchId: 'batch-xii-cbse-maths',
      batchTitle: 'Class XII CBSE Maths Target 100',
      studentId: 'stud-ananya',
      studentName: 'Ananya Gupta',
      studentPhone: '+91 98765 43212',
      classLevel: 12,
      requestedAt: '2026-10-19T14:20:00Z',
      status: 'approved',
      note: 'Enrolled & batch materials unlocked',
    },
    {
      id: 'req-06',
      batchId: 'batch-x-cbse-board',
      batchTitle: 'Class X CBSE Board Excellence',
      studentId: 'stud-priya',
      studentName: 'Priya Verma',
      studentPhone: '+91 98765 43789',
      classLevel: 9,
      requestedAt: '2026-10-18T09:10:00Z',
      status: 'rejected',
      note: 'Currently in Class 9, applied for Class 10 batch',
    },
    {
      id: 'req-07',
      batchId: 'batch-ix-icse-maths-sci',
      batchTitle: 'IX ICSE ( 2026 - 2027 )',
      studentId: 'stud-rohit',
      studentName: 'Rohit Deshmukh',
      studentPhone: '+91 98765 43901',
      classLevel: 9,
      requestedAt: '2026-10-17T11:40:00Z',
      status: 'rejected',
      note: 'Duplicate join code submission',
    },
  ],

  lectures: [
    {
      id: 'lec-ix-che-07',
      title: 'LECTURE-7: EX 2(C)',
      youtubeId: 'W3s-p-c5q2Q',
      youtubeUrl: 'https://www.youtube.com/watch?v=W3s-p-c5q2Q',
      subject: 'CHEMISTRY',
      classLevel: 9,
      board: 'icse',
      chapter: 'CH-2 (CHEMICAL CHANGES & REACTIONS)',
      duration: '00:21:37',
      viewsCount: 1420,
      orderNo: 7,
      isPublished: true,
      uploadedAt: '2026-05-24',
      batchId: 'batch-ix-icse-maths-sci',
      faculty: 'DINESH SINGH RAJPUT',
      tag: 'Uncategorized',
    },
    {
      id: 'lec-ix-che-06',
      title: 'LECTURE-6: EX 2(B)',
      youtubeId: 'g7h1BqV2W3E',
      youtubeUrl: 'https://www.youtube.com/watch?v=g7h1BqV2W3E',
      subject: 'CHEMISTRY',
      classLevel: 9,
      board: 'icse',
      chapter: 'CH-2 (CHEMICAL CHANGES & REACTIONS)',
      duration: '00:26:45',
      viewsCount: 1680,
      orderNo: 6,
      isPublished: true,
      uploadedAt: '2026-05-23',
      batchId: 'batch-ix-icse-maths-sci',
      faculty: 'DINESH SINGH RAJPUT',
      tag: 'Uncategorized',
    },
    {
      id: 'lec-ix-che-05',
      title: 'LECTURE-5: TYPES OF CHEMICAL REACTIONS',
      youtubeId: 'kJ8m9L0p1Q2',
      youtubeUrl: 'https://www.youtube.com/watch?v=kJ8m9L0p1Q2',
      subject: 'CHEMISTRY',
      classLevel: 9,
      board: 'icse',
      chapter: 'CH-2 (CHEMICAL CHANGES & REACTIONS)',
      duration: '00:32:10',
      viewsCount: 1920,
      orderNo: 5,
      isPublished: true,
      uploadedAt: '2026-05-22',
      batchId: 'batch-ix-icse-maths-sci',
      faculty: 'DINESH SINGH RAJPUT',
      tag: 'Uncategorized',
    },
    {
      id: 'lec-ix-che-04',
      title: 'LECTURE-4: THERMAL DISSOCIATION',
      youtubeId: 'zX3vB1n9M2K',
      youtubeUrl: 'https://www.youtube.com/watch?v=zX3vB1n9M2K',
      subject: 'CHEMISTRY',
      classLevel: 9,
      board: 'icse',
      chapter: 'CH-2 (CHEMICAL CHANGES & REACTIONS)',
      duration: '00:28:15',
      viewsCount: 1540,
      orderNo: 4,
      isPublished: true,
      uploadedAt: '2026-05-21',
      batchId: 'batch-ix-icse-maths-sci',
      faculty: 'DINESH SINGH RAJPUT',
      tag: 'Uncategorized',
    },
    {
      id: 'lec-ix-che-03',
      title: 'LECTURE-3: EX 2(A)',
      youtubeId: 'pQ7wE9rT1Y4',
      youtubeUrl: 'https://www.youtube.com/watch?v=pQ7wE9rT1Y4',
      subject: 'CHEMISTRY',
      classLevel: 9,
      board: 'icse',
      chapter: 'CH-2 (CHEMICAL CHANGES & REACTIONS)',
      duration: '00:24:50',
      viewsCount: 2110,
      orderNo: 3,
      isPublished: true,
      uploadedAt: '2026-05-20',
      batchId: 'batch-ix-icse-maths-sci',
      faculty: 'DINESH SINGH RAJPUT',
      tag: 'Uncategorized',
    },
    {
      id: 'lec-ix-che-02',
      title: 'LECTURE-2: CONDITIONS FOR CHEMICAL CHANGES',
      youtubeId: 'aB3cD4eF5gH',
      youtubeUrl: 'https://www.youtube.com/watch?v=aB3cD4eF5gH',
      subject: 'CHEMISTRY',
      classLevel: 9,
      board: 'icse',
      chapter: 'CH-2 (CHEMICAL CHANGES & REACTIONS)',
      duration: '00:25:30',
      viewsCount: 2480,
      orderNo: 2,
      isPublished: true,
      uploadedAt: '2026-05-19',
      batchId: 'batch-ix-icse-maths-sci',
      faculty: 'DINESH SINGH RAJPUT',
      tag: 'Uncategorized',
    },
    {
      id: 'lec-ix-che-01',
      title: 'LECTURE-1: INTRODUCTION TO CHEMICAL REACTIONS',
      youtubeId: 'iJ6kL7mN8oP',
      youtubeUrl: 'https://www.youtube.com/watch?v=iJ6kL7mN8oP',
      subject: 'CHEMISTRY',
      classLevel: 9,
      board: 'icse',
      chapter: 'CH-2 (CHEMICAL CHANGES & REACTIONS)',
      duration: '00:30:12',
      viewsCount: 2890,
      orderNo: 1,
      isPublished: true,
      uploadedAt: '2026-05-18',
      batchId: 'batch-ix-icse-maths-sci',
      faculty: 'DINESH SINGH RAJPUT',
      tag: 'Uncategorized',
    },
    {
      id: 'lec-ix-che-ch1-01',
      title: 'LECTURE-1: CHEMICAL SYMBOLS & VALENCY',
      youtubeId: 'qR9sT0uV1wX',
      youtubeUrl: 'https://www.youtube.com/watch?v=qR9sT0uV1wX',
      subject: 'CHEMISTRY',
      classLevel: 9,
      board: 'icse',
      chapter: 'CH-1 (THE LANGUAGE OF CHEMISTRY)',
      duration: '00:27:14',
      viewsCount: 1980,
      orderNo: 1,
      isPublished: true,
      uploadedAt: '2026-05-10',
      batchId: 'batch-ix-icse-maths-sci',
      faculty: 'DINESH SINGH RAJPUT',
      tag: 'Uncategorized',
    },
    {
      id: 'lec-ix-che-ch4-01',
      title: 'LECTURE-1: RUTHERFORD MODEL OF ATOM',
      youtubeId: 'yZ2aB3cD4eF',
      youtubeUrl: 'https://www.youtube.com/watch?v=yZ2aB3cD4eF',
      subject: 'CHEMISTRY',
      classLevel: 9,
      board: 'icse',
      chapter: 'CH-4 (ATOMIC STRUCTURE & CHEMICAL BONDING)',
      duration: '00:29:40',
      viewsCount: 1650,
      orderNo: 1,
      isPublished: true,
      uploadedAt: '2026-05-28',
      batchId: 'batch-ix-icse-maths-sci',
      faculty: 'DINESH SINGH RAJPUT',
      tag: 'Uncategorized',
    },
    {
      id: 'lec-ix-che-ch5-01',
      title: 'LECTURE-1: MENDELEEV PERIODIC TABLE',
      youtubeId: 'gH5iJ6kL7mN',
      youtubeUrl: 'https://www.youtube.com/watch?v=gH5iJ6kL7mN',
      subject: 'CHEMISTRY',
      classLevel: 9,
      board: 'icse',
      chapter: 'CH-5 (THE PERIODIC TABLE)',
      duration: '00:31:00',
      viewsCount: 1420,
      orderNo: 1,
      isPublished: true,
      uploadedAt: '2026-06-02',
      batchId: 'batch-ix-icse-maths-sci',
      faculty: 'DINESH SINGH RAJPUT',
      tag: 'Uncategorized',
    },
    {
      id: 'lec-ix-bio-ch1-01',
      title: 'LECTURE-1: SCOPE AND BRANCHES OF BIOLOGY',
      youtubeId: 'oP8qR9sT0uV',
      youtubeUrl: 'https://www.youtube.com/watch?v=oP8qR9sT0uV',
      subject: 'BIOLOGY',
      classLevel: 9,
      board: 'icse',
      chapter: 'CH-1 (INTRODUCING BIOLOGY)',
      duration: '00:25:10',
      viewsCount: 1210,
      orderNo: 1,
      isPublished: true,
      uploadedAt: '2026-05-12',
      batchId: 'batch-ix-icse-maths-sci',
      faculty: 'DINESH SINGH RAJPUT',
      tag: 'Uncategorized',
    },
    {
      id: 'lec-ix-bio-ch2-01',
      title: 'LECTURE-1: PLANT AND ANIMAL CELLS COMPARISON',
      youtubeId: 'wX1yZ2aB3cD',
      youtubeUrl: 'https://www.youtube.com/watch?v=wX1yZ2aB3cD',
      subject: 'BIOLOGY',
      classLevel: 9,
      board: 'icse',
      chapter: 'CH-2 (CELL: THE UNIT OF LIFE)',
      duration: '00:28:40',
      viewsCount: 1530,
      orderNo: 1,
      isPublished: true,
      uploadedAt: '2026-05-16',
      batchId: 'batch-ix-icse-maths-sci',
      faculty: 'DINESH SINGH RAJPUT',
      tag: 'Uncategorized',
    },
    {
      id: 'lec-ix-mat-ch4-01',
      title: 'LECTURE-1: ALGEBRAIC IDENTITIES & FORMULAE',
      youtubeId: 'eF4gH5iJ6kL',
      youtubeUrl: 'https://www.youtube.com/watch?v=eF4gH5iJ6kL',
      subject: 'MATHS',
      classLevel: 9,
      board: 'icse',
      chapter: 'CH-4 (EXPANSIONS)',
      duration: '00:30:15',
      viewsCount: 2340,
      orderNo: 1,
      isPublished: true,
      uploadedAt: '2026-05-14',
      batchId: 'batch-ix-icse-maths-sci',
      faculty: 'DINESH SINGH RAJPUT',
      tag: 'Uncategorized',
    },
    {
      id: 'lec-ix-mat-ch4-02',
      title: 'LECTURE-2: EX 4(A) EXERCISE DISCUSSION',
      youtubeId: 'mN7oP8qR9sT',
      youtubeUrl: 'https://www.youtube.com/watch?v=mN7oP8qR9sT',
      subject: 'MATHS',
      classLevel: 9,
      board: 'icse',
      chapter: 'CH-4 (EXPANSIONS)',
      duration: '00:33:45',
      viewsCount: 1980,
      orderNo: 2,
      isPublished: true,
      uploadedAt: '2026-05-17',
      batchId: 'batch-ix-icse-maths-sci',
      faculty: 'DINESH SINGH RAJPUT',
      tag: 'Uncategorized',
    },
    {
      id: 'lec-ix-mat-ch5-01',
      title: 'LECTURE-1: COMMON FACTORS & GROUPING METHOD',
      youtubeId: 'uV0wX1yZ2aB',
      youtubeUrl: 'https://www.youtube.com/watch?v=uV0wX1yZ2aB',
      subject: 'MATHS',
      classLevel: 9,
      board: 'icse',
      chapter: 'CH-5 (FACTORISATION)',
      duration: '00:27:50',
      viewsCount: 1870,
      orderNo: 1,
      isPublished: true,
      uploadedAt: '2026-05-25',
      batchId: 'batch-ix-icse-maths-sci',
      faculty: 'DINESH SINGH RAJPUT',
      tag: 'Uncategorized',
    },
    {
      id: 'lec-101',
      title: 'Relations & Functions - Lec 01: Types of Relations',
      youtubeId: 'W3s-p-c5q2Q',
      youtubeUrl: 'https://www.youtube.com/watch?v=W3s-p-c5q2Q',
      subject: 'Mathematics',
      classLevel: 12,
      board: 'cbse',
      chapter: 'Relations and Functions',
      duration: '52:14',
      viewsCount: 3840,
      orderNo: 1,
      isPublished: true,
      uploadedAt: '2026-09-02',
    },
    {
      id: 'lec-102',
      title: 'Relations & Functions - Lec 02: Equivalence Relations & Examples',
      youtubeId: 'g7h1BqV2W3E',
      youtubeUrl: 'https://www.youtube.com/watch?v=g7h1BqV2W3E',
      subject: 'Mathematics',
      classLevel: 12,
      board: 'cbse',
      chapter: 'Relations and Functions',
      duration: '48:30',
      viewsCount: 2950,
      orderNo: 2,
      isPublished: true,
      uploadedAt: '2026-09-05',
    },
    {
      id: 'lec-103',
      title: 'Inverse Trigonometric Functions - Principle Values & Graphs',
      youtubeId: 'kJ8m9L0p1Q2',
      youtubeUrl: 'https://www.youtube.com/watch?v=kJ8m9L0p1Q2',
      subject: 'Mathematics',
      classLevel: 12,
      board: 'cbse',
      chapter: 'Inverse Trigonometric Functions',
      duration: '59:05',
      viewsCount: 4120,
      orderNo: 3,
      isPublished: true,
      uploadedAt: '2026-09-12',
    },
    {
      id: 'lec-104',
      title: 'Matrices - Multiplication, Properties & Transpose Shortcuts',
      youtubeId: 'zX3vB1n9M2K',
      youtubeUrl: 'https://www.youtube.com/watch?v=zX3vB1n9M2K',
      subject: 'Mathematics',
      classLevel: 12,
      board: 'cbse',
      chapter: 'Matrices',
      duration: '44:18',
      viewsCount: 1890,
      orderNo: 4,
      isPublished: true,
      uploadedAt: '2026-09-20',
    },
    {
      id: 'lec-105',
      title: 'Quadratic Equations - Nature of Roots & Word Problems',
      youtubeId: 'pQ7wE9rT1Y4',
      youtubeUrl: 'https://www.youtube.com/watch?v=pQ7wE9rT1Y4',
      subject: 'Mathematics',
      classLevel: 10,
      board: 'cbse',
      chapter: 'Quadratic Equations',
      duration: '39:42',
      viewsCount: 5210,
      orderNo: 1,
      isPublished: true,
      uploadedAt: '2026-09-15',
    },
  ],

  resources: [
    {
      id: 'res-ix-mat-sel-4a',
      title: 'EX 4(A).pdf',
      type: 'solution',
      fileUrl: 'https://cdn.quick2learn.in/resources/icse-9-maths-ex4a.pdf',
      fileSize: '0.4 MB',
      filePages: 6,
      subject: 'MATHS SELINA SOLUTIONS',
      classLevel: 9,
      chapter: 'CHAPTER 4-(EXPANSIONS)',
      visibility: 'batch_only',
      batchTitle: 'IX ICSE ( 2026 - 2027 )',
      batchId: 'batch-ix-icse-maths-sci',
      folderName: 'MATHS SELINA SOLUTIONS',
      uploadedAt: '2026-05-24',
      downloadCount: 142,
      subtext: '0.4 MB • 24 May 2026 • PDF',
    },
    {
      id: 'res-ix-mat-sel-4b',
      title: 'EX 4(B).pdf',
      type: 'solution',
      fileUrl: 'https://cdn.quick2learn.in/resources/icse-9-maths-ex4b.pdf',
      fileSize: '0.5 MB',
      filePages: 8,
      subject: 'MATHS SELINA SOLUTIONS',
      classLevel: 9,
      chapter: 'CHAPTER 4-(EXPANSIONS)',
      visibility: 'batch_only',
      batchTitle: 'IX ICSE ( 2026 - 2027 )',
      batchId: 'batch-ix-icse-maths-sci',
      folderName: 'MATHS SELINA SOLUTIONS',
      uploadedAt: '2026-05-24',
      downloadCount: 118,
      subtext: '0.5 MB • 24 May 2026 • PDF',
    },
    {
      id: 'res-ix-mat-sel-4c',
      title: 'EX 4(C).pdf',
      type: 'solution',
      fileUrl: 'https://cdn.quick2learn.in/resources/icse-9-maths-ex4c.pdf',
      fileSize: '0.6 MB',
      filePages: 10,
      subject: 'MATHS SELINA SOLUTIONS',
      classLevel: 9,
      chapter: 'CHAPTER 4-(EXPANSIONS)',
      visibility: 'batch_only',
      batchTitle: 'IX ICSE ( 2026 - 2027 )',
      batchId: 'batch-ix-icse-maths-sci',
      folderName: 'MATHS SELINA SOLUTIONS',
      uploadedAt: '2026-05-24',
      downloadCount: 95,
      subtext: '0.6 MB • 24 May 2026 • PDF',
    },
    {
      id: 'res-ix-mat-sel-5a',
      title: 'EX 5(A).pdf',
      type: 'solution',
      fileUrl: 'https://cdn.quick2learn.in/resources/icse-9-maths-ex5a.pdf',
      fileSize: '0.4 MB',
      filePages: 7,
      subject: 'MATHS SELINA SOLUTIONS',
      classLevel: 9,
      chapter: 'CHAPTER 5-(FACTORISATION)',
      visibility: 'batch_only',
      batchTitle: 'IX ICSE ( 2026 - 2027 )',
      batchId: 'batch-ix-icse-maths-sci',
      folderName: 'MATHS SELINA SOLUTIONS',
      uploadedAt: '2026-05-25',
      downloadCount: 88,
      subtext: '0.4 MB • 25 May 2026 • PDF',
    },
    {
      id: 'res-ix-mat-sel-5b',
      title: 'EX 5(B).pdf',
      type: 'solution',
      fileUrl: 'https://cdn.quick2learn.in/resources/icse-9-maths-ex5b.pdf',
      fileSize: '0.5 MB',
      filePages: 9,
      subject: 'MATHS SELINA SOLUTIONS',
      classLevel: 9,
      chapter: 'CHAPTER 5-(FACTORISATION)',
      visibility: 'batch_only',
      batchTitle: 'IX ICSE ( 2026 - 2027 )',
      batchId: 'batch-ix-icse-maths-sci',
      folderName: 'MATHS SELINA SOLUTIONS',
      uploadedAt: '2026-05-25',
      downloadCount: 76,
      subtext: '0.5 MB • 25 May 2026 • PDF',
    },
    {
      id: 'res-ix-phy-sel-01',
      title: 'EX 1(A) SOLUTIONS.pdf',
      type: 'solution',
      fileUrl: 'https://cdn.quick2learn.in/resources/icse-9-phy-ex1a.pdf',
      fileSize: '0.8 MB',
      filePages: 12,
      subject: 'PHYSICS SELINA SOLUTIONS',
      classLevel: 9,
      chapter: 'CHAPTER 1-(MEASUREMENTS & EXPERIMENTATION)',
      visibility: 'batch_only',
      batchTitle: 'IX ICSE ( 2026 - 2027 )',
      batchId: 'batch-ix-icse-maths-sci',
      folderName: 'PHYSICS SELINA SOLUTIONS',
      uploadedAt: '2026-05-26',
      downloadCount: 130,
      subtext: '0.8 MB • 26 May 2026 • PDF',
    },
    {
      id: 'res-ix-bio-sel-01',
      title: 'CELL WORKBOOK & DIAGRAMS.pdf',
      type: 'solution',
      fileUrl: 'https://cdn.quick2learn.in/resources/icse-9-bio-ch2.pdf',
      fileSize: '1.4 MB',
      filePages: 18,
      subject: 'BIOLOGY SELINA SOLUTIONS',
      classLevel: 9,
      chapter: 'CHAPTER 2-(CELL: THE UNIT OF LIFE)',
      visibility: 'batch_only',
      batchTitle: 'IX ICSE ( 2026 - 2027 )',
      batchId: 'batch-ix-icse-maths-sci',
      folderName: 'BIOLOGY SELINA SOLUTIONS',
      uploadedAt: '2026-05-27',
      downloadCount: 104,
      subtext: '1.4 MB • 27 May 2026 • PDF',
    },
    {
      id: 'res-ix-che-sel-01',
      title: 'EX 2(A) & 2(B) SOLUTIONS.pdf',
      type: 'solution',
      fileUrl: 'https://cdn.quick2learn.in/resources/icse-9-che-ex2.pdf',
      fileSize: '0.9 MB',
      filePages: 14,
      subject: 'CHEMISTRY SELINA SOLUTIONS',
      classLevel: 9,
      chapter: 'CHAPTER 2-(CHEMICAL CHANGES & REACTIONS)',
      visibility: 'batch_only',
      batchTitle: 'IX ICSE ( 2026 - 2027 )',
      batchId: 'batch-ix-icse-maths-sci',
      folderName: 'CHEMISTRY SELINA SOLUTIONS',
      uploadedAt: '2026-05-28',
      downloadCount: 156,
      subtext: '0.9 MB • 28 May 2026 • PDF',
    },
    {
      id: 'res-201',
      title: 'Class XII Maths - Relations & Functions Complete Chapter Notes',
      type: 'notes',
      fileUrl: 'https://cdn.quick2learn.in/resources/maths-12-ch1-notes.pdf',
      fileSize: '3.4 MB',
      filePages: 18,
      subject: 'Mathematics',
      classLevel: 12,
      chapter: 'Relations and Functions',
      visibility: 'public',
      uploadedAt: '2026-09-02',
      downloadCount: 420,
    },
    {
      id: 'res-202',
      title: 'DPP 01: Equivalence Relations & Board Question Practice',
      type: 'dpp',
      fileUrl: 'https://cdn.quick2learn.in/resources/dpp-maths-12-01.pdf',
      fileSize: '1.2 MB',
      filePages: 6,
      subject: 'Mathematics',
      classLevel: 12,
      chapter: 'Relations and Functions',
      visibility: 'batch_only',
      batchTitle: 'Class XII CBSE Maths Target 100',
      uploadedAt: '2026-09-04',
      downloadCount: 29,
    },
    {
      id: 'res-203',
      title: 'Calculus & Algebra Master Formula Sheet (Dinesh Sir Exclusive)',
      type: 'formula_sheet',
      fileUrl: 'https://cdn.quick2learn.in/resources/maths-12-formula-sheet.pdf',
      fileSize: '2.1 MB',
      filePages: 12,
      subject: 'Mathematics',
      classLevel: 12,
      chapter: 'Entire Syllabus',
      visibility: 'public',
      uploadedAt: '2026-09-10',
      downloadCount: 940,
    },
    {
      id: 'res-204',
      title: 'Last 10 Years CBSE Board PYQs with Step Solutions (Matrices & Determinants)',
      type: 'pyq',
      fileUrl: 'https://cdn.quick2learn.in/resources/pyq-maths-matrices.pdf',
      fileSize: '4.8 MB',
      filePages: 24,
      subject: 'Mathematics',
      classLevel: 12,
      chapter: 'Matrices',
      visibility: 'public',
      uploadedAt: '2026-09-22',
      downloadCount: 610,
    },
    {
      id: 'res-205',
      title: 'Class X CBSE Maths Standard Sample Paper 2026 with Marking Scheme',
      type: 'solution',
      fileUrl: 'https://cdn.quick2learn.in/resources/maths-10-sample-paper.pdf',
      fileSize: '1.9 MB',
      filePages: 14,
      subject: 'Mathematics',
      classLevel: 10,
      chapter: 'Entire Syllabus',
      visibility: 'public',
      uploadedAt: '2026-09-25',
      downloadCount: 780,
    },
  ],

  questions: [
    {
      id: 'q-301',
      statement: 'Let R be a relation on the set Z of integers given by R = {(a, b) : 2 divides a - b}. Then the relation R is:',
      options: [
        'An Equivalence relation',
        'Reflexive and symmetric but not transitive',
        'Reflexive and transitive but not symmetric',
        'Symmetric only',
      ],
      correctOptionIndex: 0,
      subject: 'Mathematics',
      classLevel: 12,
      chapter: 'Relations and Functions',
      difficulty: 'medium',
      marks: 4,
      negativeMarks: 1,
      explanation: 'Since a - a = 0 is divisible by 2 for all a in Z, R is reflexive. If 2 divides a - b, then 2 divides -(a - b) = b - a, so R is symmetric. If 2 divides a - b and 2 divides b - c, then 2 divides (a - b) + (b - c) = a - c, so R is transitive. Therefore, R is an equivalence relation.',
      createdAt: '2026-09-01',
    },
    {
      id: 'q-302',
      statement: 'If A is a square matrix of order 3 and |A| = 5, then the value of |adj(A)| is:',
      options: ['5', '25', '125', '1/5'],
      correctOptionIndex: 1,
      subject: 'Mathematics',
      classLevel: 12,
      chapter: 'Determinants',
      difficulty: 'easy',
      marks: 4,
      negativeMarks: 1,
      explanation: 'For any square matrix of order n, |adj(A)| = |A|^(n - 1). Here n = 3 and |A| = 5, so |adj(A)| = 5^(3 - 1) = 5^2 = 25.',
      createdAt: '2026-09-08',
    },
    {
      id: 'q-303',
      statement: 'Find the principal value of sin^(-1)(-1/2):',
      options: ['-π/6', '5π/6', 'π/6', '-π/3'],
      correctOptionIndex: 0,
      subject: 'Mathematics',
      classLevel: 12,
      chapter: 'Inverse Trigonometric Functions',
      difficulty: 'easy',
      marks: 4,
      negativeMarks: 1,
      explanation: 'The principal branch of sin^(-1)(x) is [-π/2, π/2]. Since sin(-π/6) = -1/2, the principal value is -π/6.',
      createdAt: '2026-09-12',
    },
    {
      id: 'q-304',
      statement: 'If the roots of the equation kx^2 - 6x + 1 = 0 are real and equal, find the value of k:',
      options: ['k = 9', 'k = 6', 'k = 3', 'k = 12'],
      correctOptionIndex: 0,
      subject: 'Mathematics',
      classLevel: 10,
      chapter: 'Quadratic Equations',
      difficulty: 'medium',
      marks: 4,
      negativeMarks: 1,
      explanation: 'For real and equal roots, discriminant D = b^2 - 4ac = 0. Here b = -6, a = k, c = 1. So (-6)^2 - 4(k)(1) = 0 => 36 - 4k = 0 => k = 9.',
      createdAt: '2026-09-18',
    },
  ],

  tests: [
    {
      id: 'test-401',
      title: 'Class XII Maths - Chapter 1 & 2 Unit Assessment',
      subject: 'Mathematics',
      classLevel: 12,
      chapters: ['Relations and Functions', 'Inverse Trigonometric Functions'],
      durationMinutes: 60,
      totalMarks: 40,
      passingMarks: 14,
      questionsCount: 10,
      scheduledStart: '2026-10-24T10:00:00Z',
      scheduledEnd: '2026-10-24T22:00:00Z',
      status: 'upcoming',
      isPublished: true,
      submissionsCount: 0,
      averageScore: 0,
    },
    {
      id: 'test-402',
      title: 'Class XII CBSE Term 1 Full Syllabus Mock 01',
      subject: 'Mathematics',
      classLevel: 12,
      chapters: ['Relations and Functions', 'Matrices', 'Determinants', 'Continuity & Differentiability'],
      durationMinutes: 90,
      totalMarks: 80,
      passingMarks: 27,
      questionsCount: 20,
      scheduledStart: '2026-10-15T09:00:00Z',
      scheduledEnd: '2026-10-15T18:00:00Z',
      status: 'completed',
      isPublished: true,
      submissionsCount: 28,
      averageScore: 64.5,
      submissions: [
        {
          studentId: 'stud-ayush',
          studentName: 'Ayush Agarwal',
          score: 76,
          totalMarks: 80,
          submittedAt: '2026-10-15T11:45:00Z',
          status: 'evaluated',
        },
        {
          studentId: 'stud-shreya',
          studentName: 'Shreya Sharma',
          score: 72,
          totalMarks: 80,
          submittedAt: '2026-10-15T12:10:00Z',
          status: 'evaluated',
        },
        {
          studentId: 'stud-rohit',
          studentName: 'Rohit Verma',
          score: 58,
          totalMarks: 80,
          submittedAt: '2026-10-15T12:05:00Z',
          status: 'evaluated',
        },
      ],
    },
  ],

  students: [
    {
      id: 'stud-01',
      userId: 'user-ayush',
      fullName: 'Ayush Agarwal',
      phone: '+919876543299',
      email: 'ayush.agarwal@example.com',
      classLevel: 12,
      board: 'cbse',
      school: 'St. Dominic School',
      parentName: 'Mr. Rajesh Agarwal',
      parentPhone: '+919876543200',
      parentInviteCode: 'AYU26M',
      attendanceRate: 94,
      enrolledBatchIds: ['batch-xii-cbse-maths'],
      enrolledBatchNames: ['Class XII CBSE Maths Target 100'],
      feeStatus: 'paid',
      joinedAt: '2026-04-10',
    },
    {
      id: 'stud-02',
      userId: 'user-shreya',
      fullName: 'Shreya Sharma',
      phone: '+919876543110',
      email: 'shreya.sharma@example.com',
      classLevel: 11,
      board: 'cbse',
      school: 'Delhi Public School',
      parentName: 'Mrs. Sunita Sharma',
      parentPhone: '+919876543100',
      parentInviteCode: 'SHR26F',
      attendanceRate: 88,
      enrolledBatchIds: ['batch-xi-cbse-maths'],
      enrolledBatchNames: ['Class XI CBSE Foundation & Calculus'],
      feeStatus: 'due',
      joinedAt: '2026-04-15',
    },
    {
      id: 'stud-03',
      userId: 'user-rohit',
      fullName: 'Rohit Verma',
      phone: '+919876543456',
      email: 'rohit.verma@example.com',
      classLevel: 12,
      board: 'cbse',
      school: 'Army Public School',
      parentName: 'Col. V.K. Verma',
      parentPhone: '+919876543400',
      parentInviteCode: 'ROH26A',
      attendanceRate: 91,
      enrolledBatchIds: ['batch-xii-cbse-maths', 'batch-xii-che-icse'],
      enrolledBatchNames: ['Class XII CBSE Maths Target 100', 'Class XII ISC Chemistry Super 30'],
      feeStatus: 'overdue',
      joinedAt: '2026-04-12',
    },
    {
      id: 'stud-04',
      userId: 'user-tanvi',
      fullName: 'Tanvi Goyal',
      phone: '+919876543889',
      email: 'tanvi.goyal@example.com',
      classLevel: 10,
      board: 'cbse',
      school: 'Kanha Makhan Public School',
      parentName: 'Mr. Mukesh Goyal',
      parentPhone: '+919876543800',
      parentInviteCode: 'TAN26K',
      attendanceRate: 97,
      enrolledBatchIds: ['batch-x-cbse-board'],
      enrolledBatchNames: ['Class X CBSE Board Excellence'],
      feeStatus: 'paid',
      joinedAt: '2026-04-01',
    },
  ],

  payments: [
    {
      id: 'pay-001',
      receiptNo: 'Q2L-2026-000101',
      studentId: 'stud-01',
      studentName: 'Ayush Agarwal',
      batchTitle: 'Class XII CBSE Maths Target 100',
      amount: 11000,
      paymentMethod: 'upi',
      status: 'paid',
      paidAt: '2026-10-05T11:20:00Z',
      notes: 'Instalment 2 paid via GPay',
    },
    {
      id: 'pay-002',
      receiptNo: 'Q2L-2026-000102',
      studentId: 'stud-04',
      studentName: 'Tanvi Goyal',
      batchTitle: 'Class X CBSE Board Excellence',
      amount: 15000,
      paymentMethod: 'cash',
      status: 'paid',
      paidAt: '2026-10-08T16:45:00Z',
      notes: 'Full yearly fee submitted in cash to Dinesh Sir at institute',
    },
    {
      id: 'pay-003',
      receiptNo: 'Q2L-2026-000103',
      studentId: 'stud-02',
      studentName: 'Shreya Sharma',
      batchTitle: 'Class XI CBSE Foundation & Calculus',
      amount: 9000,
      paymentMethod: 'razorpay',
      status: 'paid',
      paidAt: '2026-09-15T18:10:00Z',
      notes: 'Instalment 1 paid online',
    },
  ],

  feeDues: [
    {
      id: 'due-01',
      studentId: 'stud-03',
      studentName: 'Rohit Verma',
      batchTitle: 'Class XII CBSE Maths Target 100',
      amount: 11000,
      dueDate: '2026-10-10',
      status: 'overdue',
    },
    {
      id: 'due-02',
      studentId: 'stud-02',
      studentName: 'Shreya Sharma',
      batchTitle: 'Class XI CBSE Foundation & Calculus',
      amount: 9000,
      dueDate: '2026-10-25',
      status: 'due',
    },
  ],

  doubts: [
    {
      id: 'dbt-501',
      studentId: 'stud-01',
      studentName: 'Ayush Agarwal',
      batchTitle: 'Class XII CBSE Maths Target 100',
      subject: 'Mathematics',
      questionText: 'Sir, in question 14 of NCERT Miscellaneous Exercise on Chapter 1, how do we show that f is both one-one and onto when domain is (-1, 1)?',
      status: 'resolved',
      createdAt: '2026-10-18T16:20:00Z',
      replies: [
        {
          id: 'rep-01',
          authorName: 'Dinesh Sir',
          authorRole: 'teacher',
          text: 'Consider x / (1 + |x|). Break it into two cases: x >= 0 and x < 0. Differentiate both branches to show derivative is strictly positive, hence strictly increasing (one-one). Then take limits as x approaches -1 and 1 to show range is (-1, 1), proving onto.',
          createdAt: '2026-10-18T18:05:00Z',
        },
      ],
    },
    {
      id: 'dbt-502',
      studentId: 'stud-03',
      studentName: 'Rohit Verma',
      batchTitle: 'Class XII CBSE Maths Target 100',
      subject: 'Mathematics',
      questionText: 'Sir, will question of symmetric and skew-symmetric matrix decomposition come as 4 marks or 6 marks in this year board pattern?',
      status: 'open',
      createdAt: '2026-10-21T19:40:00Z',
      replies: [],
    },
  ],

  announcements: [
    {
      id: 'ann-601',
      title: 'Diwali Break & Doubt Clearing Camp Schedule',
      body: 'Offline classes will observe break from Oct 31 to Nov 03. Special online doubt sessions for Class XII Board students will be held on Nov 02 at 11:00 AM via live stream.',
      priority: 'urgent',
      targetAudience: 'All Batches (Classes IX–XII)',
      createdAt: '2026-10-19T10:00:00Z',
      authorName: 'Dinesh Singh Rajput',
    },
    {
      id: 'ann-602',
      title: 'Class XII CBSE Maths Unit Test 01 on Saturday',
      body: 'All students must bring their graph sheets and scientific geometry sets for Saturday assessment test at 10:00 AM sharp.',
      priority: 'normal',
      targetAudience: 'Class XII CBSE Maths Target 100',
      createdAt: '2026-10-17T12:00:00Z',
      authorName: 'Quick2Learn Admin Office',
    },
  ],

  enquiries: [
    {
      id: 'enq-701',
      studentName: 'Prashant Dixit',
      parentName: 'Dr. R.K. Dixit',
      phone: '+919412001122',
      email: 'dr.dixit@example.com',
      classLevel: 12,
      board: 'cbse',
      message: 'Looking for Class XII CBSE Maths target board coaching under Dinesh Sir. Please share available batch timings and fee structure.',
      status: 'new',
      createdAt: '2026-10-22T06:15:00Z',
      notes: 'Direct enquiry from Quick2Learn website admissions page.',
    },
    {
      id: 'enq-702',
      studentName: 'Megha Bansal',
      parentName: 'Suresh Bansal',
      phone: '+919412334455',
      classLevel: 10,
      board: 'icse',
      message: 'Interested in Class X ICSE Chemistry & Biology foundation coaching with Namita Maam.',
      status: 'contacted',
      createdAt: '2026-10-20T11:45:00Z',
      notes: 'Called parent; invited for trial class on Sunday 9:00 AM.',
    },
    {
      id: 'enq-703',
      studentName: 'Kunal Chauhan',
      phone: '+919897112233',
      classLevel: 11,
      board: 'cbse',
      message: 'Want to join Class XI Calculus batch offline.',
      status: 'enrolled',
      createdAt: '2026-10-16T15:20:00Z',
      notes: 'Enrolled in Class XI Foundation batch.',
    },
  ],

  assignments: [
    {
      id: 'asg-01',
      batchId: 'batch-xii-cbse-maths',
      batchTitle: 'Class XII CBSE Maths Target 100',
      title: 'Ch-07 Integrals: Integration by Parts & Partial Fractions DPP',
      subject: 'Mathematics',
      classLevel: 12,
      chapter: 'Integrals',
      dueDate: '2026-10-26',
      totalMarks: 25,
      instructions: 'Solve all 10 subjective problems step-by-step with proper integration constants. Submit neat handwritten PDF or photos.',
      submissionsCount: 2,
      createdAt: '2026-10-20T10:00:00Z',
      submissions: [
        {
          id: 'sub-01',
          studentId: 'stud-01',
          studentName: 'Ayush Agarwal',
          submittedAt: '2026-10-21T18:30:00Z',
          status: 'evaluated',
          marksObtained: 24,
          remarks: 'Excellent step notation in substitution!',
        },
        {
          id: 'sub-02',
          studentId: 'stud-03',
          studentName: 'Rohit Verma',
          submittedAt: '2026-10-22T08:15:00Z',
          status: 'submitted',
          remarks: 'Under review',
        },
      ],
    },
    {
      id: 'asg-02',
      batchId: 'batch-x-cbse-board',
      batchTitle: 'Class X CBSE Board Excellence',
      title: 'Ch-08 Trigonometry: Heights & Distances Word Problems',
      subject: 'Mathematics',
      classLevel: 10,
      chapter: 'Some Applications of Trigonometry',
      dueDate: '2026-10-27',
      totalMarks: 20,
      instructions: 'Draw neat diagrams for angle of elevation and depression questions. Show full trigonometric ratio calculations.',
      submissionsCount: 1,
      createdAt: '2026-10-21T11:00:00Z',
      submissions: [
        {
          id: 'sub-03',
          studentId: 'stud-04',
          studentName: 'Tanvi Goyal',
          submittedAt: '2026-10-22T09:40:00Z',
          status: 'evaluated',
          marksObtained: 20,
          remarks: 'Flawless diagrams and calculations.',
        },
      ],
    },
    {
      id: 'asg-03',
      batchId: 'batch-xii-che-icse',
      batchTitle: 'Class XII ISC Chemistry Super 30',
      title: 'Ch-03 Electrochemistry: Nernst Equation & Gibbs Free Energy',
      subject: 'Chemistry',
      classLevel: 12,
      chapter: 'Electrochemistry',
      dueDate: '2026-10-28',
      totalMarks: 30,
      instructions: 'Solve numerical problems on cell EMF and equilibrium constant. Pay attention to SI units.',
      submissionsCount: 0,
      createdAt: '2026-10-22T07:00:00Z',
      submissions: [],
    },
  ],

  liveClasses: [
    {
      id: 'live-ix-trial',
      batchId: 'batch-ix-icse-maths-sci',
      batchTitle: 'IX ICSE ( 2026 - 2027 )',
      title: 'TRIAL',
      subject: 'Maths & Science',
      classLevel: 9,
      faculty: 'Dinesh Singh Rajput',
      platform: 'zoom',
      meetingUrl: 'https://zoom.us/j/92834910021?pwd=q2ltrial',
      meetingId: '928 3491 0021',
      passcode: 'Q2L2026',
      scheduledAt: '2026-10-22T20:33:00',
      duration: '08:33 PM - 08:48 PM',
      isLive: true,
      createdAt: '2026-10-22T19:00:00Z',
    },
    {
      id: 'live-01',
      batchId: 'batch-xii-cbse-maths',
      batchTitle: 'Class XII CBSE Maths Target 100',
      title: 'Dinesh Sir Special: Definite Integrals Properties Masterclass',
      subject: 'Mathematics',
      classLevel: 12,
      faculty: 'Dinesh Singh Rajput',
      platform: 'zoom',
      meetingUrl: 'https://zoom.us/j/9876543210?pwd=quick2learnmaths',
      meetingId: '987 654 3210',
      passcode: 'DINESH12',
      scheduledAt: '2026-10-22T17:00:00',
      duration: '75 min',
      isLive: true,
      createdAt: '2026-10-21T12:00:00Z',
    },
    {
      id: 'live-02',
      batchId: 'batch-xii-che-icse',
      batchTitle: 'Class XII ISC Chemistry Super 30',
      title: 'Namita Maam: Chemical Kinetics Rate Laws & Mechanisms',
      subject: 'Chemistry',
      classLevel: 12,
      faculty: 'Namita Singh Rajput',
      platform: 'youtube',
      meetingUrl: 'https://youtube.com/live/q2l_kinetics_demo',
      scheduledAt: '2026-10-23T18:00:00',
      duration: '60 min',
      isLive: false,
      createdAt: '2026-10-21T14:00:00Z',
    },
  ],

  attendanceRecords: [
    {
      id: 'att-01',
      batchId: 'batch-xii-cbse-maths',
      date: '2026-10-22',
      records: {
        'stud-01': 'P',
        'stud-03': 'P',
      },
      savedAt: '2026-10-22T11:00:00Z',
    },
    {
      id: 'att-02',
      batchId: 'batch-xii-cbse-maths',
      date: '2026-10-20',
      records: {
        'stud-01': 'P',
        'stud-03': 'A',
      },
      savedAt: '2026-10-20T17:30:00Z',
    },
  ],

  courses: [
    {
      id: 'course-ix-icse-maths-sci',
      title: 'Class 9 ICSE Complete Maths & Science',
      subtitle: 'Comprehensive Selina Solutions & Board Preparation',
      description: 'Master Class 9 ICSE Mathematics and Science with Dinesh Singh Rajput & expert faculty. Includes full video lectures for all chapters, exercise-by-exercise Selina solutions in PDF, regular chapter tests, and live doubt clearing sessions.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=600&q=80',
      classLevel: 9,
      targetClass: 9,
      board: 'icse',
      subjects: ['Maths', 'Physics', 'Chemistry', 'Biology'],
      price: 16999,
      originalPrice: 16999,
      discountedPrice: 12999,
      validityDays: 365,
      validity: '365 Days Access',
      badge: 'Bestseller',
      features: [
        'Complete Selina Solutions PDF',
        'Chapter-wise Recorded Video Lectures',
        'Live Class Access & Recordings',
        'Weekly Assessment & Chapter Tests',
        'Direct Teacher Doubt Support',
      ],
      enrolledCount: 28,
      isPublished: true,
      status: 'published',
      faculty: 'DINESH SINGH RAJPUT',
      rating: 4.9,
      reviewsCount: 114,
      batchId: 'batch-ix-icse-maths-sci',
      createdAt: '2026-04-20T10:00:00Z',
    },
    {
      id: 'course-x-cbse-board-booster',
      title: 'Class 10 CBSE Board 2027 Full Booster',
      subtitle: 'Maths & Science Target 100/100',
      description: 'The proven Class 10 CBSE program covering NCERT, exemplar, and past 10-year board questions. In-depth concept mastery and speed-building tests.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=600&q=80',
      classLevel: 10,
      targetClass: 10,
      board: 'cbse',
      subjects: ['Maths', 'Science'],
      price: 18999,
      originalPrice: 18999,
      discountedPrice: 14999,
      validityDays: 365,
      validity: 'Till Boards 2027',
      badge: 'Popular',
      features: [
        'Complete NCERT & Exemplar Solutions',
        '100+ Chapter Video Lectures',
        'Formula Sheet & Quick Revision Notes',
        'Full Length Mock Board Exams',
      ],
      enrolledCount: 42,
      isPublished: true,
      status: 'published',
      faculty: 'DINESH SINGH RAJPUT',
      rating: 4.95,
      reviewsCount: 186,
      batchId: 'batch-x-cbse-board',
      createdAt: '2026-04-01T10:00:00Z',
    },
    {
      id: 'course-selina-solutions-mastery',
      title: 'Selina ICSE Mathematics & Science Solutions Master Pack',
      subtitle: 'Complete Exercise Solutions for Classes 9 & 10',
      description: 'Instant access to chapter-by-chapter Selina Concise Mathematics and Science solutions with step-by-step explanations, downloadable offline PDFs, and formula cheat sheets.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80',
      classLevel: 9,
      targetClass: 9,
      board: 'icse',
      subjects: ['Maths', 'Physics', 'Chemistry', 'Biology'],
      price: 5000,
      originalPrice: 5000,
      discountedPrice: 3499,
      validityDays: 365,
      validity: '365 Days Access',
      badge: 'PDF Pack',
      features: [
        'All Exercises (Expansions, Factorisation, etc.)',
        'High-Resolution Downloadable PDFs',
        'Step-by-step ICSE Marking Scheme',
        'Offline Study Access',
      ],
      enrolledCount: 65,
      isPublished: true,
      status: 'published',
      faculty: 'DINESH SINGH RAJPUT',
      rating: 4.88,
      reviewsCount: 92,
      createdAt: '2026-04-15T10:00:00Z',
    },
    {
      id: 'course-xi-jee-neet-foundation',
      title: 'Class 11 Science & JEE/NEET Foundation',
      subtitle: 'Calculus, Mechanics & Physical Chemistry',
      description: 'Bridge the gap from Class 10 to 11 with rigorous foundation coaching designed for CBSE Board, JEE Main & Advanced, and NEET.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=600&q=80',
      classLevel: 11,
      targetClass: 11,
      board: 'cbse',
      subjects: ['Physics', 'Chemistry', 'Mathematics'],
      price: 32000,
      originalPrice: 32000,
      discountedPrice: 24999,
      validityDays: 365,
      validity: '1 Year Program',
      badge: 'Advanced',
      features: [
        'JEE / NEET Question Banks & PYQs',
        'Daily Practice Problems (DPPs)',
        'Weekly Sunday Test Series',
        '1-on-1 Mentorship Sessions',
      ],
      enrolledCount: 31,
      isPublished: true,
      status: 'published',
      faculty: 'Dinesh Sir & Senior Faculty',
      rating: 4.92,
      reviewsCount: 78,
      createdAt: '2026-04-10T10:00:00Z',
    },
  ],

  chats: [
    {
      id: 'chat-namita-singh-rajput',
      type: 'direct',
      title: 'NAMITA SINGH RAJPUT',
      subtitle: 'Faculty • Chemistry & Biology',
      facultyName: 'NAMITA SINGH RAJPUT',
      unreadCount: 0,
      lastMessage: 'You : hi',
      lastMessageTime: 'Yesterday',
      messages: [
        {
          id: 'msg-nam-01',
          senderId: 'stud-01',
          senderName: 'Arjun Singh Rajput',
          senderRole: 'student',
          text: 'hi',
          createdAt: '2026-10-21T18:00:00Z',
        },
        {
          id: 'msg-nam-02',
          senderId: 'faculty-namita',
          senderName: 'NAMITA SINGH RAJPUT (Faculty)',
          senderRole: 'teacher',
          text: 'Hello Arjun! How can I assist you today? Feel free to ask any Chemistry or Biology questions.',
          createdAt: '2026-10-21T18:05:00Z',
        },
      ],
      createdAt: '2026-04-10T10:00:00Z',
    },
    {
      id: 'chat-xii-maths-term2',
      type: 'batch_group',
      title: 'XII MATHS (TERM-2)',
      subtitle: 'Class 12 CBSE & ICSE • 35 Students',
      batchId: 'batch-xii-maths',
      facultyName: 'DINESH SINGH RAJPUT',
      unreadCount: 1,
      lastMessage: 'Differential equations practice sheet uploaded.',
      lastMessageTime: 'Today',
      messages: [
        {
          id: 'msg-xii-01',
          senderId: 'faculty-dinesh',
          senderName: 'Dinesh Singh Rajput (Faculty)',
          senderRole: 'teacher',
          text: 'Welcome to Term-2 Maths discussion group. Calculus and Vectors worksheets will be shared here.',
          createdAt: '2026-04-01T10:00:00Z',
        },
        {
          id: 'msg-xii-02',
          senderId: 'faculty-dinesh',
          senderName: 'Dinesh Singh Rajput (Faculty)',
          senderRole: 'teacher',
          text: 'Differential equations practice sheet uploaded.',
          createdAt: '2026-10-22T10:30:00Z',
        },
      ],
      createdAt: '2026-04-01T10:00:00Z',
    },
    {
      id: 'chat-xi-dummy',
      type: 'batch_group',
      title: 'XI DUMMY',
      subtitle: 'Class 11 Science • 24 Students',
      batchId: 'batch-xi-dummy',
      facultyName: 'DINESH SINGH RAJPUT',
      unreadCount: 0,
      lastMessage: 'Next revision session on Trigonometry scheduled.',
      lastMessageTime: 'Yesterday',
      messages: [
        {
          id: 'msg-xi-01',
          senderId: 'faculty-dinesh',
          senderName: 'Dinesh Singh Rajput (Faculty)',
          senderRole: 'teacher',
          text: 'Next revision session on Trigonometry scheduled.',
          createdAt: '2026-10-21T11:00:00Z',
        },
      ],
      createdAt: '2026-04-01T10:00:00Z',
    },
    {
      id: 'chat-9-icse-chemistry',
      type: 'batch_group',
      title: '9 ICSE CHEMISTRY (2022-23)',
      subtitle: 'Class 9 ICSE Chemistry • 18 Students',
      facultyName: 'NAMITA SINGH RAJPUT',
      unreadCount: 0,
      lastMessage: 'Please prepare Chapter 3 Chemical Bonding notes.',
      lastMessageTime: '3 days ago',
      messages: [
        {
          id: 'msg-9chem-01',
          senderId: 'faculty-namita',
          senderName: 'NAMITA SINGH RAJPUT (Faculty)',
          senderRole: 'teacher',
          text: 'Please prepare Chapter 3 Chemical Bonding notes.',
          createdAt: '2026-10-19T10:00:00Z',
        },
      ],
      createdAt: '2026-04-01T10:00:00Z',
    },
    {
      id: 'chat-9-icse-biology',
      type: 'batch_group',
      title: '9 ICSE BIOLOGY (2022-23)',
      subtitle: 'Class 9 ICSE Biology • 20 Students',
      facultyName: 'NAMITA SINGH RAJPUT',
      unreadCount: 0,
      lastMessage: 'Plant physiology diagrams must be submitted by Friday.',
      lastMessageTime: '4 days ago',
      messages: [
        {
          id: 'msg-9bio-01',
          senderId: 'faculty-namita',
          senderName: 'NAMITA SINGH RAJPUT (Faculty)',
          senderRole: 'teacher',
          text: 'Plant physiology diagrams must be submitted by Friday.',
          createdAt: '2026-10-18T10:00:00Z',
        },
      ],
      createdAt: '2026-04-01T10:00:00Z',
    },
    {
      id: 'chat-batch-ix-icse',
      type: 'batch_group',
      title: 'IX ICSE Batch Discussion',
      subtitle: 'Class 9 Maths & Science • 28 Students',
      batchId: 'batch-ix-icse-maths-sci',
      facultyName: 'DINESH SINGH RAJPUT',
      unreadCount: 0,
      lastMessage: 'All questions from Ex 2(C) are now uploaded with solutions.',
      lastMessageTime: '2026-10-22T14:30:00Z',
      messages: [
        {
          id: 'msg-01',
          senderId: 'faculty-dinesh',
          senderName: 'Dinesh Singh Rajput (Faculty)',
          senderRole: 'teacher',
          text: 'Welcome students! In this group we will discuss lecture doubts, assignments, and test updates.',
          createdAt: '2026-05-20T10:00:00Z',
        },
        {
          id: 'msg-02',
          senderId: 'stud-01',
          senderName: 'Aarav Sharma',
          senderRole: 'student',
          text: 'Sir, when is the next Selina Chapter 4 Expansions practice sheet test?',
          createdAt: '2026-10-21T16:15:00Z',
        },
        {
          id: 'msg-03',
          senderId: 'faculty-dinesh',
          senderName: 'Dinesh Singh Rajput (Faculty)',
          senderRole: 'teacher',
          text: 'The test will be live this Saturday at 05:00 PM. Please review EX 4(A) and EX 4(B) notes in the Study Material tab.',
          createdAt: '2026-10-21T16:45:00Z',
        },
        {
          id: 'msg-04',
          senderId: 'faculty-dinesh',
          senderName: 'Dinesh Singh Rajput (Faculty)',
          senderRole: 'teacher',
          text: 'All questions from Ex 2(C) are now uploaded with solutions.',
          createdAt: '2026-10-22T14:30:00Z',
        },
      ],
      createdAt: '2026-04-22T10:00:00Z',
    },
    {
      id: 'chat-batch-x-cbse',
      type: 'batch_group',
      title: 'Class 10 CBSE Board Group',
      subtitle: 'Maths & Science Excellence • 42 Students',
      batchId: 'batch-x-cbse-board',
      facultyName: 'DINESH SINGH RAJPUT',
      unreadCount: 1,
      lastMessage: 'Tomorrow class will cover Quadratic Equations word problems.',
      lastMessageTime: '2026-10-22T12:00:00Z',
      messages: [
        {
          id: 'msg-10',
          senderId: 'faculty-dinesh',
          senderName: 'Dinesh Singh Rajput (Faculty)',
          senderRole: 'teacher',
          text: 'Tomorrow class will cover Quadratic Equations word problems.',
          createdAt: '2026-10-22T12:00:00Z',
        },
      ],
      createdAt: '2026-04-01T10:00:00Z',
    },
    {
      id: 'chat-direct-aarav',
      type: 'direct',
      title: 'Aarav Sharma',
      subtitle: 'Class 9 ICSE • Roll #12',
      studentId: 'stud-01',
      studentName: 'Aarav Sharma',
      facultyName: 'Dinesh Singh Rajput',
      unreadCount: 0,
      lastMessage: 'Thank you Sir, the concept in Ex 2(C) is clear now!',
      lastMessageTime: '2026-10-22T15:10:00Z',
      messages: [
        {
          id: 'msg-21',
          senderId: 'stud-01',
          senderName: 'Aarav Sharma',
          senderRole: 'student',
          text: 'Sir, could you please check if my step in Expansions formula is valid for ICSE?',
          createdAt: '2026-10-22T14:50:00Z',
        },
        {
          id: 'msg-22',
          senderId: 'faculty-dinesh',
          senderName: 'Dinesh Singh Rajput',
          senderRole: 'admin',
          text: 'Yes Aarav, using (a+b+c)^2 identity directly is standard and awards full marks. Good work.',
          createdAt: '2026-10-22T15:05:00Z',
        },
        {
          id: 'msg-23',
          senderId: 'stud-01',
          senderName: 'Aarav Sharma',
          senderRole: 'student',
          text: 'Thank you Sir, the concept in Ex 2(C) is clear now!',
          createdAt: '2026-10-22T15:10:00Z',
        },
      ],
      createdAt: '2026-05-01T10:00:00Z',
    },
    {
      id: 'chat-announcements',
      type: 'announcements',
      title: 'Quick2Learn Official Broadcast',
      subtitle: 'All Batches & Institute Notices',
      facultyName: 'Quick2Learn Administration',
      unreadCount: 0,
      lastMessage: 'Diwali break schedule and revision assignments posted.',
      lastMessageTime: '2026-10-22T09:00:00Z',
      messages: [
        {
          id: 'msg-30',
          senderId: 'admin-inst',
          senderName: 'Quick2Learn Administration',
          senderRole: 'admin',
          text: 'Welcome to Quick2Learn! Live classes, tests, and study notes are synchronized here.',
          createdAt: '2026-04-01T08:00:00Z',
        },
        {
          id: 'msg-31',
          senderId: 'admin-inst',
          senderName: 'Quick2Learn Administration',
          senderRole: 'admin',
          text: 'Diwali break schedule and revision assignments posted in the Announcements tab.',
          createdAt: '2026-10-22T09:00:00Z',
        },
      ],
      createdAt: '2026-04-01T08:00:00Z',
    },
  ],
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
