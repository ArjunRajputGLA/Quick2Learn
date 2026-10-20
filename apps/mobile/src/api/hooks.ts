import {
  useQuery,
  useMutation,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  appConfigSchema,
  type AppConfig,
  meResponseSchema,
  type MeResponse,
  type UpdateMeInput,
  deviceTokenResponseSchema,
  type DeviceTokenResponse,
  type RegisterDeviceInput,
  paginatedNotificationsSchema,
  type PaginatedNotifications,
  unreadCountResponseSchema,
  type UnreadCountResponse,
  markNotificationsReadResponseSchema,
  type MarkNotificationsReadResponse,
  type MarkNotificationsReadInput,
  type ApiOnboardingInput,
  linkedStudentsResponseSchema,
  type LinkedStudentsResponse,
  type ClaimInviteCodeInput,
  linkedStudentSchema,
  type LinkedStudent,
  parentInviteCodeResponseSchema,
  type ParentInviteCodeResponse,
  parentHomeResponseSchema,
  type ParentHomeResponse,
  homeResponseSchema,
  type HomeResponse,
  learnClassesResponseSchema,
  type LearnClassesResponse,
  learnChaptersResponseSchema,
  type LearnChaptersResponse,
  chapterDetailResponseSchema,
  type ChapterDetailResponse,
  lectureDetailResponseSchema,
  type LectureDetailResponse,
  progressBatchResponseSchema,
  type ProgressBatchResponse,
  type ProgressBatchInput,
  freeResourcesResponseSchema,
  type FreeResourcesResponse,
  librarySearchResponseSchema,
  type LibrarySearchResponse,
  batchesMineResponseSchema,
  type BatchesMineResponse,
  batchDetailResponseSchema,
  type BatchDetailResponse,
  batchTimetableResponseSchema,
  type BatchTimetableResponse,
  batchAnnouncementsResponseSchema,
  type BatchAnnouncementsResponse,
  batchJoinResponseSchema,
  type BatchJoinResponse,
  batchContentResponseSchema,
  type BatchContentResponse,
  batchChapterContentResponseSchema,
  type BatchChapterContentResponse,
  contentFileUrlResponseSchema,
  type ContentFileUrlResponse,
  batchLiveResponseSchema,
  type BatchLiveResponse,
  liveJoinResponseSchema,
  type LiveJoinResponse,
  attendanceMonthResponseSchema,
  type AttendanceMonthResponse,
  attendanceSummaryResponseSchema,
  type AttendanceSummaryResponse,
  testsListResponseSchema,
  type TestsListResponse,
  type TestListItem,
  testDetailResponseSchema,
  type TestDetailResponse,
  type TestDetail,
  startAttemptResponseSchema,
  type StartAttemptResponse,
  saveAnswerItemSchema,
  type SaveAnswerItem,
  batchSaveAnswersInputSchema,
  type BatchSaveAnswersInput,
  batchSaveAnswersResponseSchema,
  type BatchSaveAnswersResponse,
  submitAttemptResponseSchema,
  type SubmitAttemptResponse,
  testResultResponseSchema,
  type TestResultResponse,
  studentPerformanceResponseSchema,
  type StudentPerformanceResponse,
  doubtsListResponseSchema,
  type DoubtsListResponse,
  doubtThreadResponseSchema,
  type DoubtThreadResponse,
  type CreateDoubtInput,
  type ReplyDoubtInput,
  type DoubtItem,
  type DoubtMessageItem,
  presignedDoubtUploadsResponseSchema,
  type PresignedDoubtUploadsResponse,
  feesResponseSchema,
  type FeesResponse,
  studentQuickStatsSchema,
  type StudentQuickStats,
  type SendPhoneOtpInput,
  type VerifyPhoneOtpInput,
  type ConfirmDeleteAccountInput,
  resultsAndTestimonialsResponseSchema,
  type ResultsAndTestimonialsResponse,
  teacherTodaySessionsResponseSchema,
  type TeacherTodaySessionsResponse,
  type TeacherTodaySession,
  teacherBatchesResponseSchema,
  type TeacherBatchesResponse,
  teacherBatchStudentsResponseSchema,
  type TeacherBatchStudentsResponse,
  type TeacherBatchStudent,
  type TeacherSaveAttendanceInput,
  teacherSaveAttendanceResponseSchema,
  type TeacherSaveAttendanceResponse,
  type TeacherPostAnnouncementInput,
  teacherPostAnnouncementResponseSchema,
  type TeacherPostAnnouncementResponse,
  teacherBatchChaptersResponseSchema,
  type TeacherBatchChaptersResponse,
  type TeacherQuickUploadInput,
  teacherQuickUploadResponseSchema,
  type TeacherQuickUploadResponse,
  type TeacherPresignedUrlInput,
  teacherPresignedUrlResponseSchema,
  type TeacherPresignedUrlResponse,
} from "@quick2learn/shared";
import * as SecureStore from "expo-secure-store";
import { apiClient } from "./client";

export const DEMO_MODE_STORAGE_KEY = "q2l_demo_mode";
export const ACTIVE_USER_STORAGE_KEY = "q2l_active_user";

