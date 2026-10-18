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
} from "@quick2learn/shared";
import { apiClient } from "./client";

export const queryKeys = {
  appConfig: ["app", "config"] as const,
  me: ["me"] as const,
  notifications: (limit?: number) => ["notifications", limit] as const,
  unreadCount: ["notifications", "unread-count"] as const,
  parentStudents: ["parent", "students"] as const,
  studentInviteCode: ["student", "invite-code"] as const,
};

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
    queryFn: () => apiClient.get("/me", { schema: meResponseSchema }),
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