export const DEMO_USER_ME: MeResponse = {
  user: {
    id: "demo-student-user-id",
    email: "student.demo@quick2learn.in",
    name: "Student Demo",
    image: null,
    phoneNumber: "+919876543210",
    phoneNumberVerified: true,
    emailVerified: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  profile: {
    id: "demo-student-profile-id",
    userId: "demo-student-user-id",
    fullName: "Student Demo",
    phone: "+919876543210",
    role: "student",
    classLevel: 10,
    board: "cbse",
    school: "Quick2Learn High",
    parentName: null,
    parentPhone: null,
    city: "Bhopal",
    avatarUrl: null,
    onboardedAt: "2026-01-01T00:00:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  role: "student",
  linkedStudents: [],
};

export const DEMO_ADMIN_ME: MeResponse = {
  user: {
    id: "demo-admin-user-id",
    email: "admin@quick2learn.in",
    name: "Admin Quick2Learn",
    image: null,
    phoneNumber: "+919800000001",
    phoneNumberVerified: true,
    emailVerified: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  profile: {
    id: "demo-admin-profile-id",
    userId: "demo-admin-user-id",
    fullName: "Dinesh Sir (Administrator)",
    phone: "+919800000001",
    role: "admin",
    classLevel: null,
    board: null,
    school: "Quick2Learn Institute",
    parentName: null,
    parentPhone: null,
    city: "Bhopal",
    avatarUrl: null,
    onboardedAt: "2026-01-01T00:00:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  role: "admin",
  linkedStudents: [],
};

export const DEMO_TEACHER_ME: MeResponse = {
  user: {
    id: "demo-teacher-user-id",
    email: "teacher@quick2learn.in",
    name: "Dinesh Sir",
    image: null,
    phoneNumber: "+919800000002",
    phoneNumberVerified: true,
    emailVerified: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  profile: {
    id: "demo-teacher-profile-id",
    userId: "demo-teacher-user-id",
    fullName: "Dinesh Sir (Senior Faculty)",
    phone: "+919800000002",
    role: "teacher",
    classLevel: null,
    board: null,
    school: "Quick2Learn Coaching",
    parentName: null,
    parentPhone: null,
    city: "Bhopal",
    avatarUrl: null,
    onboardedAt: "2026-01-01T00:00:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  role: "teacher",
  linkedStudents: [],
};

export const DEMO_PARENT_ME: MeResponse = {
  user: {
    id: "demo-parent-user-id",
    email: "parent.demo@quick2learn.in",
    name: "Parent Demo",
    image: null,
    phoneNumber: "+919800000003",
    phoneNumberVerified: true,
    emailVerified: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  profile: {
    id: "demo-parent-profile-id",
    userId: "demo-parent-user-id",
    fullName: "Mr. Demo Parent",
    phone: "+919800000003",
    role: "parent",
    classLevel: null,
    board: null,
    school: null,
    parentName: null,
    parentPhone: null,
    city: "Bhopal",
    avatarUrl: null,
    onboardedAt: "2026-01-01T00:00:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  role: "parent",
  linkedStudents: [
    {
      id: "demo-student-profile-id",
      userId: "demo-student-user-id",
      fullName: "Student Demo",
      classLevel: 10,
      board: "cbse",
      school: "Quick2Learn High",
      avatarUrl: null,
    },
  ],
};

export const DEMO_HOME_DATA: HomeResponse = {
  header: {
    firstName: "Student",
    fullName: "Student Demo",
    classLevel: 10,
    board: "cbse",
    chipLabel: "Class 10 • CBSE",
    unreadNotificationsCount: 1,
  },
  liveClass: null,
  continueWatching: [],
  todayClasses: [
    {
      batchId: "demo-batch-1",
      batchTitle: "Class 10 Board Excellence 2026",
      subjectName: "Mathematics",
      facultyName: "Dinesh Sir",
      timeText: "5:00 PM - 6:30 PM",
      mode: "online",
      locationText: "Live Interactive Session",
      route: "/(app)/(tabs)/batches",
    },
  ],
  upcomingTests: [
    {
      id: "demo-test-1",
      title: "Quadratic Equations & Polynomials Test",
      batchTitle: "Class 10 Board Excellence",
      subjectName: "Mathematics",
      dateText: "Tomorrow, 6:00 PM",
      totalMarks: 40,
      route: "/(app)/(tabs)/tests",
    },
  ],
  recentResults: [],
  feeAlert: null,
  announcements: [
    {
      id: "demo-ann-1",
      title: "Welcome to Quick2Learn Mobile!",
      body: "Explore video lectures, live classes, chapter notes, and chapter tests.",
      isPinned: true,
      publishedAt: "2026-01-01T00:00:00.000Z",
      dateFormatted: "Today",
      route: "/(app)/notifications",
    },
  ],
  banners: [],
  freeLectures: [],
  enrolledBatchesCount: 1,
  shareApp: {
    title: "Quick2Learn - Learn Maths with Dinesh Sir",
    message: "Join Quick2Learn for Class 9-12 CBSE/ICSE Maths coaching!",
    url: "https://quick2learn.in",
  },
};

export const DEMO_STUDENT_STATS: StudentQuickStats = {
  attendancePercentage: 92,
  testsTaken: 8,
  lecturesCompleted: 14,
};

export const DEMO_BATCHES_DATA: BatchesMineResponse = {
  enrolled: [
    {
      id: "demo-batch-1",
      slug: "class-10-board-excellence",
      title: "Class 10 Board Excellence 2026",
      subtitle: "Comprehensive CBSE Mathematics Course",
      classLevel: 10,
      board: "cbse",
      mode: "online",
      teacherName: "Dinesh Sir",
      teacherAvatarUrl: null,
      subjectName: "Mathematics",
      progressPercentage: 45,
      nextClass: {
        title: "Quadratic Equations - Part 2",
        timeFormatted: "Today, 5:00 PM",
        weekday: new Date().getDay(),
        roomOrLinkNote: "Zoom Live Classroom",
        isToday: true,
        isLive: false,
        startsInMinutes: 120,
      },
      enrolledAt: "2026-01-01T00:00:00.000Z",
    },
  ],
  pendingRequests: [],
};

export const DEMO_LEARN_CLASSES: LearnClassesResponse = {
  classes: [
    {
      classLevel: 9,
      label: "Class 9",
      slug: "class-9",
      totalLectures: 42,
      subjects: [
        { id: "sub-9-math", name: "Mathematics", slug: "mathematics", lectureCount: 24 },
        { id: "sub-9-sci", name: "Science", slug: "science", lectureCount: 18 },
      ],
    },
    {
      classLevel: 10,
      label: "Class 10",
      slug: "class-10",
      totalLectures: 64,
      subjects: [
        { id: "sub-10-math", name: "Mathematics", slug: "mathematics", lectureCount: 36 },
        { id: "sub-10-sci", name: "Science", slug: "science", lectureCount: 28 },
      ],
    },
    {
      classLevel: 11,
      label: "Class 11",
      slug: "class-11",
      totalLectures: 42,
      subjects: [
        { id: "sub-11-math", name: "Mathematics", slug: "mathematics", lectureCount: 42 },
      ],
    },
    {
      classLevel: 12,
      label: "Class 12",
      slug: "class-12",
      totalLectures: 48,
      subjects: [
        { id: "sub-12-math", name: "Mathematics", slug: "mathematics", lectureCount: 48 },
      ],
    },
  ],
};

export const queryKeys = {
  appConfig: ["app", "config"] as const,
  me: ["me"] as const,
  home: ["home"] as const,
  notifications: (limit?: number) => ["notifications", limit] as const,
  unreadCount: ["notifications", "unread-count"] as const,
  parentStudents: ["parent", "students"] as const,
  studentInviteCode: ["student", "invite-code"] as const,
  learnClasses: ["learn", "classes"] as const,
  learnChapters: (classLevel: number, subject: string) =>
    ["learn", "chapters", classLevel, subject] as const,
  chapterDetail: (id: string) => ["learn", "chapter", id] as const,
  lectureDetail: (id: string) => ["learn", "lecture", id] as const,
  librarySearch: (q: string, classLevel?: number, subject?: string, type?: string) =>
    ["learn", "search", q, classLevel, subject, type] as const,
  freeResources: (classLevel?: number, subject?: string) =>
    ["resources", "free", classLevel, subject] as const,
  batchesMine: ["batches", "mine"] as const,
  batchDetail: (id: string) => ["batches", "detail", id] as const,
  batchTimetable: (batchId: string) => ["batches", "timetable", batchId] as const,
  batchAnnouncements: (batchId: string) => ["batches", "announcements", batchId] as const,
  batchContent: (batchId: string) => ["batches", "content", batchId] as const,
  batchChapterContent: (batchId: string, chapterId: string) =>
    ["batches", "chapter-content", batchId, chapterId] as const,
  batchLive: (batchId: string) => ["batches", "live", batchId] as const,
  attendance: (studentId?: string, batchId?: string, month?: string) =>
    ["attendance", studentId, batchId, month] as const,
  attendanceSummary: (studentId?: string, batchId?: string) =>
    ["attendance", "summary", studentId, batchId] as const,
  tests: (params?: { batchId?: string; status?: string; chapterId?: string }) =>
    ["tests", params] as const,
  testDetail: (id: string) => ["tests", "detail", id] as const,
  testResult: (attemptId: string) => ["tests", "result", attemptId] as const,
  studentPerformance: (studentId?: string) => ["tests", "performance", studentId] as const,
  doubtsMine: (status?: string) => ["doubts", "mine", status] as const,
  doubtThread: (id: string) => ["doubts", "thread", id] as const,
  fees: (studentId?: string) => ["fees", studentId || "mine"] as const,
  studentStats: (studentId?: string) => ["student-stats", studentId || "mine"] as const,
  resultsTestimonials: ["results-testimonials"] as const,
  teacherTodaySessions: ["teacher", "today-sessions"] as const,
  teacherBatches: ["teacher", "batches"] as const,
  teacherBatchStudents: (batchId: string, date?: string, sessionId?: string | null) =>
    ["teacher", "batch-students", batchId, date, sessionId] as const,
  teacherBatchChapters: (batchId: string) => ["teacher", "batch-chapters", batchId] as const,
  teacherDoubts: (status?: string) => ["teacher", "doubts", status] as const,
};

/**
 * Hook to retrieve aggregated home screen data (cached, refreshes on focus & pull-to-refresh).
 */
export function useHome() {
  return useQuery<HomeResponse>({
    queryKey: queryKeys.home,
    queryFn: async () => {
      const isDemo = await SecureStore.getItemAsync(DEMO_MODE_STORAGE_KEY).catch(() => null);
      if (isDemo === "true") {
        return DEMO_HOME_DATA;
      }
      try {
        return await apiClient.get("/home", { schema: homeResponseSchema });
      } catch (err) {
        if (isDemo === "true") {
          return DEMO_HOME_DATA;
        }
        throw err;
      }
    },
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to retrieve remote app configuration, versions, and feature flags.
 */
export function useAppConfig() {
  return useQuery<AppConfig>({
    queryKey: queryKeys.appConfig,
    queryFn: () => apiClient.get("/app/config", { schema: appConfigSchema }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to retrieve the authenticated user profile, role, and linked students.
 */
export function useMe() {
  return useQuery<MeResponse>({
    queryKey: queryKeys.me,
    queryFn: async () => {
      const activeUserJson = await SecureStore.getItemAsync(ACTIVE_USER_STORAGE_KEY).catch(() => null);
      if (activeUserJson) {
        try {
          return JSON.parse(activeUserJson);
        } catch {}
      }
      const isDemo = await SecureStore.getItemAsync(DEMO_MODE_STORAGE_KEY).catch(() => null);
      if (isDemo === "true") {
        return DEMO_USER_ME;
      }
      try {
        return await apiClient.get("/me", { schema: meResponseSchema });
      } catch (err) {
        if (isDemo === "true") {
          return DEMO_USER_ME;
        }
        throw err;
      }
    },
    staleTime: 60 * 1000,
    retry: 1,
  });
}

/**
 * Mutation hook to update the user profile (whitelisted fields only).
 */
export function useUpdateMe() {
  const queryClient = useQueryClient();

  return useMutation<MeResponse, Error, UpdateMeInput>({
    mutationFn: (input: UpdateMeInput) =>
      apiClient.patch("/me", input, { schema: meResponseSchema }),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.me, updated);
      queryClient.invalidateQueries({ queryKey: queryKeys.me });
    },
  });
}

/**
 * Mutation hook to register an Expo Push device token.
 */
export function useRegisterDevice() {
  return useMutation<DeviceTokenResponse, Error, RegisterDeviceInput>({
    mutationFn: (input: RegisterDeviceInput) =>
      apiClient.post("/devices", input, { schema: deviceTokenResponseSchema }),
  });
}

/**
 * Mutation hook to unregister a device token.
 */
export function useUnregisterDevice() {
  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: (deviceId: string) => apiClient.delete(`/devices/${deviceId}`),
  });
}

/**
 * Infinite query hook for paginated user inbox notifications.
 */
export function useNotifications(options?: { limit?: number }) {
  const limit = options?.limit ?? 20;

  return useInfiniteQuery<PaginatedNotifications, Error>({
    queryKey: queryKeys.notifications(limit),
    queryFn: ({ pageParam }) =>
      apiClient.get<PaginatedNotifications>("/notifications", {
        schema: paginatedNotificationsSchema,
        params: {
          limit,
          ...(pageParam ? { cursor: pageParam as string } : {}),
        },
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

/**
 * Hook to retrieve unread notification count.
 */
export function useUnreadNotificationsCount() {
  return useQuery<UnreadCountResponse>({
    queryKey: queryKeys.unreadCount,
    queryFn: () =>
      apiClient.get("/notifications/unread-count", {
        schema: unreadCountResponseSchema,
      }),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

/**
 * Mutation hook to mark notifications as read.
 */
export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation<
    MarkNotificationsReadResponse,
    Error,
    MarkNotificationsReadInput
  >({
    mutationFn: (input: MarkNotificationsReadInput) =>
      apiClient.post("/notifications/read", input, {
        schema: markNotificationsReadResponseSchema,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.unreadCount });
    },
  });
}

/**
 * Mutation hook to submit student or parent onboarding.
 */
export function useOnboarding() {
  const queryClient = useQueryClient();

  return useMutation<MeResponse, Error, ApiOnboardingInput>({
    mutationFn: (input: ApiOnboardingInput) =>
      apiClient.post("/onboarding", input, { schema: meResponseSchema }),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.me, updated);
      queryClient.invalidateQueries({ queryKey: queryKeys.me });
    },
  });
}

/**
 * Query hook for linked students (for parent accounts).
 */
export function useParentStudents() {
  return useQuery<LinkedStudentsResponse>({
    queryKey: queryKeys.parentStudents,
    queryFn: () =>
      apiClient.get("/parent/students", { schema: linkedStudentsResponseSchema }),
  });
}

/**
 * Query hook for comprehensive Parent Home dashboard.
 */
export function useParentHome(studentId?: string | null) {
  return useQuery<ParentHomeResponse>({
    queryKey: [...queryKeys.parentStudents, "home", studentId || "default"],
    queryFn: () =>
      apiClient.get(
        studentId ? `/parent/home?studentId=${encodeURIComponent(studentId)}` : "/parent/home",
        { schema: parentHomeResponseSchema }
      ),
  });
}

/**
 * Query hook for a child's assigned tests and attempts in read-only mode.
 */
export function useChildTests(studentId?: string | null, batchId?: string) {
  const queryParams = new URLSearchParams();
  if (studentId) queryParams.set("studentId", studentId);
  if (batchId) queryParams.set("batchId", batchId);
  const qStr = queryParams.toString();

  return useQuery<TestsListResponse>({
    queryKey: ["tests", "child", studentId || "default", batchId || "all"],
    queryFn: () =>
      apiClient.get(qStr ? `/tests?${qStr}` : "/tests", {
        schema: testsListResponseSchema,
      }),
  });
}

/**
 * Mutation hook for parents to claim a student invite code.
 */
export function useClaimInviteCode() {
  const queryClient = useQueryClient();

  return useMutation<{ student: LinkedStudent }, Error, ClaimInviteCodeInput>({
    mutationFn: (input: ClaimInviteCodeInput) =>
      apiClient.post("/parent/link", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.parentStudents });
      queryClient.invalidateQueries({ queryKey: queryKeys.me });
    },
  });
}

/**
 * Query hook to retrieve or generate active student parent invite code.
 */
export function useStudentInviteCode() {
  return useQuery<ParentInviteCodeResponse>({
    queryKey: queryKeys.studentInviteCode,
    queryFn: () =>
      apiClient.get("/student/invite-code", {
        schema: parentInviteCodeResponseSchema,
      }),
  });
}

/**
 * Mutation hook to explicitly regenerate student parent invite code.
 */
export function useGenerateStudentInviteCode() {
  const queryClient = useQueryClient();

  return useMutation<ParentInviteCodeResponse, Error, void>({
    mutationFn: () =>
      apiClient.post("/student/invite-code", {}, {
        schema: parentInviteCodeResponseSchema,
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.studentInviteCode, data);
    },
  });
}

/**
 * Hook to retrieve class levels and subjects with lecture counts.
 */
export function useLearnClasses() {
  return useQuery<LearnClassesResponse>({
    queryKey: queryKeys.learnClasses,
    queryFn: async () => {
      const isDemo = await SecureStore.getItemAsync(DEMO_MODE_STORAGE_KEY).catch(() => null);
      if (isDemo === "true") {
        return DEMO_LEARN_CLASSES;
      }
      try {
        return await apiClient.get("/learn/classes", {
          schema: learnClassesResponseSchema,
        });
      } catch (err) {
        if (isDemo === "true") {
          return DEMO_LEARN_CLASSES;
        }
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to retrieve chapters for a given class & subject, with watch progress.
 */
export function useLearnChapters(classLevel: number, subject: string) {
  return useQuery<LearnChaptersResponse>({
    queryKey: queryKeys.learnChapters(classLevel, subject),
    queryFn: () =>
      apiClient.get("/learn/chapters", {
        schema: learnChaptersResponseSchema,
        params: { class: classLevel, subject },
      }),
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to retrieve a chapter's lectures and free PDF notes.
 */
export function useChapterDetail(chapterId: string) {
  return useQuery<ChapterDetailResponse>({
    queryKey: queryKeys.chapterDetail(chapterId),
    queryFn: () =>
      apiClient.get(`/learn/chapters/${chapterId}`, {
        schema: chapterDetailResponseSchema,
      }),
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to retrieve lecture video player details, parsed timestamps, up-next, and notes.
 */
export function useLectureDetail(lectureId: string) {
  return useQuery<LectureDetailResponse>({
    queryKey: queryKeys.lectureDetail(lectureId),
    queryFn: () =>
      apiClient.get(`/lectures/${lectureId}`, {
        schema: lectureDetailResponseSchema,
      }),
    staleTime: 30 * 1000,
  });
}

/**
 * Mutation hook to batch-sync video/content watch progress (every 10s & on exit).
 */
export function useSaveProgress() {
  const queryClient = useQueryClient();

  return useMutation<ProgressBatchResponse, Error, ProgressBatchInput>({
    mutationFn: (input: ProgressBatchInput) =>
      apiClient.post("/progress", input, {
        schema: progressBatchResponseSchema,
      }),
    onSuccess: () => {
      // Invalidate chapter list and home continue watching
      queryClient.invalidateQueries({ queryKey: ["learn", "chapters"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.home });
    },
  });
}

/**
 * Hook for full-text library search categorized as Lectures, Chapters, Notes.
 */
export function useLibrarySearch(
  q: string,
  classLevel?: number,
  subject?: string,
  type?: string
) {
  return useQuery<LibrarySearchResponse>({
    queryKey: queryKeys.librarySearch(q, classLevel, subject, type),
    queryFn: () =>
      apiClient.get("/search", {
        schema: librarySearchResponseSchema,
        params: {
          q,
          ...(classLevel ? { class: classLevel } : {}),
          ...(subject ? { subject } : {}),
          ...(type ? { type } : {}),
        },
      }),
    enabled: q.trim().length > 0,
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to fetch free downloadable PDF notes and resources.
 */
export function useFreeResources(classLevel?: number, subject?: string) {
  return useQuery<FreeResourcesResponse>({
    queryKey: queryKeys.freeResources(classLevel, subject),
    queryFn: () =>
      apiClient.get("/resources/free", {
        schema: freeResourcesResponseSchema,
        params: {
          ...(classLevel ? { class: classLevel } : {}),
          ...(subject ? { subject } : {}),
        },
      }),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch student's enrolled batches and pending join requests.
 */
export function useStudentBatches() {
  return useQuery<BatchesMineResponse>({
    queryKey: queryKeys.batchesMine,
    queryFn: async () => {
      const isDemo = await SecureStore.getItemAsync(DEMO_MODE_STORAGE_KEY).catch(() => null);
      if (isDemo === "true") {
        return DEMO_BATCHES_DATA;
      }
      try {
        return await apiClient.get("/batches/mine", { schema: batchesMineResponseSchema });
      } catch (err) {
        if (isDemo === "true") {
          return DEMO_BATCHES_DATA;
        }
        throw err;
      }
    },
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to fetch batch overview, teachers, subjects, next class, and latest announcements.
 */
export function useBatchDetail(id: string) {
  return useQuery<BatchDetailResponse>({
    queryKey: queryKeys.batchDetail(id),
    queryFn: () => apiClient.get(`/batches/${id}`, { schema: batchDetailResponseSchema }),
    staleTime: 60 * 1000,
    enabled: Boolean(id),
  });
}

/**
 * Hook to fetch weekly timetable slots for a batch.
 */
export function useBatchTimetable(batchId: string) {
  return useQuery<BatchTimetableResponse>({
    queryKey: queryKeys.batchTimetable(batchId),
    queryFn: () => apiClient.get(`/batches/${batchId}/timetable`, { schema: batchTimetableResponseSchema }),
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(batchId),
  });
}

/**
 * Hook to fetch batch announcements with attachments.
 */
export function useBatchAnnouncements(batchId: string) {
  return useQuery<BatchAnnouncementsResponse>({
    queryKey: queryKeys.batchAnnouncements(batchId),
    queryFn: () => apiClient.get(`/batches/${batchId}/announcements`, { schema: batchAnnouncementsResponseSchema }),
    staleTime: 2 * 60 * 1000,
    enabled: Boolean(batchId),
  });
}

/**
 * Hook to submit a batch join request using 6-character code or QR scan.
 */
export function useJoinBatch() {
  const queryClient = useQueryClient();
  return useMutation<BatchJoinResponse, Error, string>({
    mutationFn: (code: string) =>
      apiClient.post("/batches/join", { code }, { schema: batchJoinResponseSchema }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.batchesMine });
      queryClient.invalidateQueries({ queryKey: queryKeys.home });
    },
  });
}

/**
 * Hook to fetch batch content organized by subjects and chapters with progress and counts.
 */
export function useBatchContent(batchId: string) {
  return useQuery<BatchContentResponse>({
    queryKey: queryKeys.batchContent(batchId),
    queryFn: () =>
      apiClient.get(`/batches/${batchId}/content`, {
        schema: batchContentResponseSchema,
      }),
    staleTime: 60 * 1000,
    enabled: Boolean(batchId),
  });
}

/**
 * Hook to fetch batch chapter lectures and notes grouped by section with progress.
 */
export function useBatchChapterContent(batchId: string, chapterId: string) {
  return useQuery<BatchChapterContentResponse>({
    queryKey: queryKeys.batchChapterContent(batchId, chapterId),
    queryFn: () =>
      apiClient.get(`/batches/${batchId}/chapters/${chapterId}`, {
        schema: batchChapterContentResponseSchema,
      }),
    staleTime: 60 * 1000,
    enabled: Boolean(batchId && chapterId),
  });
}

/**
 * Helper to fetch a 15-minute presigned URL for a PDF content item.
 * Strictly checks enrollment on backend (returns 403 Forbidden if not enrolled).
 */
export async function getContentFilePresignedUrl(contentId: string): Promise<string> {
  const res = await apiClient.get<ContentFileUrlResponse>(`/content/${contentId}/file`, {
    schema: contentFileUrlResponseSchema,
  });
  return res.url;
}

/**
 * Hook to retrieve batch live class sessions (live now, next upcoming, recent recordings).
 */
export function useBatchLive(batchId: string) {
  return useQuery<BatchLiveResponse>({
    queryKey: queryKeys.batchLive(batchId),
    queryFn: () =>
      apiClient.get(`/batches/${batchId}/live`, {
        schema: batchLiveResponseSchema,
      }),
    staleTime: 30 * 1000,
    enabled: Boolean(batchId),
    refetchInterval: 60 * 1000, // poll periodically for live status changes
  });
}

/**
 * Hook to record join event and mark attendance.
 */
export function useJoinLiveSession() {
  const queryClient = useQueryClient();

  return useMutation<LiveJoinResponse, Error, string>({
    mutationFn: (sessionId: string) =>
      apiClient.post(`/live/${sessionId}/join`, {}, {
        schema: liveJoinResponseSchema,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["batches", "live"] });
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}

/**
 * Hook to retrieve monthly student attendance records & percentages.
 */
export function useAttendance(studentId?: string, batchId?: string, month?: string) {
  return useQuery<AttendanceMonthResponse>({
    queryKey: queryKeys.attendance(studentId, batchId, month),
    queryFn: () =>
      apiClient.get("/attendance", {
        params: {
          studentId: studentId || undefined,
          batchId: batchId || undefined,
          month: month || undefined,
        },
        schema: attendanceMonthResponseSchema,
      }),
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to retrieve student attendance overall summary.
 */
export function useAttendanceSummary(studentId?: string, batchId?: string) {
  return useQuery<AttendanceSummaryResponse>({
    queryKey: queryKeys.attendanceSummary(studentId, batchId),
    queryFn: () =>
      apiClient.get("/attendance/summary", {
        params: {
          studentId: studentId || undefined,
          batchId: batchId || undefined,
        },
        schema: attendanceSummaryResponseSchema,
      }),
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to retrieve available tests (live, upcoming, completed, missed, or practice tests).
 */
export function useAvailableTests(params?: {
  batchId?: string;
  status?: string;
  chapterId?: string;
}) {
  return useQuery<TestsListResponse>({
    queryKey: queryKeys.tests(params),
    queryFn: async () => {
      const isDemo = await SecureStore.getItemAsync(DEMO_MODE_STORAGE_KEY).catch(() => null);
      if (isDemo === "true") {
        return { tests: [] };
      }
      try {
        return await apiClient.get("/tests", {
          params: {
            ...(params?.batchId ? { batchId: params.batchId } : {}),
            ...(params?.status ? { status: params.status } : {}),
            ...(params?.chapterId ? { chapterId: params.chapterId } : {}),
          },
          schema: testsListResponseSchema,
        });
      } catch (err) {
        if (isDemo === "true") {
          return { tests: [] };
        }
        throw err;
      }
    },
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to fetch detailed metadata and syllabus for a test (intro screen).
 */
export function useTestDetail(id: string) {
  return useQuery<TestDetailResponse>({
    queryKey: queryKeys.testDetail(id),
    queryFn: () =>
      apiClient.get(`/tests/${id}`, {
        schema: testDetailResponseSchema,
      }),
    staleTime: 60 * 1000,
    enabled: Boolean(id),
  });
}

/**
 * Hook to start or resume a test attempt. Returns server deadline and sanitized questions.
 */
export function useStartTestAttempt() {
  const queryClient = useQueryClient();
  return useMutation<StartAttemptResponse, Error, string>({
    mutationFn: (testId: string) =>
      apiClient.post(`/tests/${testId}/attempts`, {}, {
        schema: startAttemptResponseSchema,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tests"] });
    },
  });
}

/**
 * Hook to batch save student test answers to the backend.
 */
export function useSaveTestAnswers() {
  return useMutation<
    BatchSaveAnswersResponse,
    Error,
    { attemptId: string; answers: SaveAnswerItem[] }
  >({
    mutationFn: ({ attemptId, answers }) =>
      apiClient.put(`/attempts/${attemptId}/answers`, { answers }, {
        schema: batchSaveAnswersResponseSchema,
      }),
  });
}

/**
 * Hook to submit and grade a test attempt on the server.
 */
export function useSubmitTestAttempt() {
  const queryClient = useQueryClient();
  return useMutation<SubmitAttemptResponse, Error, string>({
    mutationFn: (attemptId: string) =>
      apiClient.post(`/attempts/${attemptId}/submit`, {}, {
        schema: submitAttemptResponseSchema,
      }),
    onSuccess: (_, attemptId) => {
      queryClient.invalidateQueries({ queryKey: ["tests"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.testResult(attemptId) });
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.home });
    },
  });
}

/**
 * Hook to retrieve graded test results, score, rank, breakdown, and solutions (if allowed).
 */
export function useTestResult(attemptId: string) {
  return useQuery<TestResultResponse>({
    queryKey: queryKeys.testResult(attemptId),
    queryFn: () =>
      apiClient.get(`/attempts/${attemptId}/result`, {
        schema: testResultResponseSchema,
      }),
    staleTime: 60 * 1000,
    enabled: Boolean(attemptId),
  });
}

/**
 * Hook to retrieve student performance across all tests (Profile & Parent view).
 */
export function useStudentPerformance(studentId?: string) {
  return useQuery<StudentPerformanceResponse>({
    queryKey: queryKeys.studentPerformance(studentId),
    queryFn: () =>
      apiClient.get("/performance", {
        params: studentId ? { studentId } : undefined,
        schema: studentPerformanceResponseSchema,
      }),
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to retrieve the calling student's doubts list.
 */
export function useStudentDoubts(status?: string) {
  return useQuery<DoubtsListResponse>({
    queryKey: queryKeys.doubtsMine(status),
    queryFn: async () => {
      const isDemo = await SecureStore.getItemAsync(DEMO_MODE_STORAGE_KEY).catch(() => null);
      if (isDemo === "true") {
        return { doubts: [], openCount: 0 };
      }
      try {
        return await apiClient.get("/doubts", {
          params: status ? { status } : undefined,
          schema: doubtsListResponseSchema,
        });
      } catch (err) {
        if (isDemo === "true") {
          return { doubts: [], openCount: 0 };
        }
        throw err;
      }
    },
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to retrieve the complete thread of a doubt with messages and attachments.
 */
export function useDoubtThread(id: string) {
  return useQuery<DoubtThreadResponse>({
    queryKey: queryKeys.doubtThread(id),
    queryFn: () =>
      apiClient.get(`/doubts/${id}`, {
        schema: doubtThreadResponseSchema,
      }),
    staleTime: 10 * 1000,
    enabled: Boolean(id),
  });
}

/**
 * Hook to create a new doubt (enforces max 5 open doubts rule).
 */
export function useCreateDoubt() {
  const queryClient = useQueryClient();
  return useMutation<{ doubt: DoubtItem }, Error, CreateDoubtInput>({
    mutationFn: (input) => apiClient.post("/doubts", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doubts"] });
    },
  });
}

/**
 * Hook to reply to an existing doubt thread.
 */
export function useReplyDoubt(doubtId: string) {
  const queryClient = useQueryClient();
  return useMutation<{ message: DoubtMessageItem; doubt: DoubtItem }, Error, ReplyDoubtInput>({
    mutationFn: (input) => apiClient.post(`/doubts/${doubtId}/messages`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.doubtThread(doubtId) });
      queryClient.invalidateQueries({ queryKey: ["doubts"] });
    },
  });
}

/**
 * Hook to close a doubt.
 */
export function useCloseDoubt(doubtId: string) {
  const queryClient = useQueryClient();
  return useMutation<{ doubt: DoubtItem }, Error, void>({
    mutationFn: () => apiClient.post(`/doubts/${doubtId}/close`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.doubtThread(doubtId) });
      queryClient.invalidateQueries({ queryKey: ["doubts"] });
    },
  });
}

/**
 * Hook to mark a doubt answer as helpful ("This solved it") and close it.
 */
export function useMarkDoubtHelpful(doubtId: string) {
  const queryClient = useQueryClient();
  return useMutation<{ doubt: DoubtItem }, Error, void>({
    mutationFn: () => apiClient.post(`/doubts/${doubtId}/helpful`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.doubtThread(doubtId) });
      queryClient.invalidateQueries({ queryKey: ["doubts"] });
    },
  });
}

/**
 * Hook to request presigned PUT upload URLs for doubt image attachments.
 */
export function usePresignedDoubtUploads() {
  return useMutation<
    PresignedDoubtUploadsResponse,
    Error,
    { files: Array<{ filename: string; contentType: string; sizeBytes?: number }> }
  >({
    mutationFn: (input) =>
      apiClient.post("/doubts/presigned-urls", input, {
        schema: presignedDoubtUploadsResponseSchema,
      }),
  });
}

/**
 * Hook to fetch student fees, dues schedule, and payment receipt history.
 */
export function useFees(studentId?: string) {
  return useQuery<FeesResponse>({
    queryKey: queryKeys.fees(studentId),
    queryFn: () =>
      apiClient.get(
        `/fees${studentId ? `?studentId=${encodeURIComponent(studentId)}` : ""}`,
        { schema: feesResponseSchema }
      ),
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to fetch student quick stats (attendance %, tests taken, lectures completed).
 */
export function useStudentQuickStats(studentId?: string) {
  return useQuery<StudentQuickStats>({
    queryKey: queryKeys.studentStats(studentId),
    queryFn: async () => {
      const isDemo = await SecureStore.getItemAsync(DEMO_MODE_STORAGE_KEY).catch(() => null);
      if (isDemo === "true") {
        return DEMO_STUDENT_STATS;
      }
      try {
        return await apiClient.get(
          `/student/stats${studentId ? `?studentId=${encodeURIComponent(studentId)}` : ""}`,
          { schema: studentQuickStatsSchema }
        );
      } catch (err) {
        if (isDemo === "true") {
          return DEMO_STUDENT_STATS;
        }
        throw err;
      }
    },
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to send OTP for changing registered phone number.
 */
export function useSendPhoneOtp() {
  return useMutation<{ success: boolean; message: string }, Error, SendPhoneOtpInput>({
    mutationFn: (input) => apiClient.post("/me/phone/send-otp", input),
  });
}

/**
 * Hook to verify OTP and confirm phone number update.
 */
export function useVerifyPhoneOtp() {
  const queryClient = useQueryClient();
  return useMutation<
    { success: boolean; phoneNumber: string; message: string },
    Error,
    VerifyPhoneOtpInput
  >({
    mutationFn: (input) => apiClient.post("/me/phone/verify", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.me });
      queryClient.invalidateQueries({ queryKey: queryKeys.home });
    },
  });
}

/**
 * Hook to request account deletion OTP.
 */
export function useRequestDeleteAccountOtp() {
  return useMutation<{ success: boolean; destination: string }, Error, void>({
    mutationFn: () => apiClient.post("/account/delete/send-otp", {}),
  });
}

/**
 * Hook to confirm account deletion with OTP.
 */
export function useConfirmDeleteAccount() {
  const queryClient = useQueryClient();
  return useMutation<
    { success: boolean; message: string },
    Error,
    ConfirmDeleteAccountInput
  >({
    mutationFn: (input) => apiClient.post("/account/delete/confirm", input),
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

/**
 * Hook to fetch past board toppers, percentiles and student testimonials.
 */
export function useResultsAndTestimonials() {
  return useQuery<ResultsAndTestimonialsResponse>({
    queryKey: queryKeys.resultsTestimonials,
    queryFn: () =>
      apiClient.get("/results-testimonials", {
        schema: resultsAndTestimonialsResponseSchema,
      }),
    staleTime: 5 * 60 * 1000,
  });
}

// ==========================================
// TEACHER MOBILE HOOKS
// ==========================================

export function useTeacherTodaySessions() {
  return useQuery<TeacherTodaySessionsResponse>({
    queryKey: queryKeys.teacherTodaySessions,
    queryFn: () =>
      apiClient.get("/teacher/today-sessions", {
        schema: teacherTodaySessionsResponseSchema,
      }),
    staleTime: 30 * 1000,
  });
}

export function useTeacherStartSession() {
  const queryClient = useQueryClient();
  return useMutation<{ success: boolean; session: any }, Error, string>({
    mutationFn: (sessionId: string) =>
      apiClient.post(`/teacher/sessions/${sessionId}/start`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teacherTodaySessions });
    },
  });
}

export function useTeacherEndSession() {
  const queryClient = useQueryClient();
  return useMutation<
    { success: boolean; session: any },
    Error,
    { sessionId: string; recordingYoutubeId?: string }
  >({
    mutationFn: ({ sessionId, recordingYoutubeId }) =>
      apiClient.post(`/teacher/sessions/${sessionId}/end`, {
        recordingYoutubeId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teacherTodaySessions });
    },
  });
}

export function useTeacherBatches() {
  return useQuery<TeacherBatchesResponse>({
    queryKey: queryKeys.teacherBatches,
    queryFn: () =>
      apiClient.get("/teacher/batches", {
        schema: teacherBatchesResponseSchema,
      }),
    staleTime: 60 * 1000,
  });
}

export function useTeacherBatchStudents(
  batchId?: string,
  date?: string,
  sessionId?: string | null
) {
  return useQuery<TeacherBatchStudentsResponse>({
    queryKey: queryKeys.teacherBatchStudents(batchId || "", date, sessionId),
    queryFn: () =>
      apiClient.get(`/teacher/batches/${batchId}/students`, {
        schema: teacherBatchStudentsResponseSchema,
        params: {
          date,
          sessionId: sessionId || undefined,
        },
      }),
    enabled: !!batchId,
    staleTime: 10 * 1000,
  });
}

export function useTeacherSaveAttendance() {
  const queryClient = useQueryClient();
  return useMutation<
    TeacherSaveAttendanceResponse,
    Error,
    TeacherSaveAttendanceInput
  >({
    mutationFn: (input) =>
      apiClient.post("/teacher/attendance", input, {
        schema: teacherSaveAttendanceResponseSchema,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.teacherBatchStudents(
          variables.batchId,
          variables.date,
          variables.sessionId
        ),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.teacherTodaySessions });
    },
  });
}

export function useTeacherPostAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation<
    TeacherPostAnnouncementResponse,
    Error,
    TeacherPostAnnouncementInput
  >({
    mutationFn: (input) =>
      apiClient.post("/teacher/announcements", input, {
        schema: teacherPostAnnouncementResponseSchema,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.batchAnnouncements(variables.batchId),
      });
    },
  });
}

export function useTeacherDoubts(status: "open" | "answered" | "closed" = "open") {
  return useQuery<{ doubts: DoubtItem[]; totalCount: number; openCount: number }>({
    queryKey: queryKeys.teacherDoubts(status),
    queryFn: () =>
      apiClient.get("/teacher/doubts", {
        params: { status },
      }),
    staleTime: 15 * 1000,
  });
}

export function useTeacherReplyDoubt() {
  const queryClient = useQueryClient();
  return useMutation<
    { message: DoubtMessageItem; doubt: DoubtItem },
    Error,
    { doubtId: string; input: ReplyDoubtInput }
  >({
    mutationFn: ({ doubtId, input }) =>
      apiClient.post(`/teacher/doubts/${doubtId}/reply`, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["teacher", "doubts"] });
      queryClient.invalidateQueries({
        queryKey: queryKeys.doubtThread(variables.doubtId),
      });
    },
  });
}

export function useTeacherBatchChapters(batchId?: string) {
  return useQuery<TeacherBatchChaptersResponse>({
    queryKey: queryKeys.teacherBatchChapters(batchId || ""),
    queryFn: () =>
      apiClient.get(`/teacher/batches/${batchId}/chapters`, {
        schema: teacherBatchChaptersResponseSchema,
      }),
    enabled: !!batchId,
    staleTime: 60 * 1000,
  });
}

export function useTeacherPresignedUrl() {
  return useMutation<
    TeacherPresignedUrlResponse,
    Error,
    TeacherPresignedUrlInput
  >({
    mutationFn: (input) =>
      apiClient.post("/teacher/presigned-url", input, {
        schema: teacherPresignedUrlResponseSchema,
      }),
  });
}

export function useTeacherQuickUpload() {
  const queryClient = useQueryClient();
  return useMutation<
    TeacherQuickUploadResponse,
    Error,
    TeacherQuickUploadInput
  >({
    mutationFn: (input) =>
      apiClient.post("/teacher/quick-upload", input, {
        schema: teacherQuickUploadResponseSchema,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.batchContent(variables.batchId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.batchChapterContent(
          variables.batchId,
          variables.chapterId
        ),
      });
    },
  });
}





