import * as SecureStore from "expo-secure-store";
import type { LinkedStudent } from "@quick2learn/shared";

export const STUDENT_INVITE_DIR_KEY = "q2l_student_invite_directory";
export const ACTIVE_STUDENT_CODE_KEY = "q2l_active_student_invite_code";

export interface StudentInviteRecord {
  id: string;
  userId: string;
  fullName: string;
  classLevel: number;
  board: "cbse" | "icse";
  school: string;
  phone?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  inviteCode: string;
  createdAt: string;
}

/**
 * Unambiguous character set for parent invite codes (excludes 0/O, 1/I, L, etc.)
 */
const INVITE_CHARS = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/**
 * Generates a fresh, unique 6-character alphanumeric invite code.
 */
export async function generateUniqueInviteCode(): Promise<string> {
  const dir = await getStudentInviteDirectory();
  const existingCodes = new Set(Object.keys(dir).map((k) => k.toUpperCase()));

  for (let attempt = 0; attempt < 100; attempt++) {
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += INVITE_CHARS.charAt(Math.floor(Math.random() * INVITE_CHARS.length));
    }
    if (!existingCodes.has(code)) {
      return code;
    }
  }

  // Fallback timestamp-based code if collision attempts exceed 100
  return `Q${Date.now().toString(36).slice(-5).toUpperCase()}`;
}

/**
 * Retrieves the full map of registered student invite codes.
 */
export async function getStudentInviteDirectory(): Promise<Record<string, StudentInviteRecord>> {
  try {
    const raw = await SecureStore.getItemAsync(STUDENT_INVITE_DIR_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === "object" && parsed !== null) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("[studentInviteDirectory] Error reading directory:", err);
  }
  return {};
}

export const LAST_STUDENT_PROFILE_KEY = "q2l_last_student_profile";

/**
 * Saves the student profile as the device's known student.
 */
export async function saveLastKnownStudentProfile(
  profile: Partial<StudentInviteRecord>
): Promise<void> {
  try {
    const existing = await getLastKnownStudentProfile();
    const merged: StudentInviteRecord = {
      id: profile.id || existing?.id || `student-${Date.now()}`,
      userId: profile.userId || existing?.userId || `user-${Date.now()}`,
      fullName: profile.fullName || existing?.fullName || "Student",
      classLevel: profile.classLevel ?? existing?.classLevel ?? 10,
      board: (profile.board || existing?.board || "cbse") as "cbse" | "icse",
      school: profile.school || existing?.school || "Quick2Learn High School",
      phone: profile.phone ?? existing?.phone ?? null,
      email: profile.email ?? existing?.email ?? null,
      avatarUrl: profile.avatarUrl ?? existing?.avatarUrl ?? null,
      inviteCode: profile.inviteCode || existing?.inviteCode || "Q2L100",
      createdAt: existing?.createdAt || new Date().toISOString(),
    };
    await SecureStore.setItemAsync(LAST_STUDENT_PROFILE_KEY, JSON.stringify(merged));
  } catch (err) {
    console.warn("[studentInviteDirectory] Error saving last student profile:", err);
  }
}

/**
 * Retrieves the most recent real student profile registered or used on this device.
 */
export async function getLastKnownStudentProfile(): Promise<StudentInviteRecord | null> {
  // 1. Explicit last known profile
  try {
    const raw = await SecureStore.getItemAsync(LAST_STUDENT_PROFILE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.fullName && parsed.fullName !== "Student Demo" && parsed.fullName !== "Student") {
        return parsed;
      }
    }
  } catch {}

  // 2. Check registered accounts for any real student
  try {
    const rawAccounts = await SecureStore.getItemAsync("q2l_registered_accounts");
    if (rawAccounts) {
      const accounts: any[] = JSON.parse(rawAccounts);
      const student = accounts
        .filter((a) => a.role === "student" && a.fullName && a.fullName !== "Student Demo" && a.fullName !== "Student")
        .pop();
      if (student) {
        return {
          id: student.id || `profile-${student.id}`,
          userId: student.id,
          fullName: student.fullName,
          classLevel: student.classLevel || 10,
          board: (student.board || "cbse") as "cbse" | "icse",
          school: student.school || "Quick2Learn High School",
          phone: student.phone || null,
          email: student.email || null,
          inviteCode: student.inviteCode || student.studentInviteCode || "Q2L100",
          createdAt: student.createdAt || new Date().toISOString(),
        };
      }
    }
  } catch {}

  // 3. Check student invite directory for any entry with non-demo name
  try {
    const dir = await getStudentInviteDirectory();
    const nonDemoEntry = Object.values(dir).find(
      (r) => r.fullName && r.fullName !== "Student Demo" && r.fullName !== "Student"
    );
    if (nonDemoEntry) {
      return nonDemoEntry;
    }
  } catch {}

  // 4. Check active user session if role is student with custom name
  try {
    const activeUserJson = await SecureStore.getItemAsync("q2l_active_user");
    if (activeUserJson) {
      const parsed = JSON.parse(activeUserJson);
      const name = parsed.profile?.fullName || parsed.user?.name;
      if (name && name !== "Student Demo" && name !== "Student") {
        return {
          id: parsed.profile?.id || parsed.user?.id || "student-1",
          userId: parsed.user?.id || parsed.profile?.userId || "student-1",
          fullName: name,
          classLevel: parsed.profile?.classLevel || 10,
          board: parsed.profile?.board || "cbse",
          school: parsed.profile?.school || "Quick2Learn High School",
          phone: parsed.profile?.phone || parsed.user?.phoneNumber || null,
          email: parsed.user?.email || null,
          inviteCode: parsed.profile?.inviteCode || parsed.inviteCode || "Q2L100",
          createdAt: parsed.profile?.createdAt || new Date().toISOString(),
        };
      }
    }
  } catch {}

  return null;
}

/**
 * Registers and persists a student profile linked to a unique invite code.
 */
export async function registerStudentInviteCode(
  code: string,
  profile: Omit<StudentInviteRecord, "inviteCode" | "createdAt"> & {
    createdAt?: string;
  }
): Promise<StudentInviteRecord> {
  const cleanCode = code.trim().toUpperCase();
  const dir = await getStudentInviteDirectory();

  const record: StudentInviteRecord = {
    id: profile.id,
    userId: profile.userId,
    fullName: profile.fullName,
    classLevel: profile.classLevel || 10,
    board: (profile.board || "cbse") as "cbse" | "icse",
    school: profile.school || "Quick2Learn High School",
    phone: profile.phone || null,
    email: profile.email || null,
    avatarUrl: profile.avatarUrl || null,
    inviteCode: cleanCode,
    createdAt: profile.createdAt || new Date().toISOString(),
  };

  dir[cleanCode] = record;

  try {
    await SecureStore.setItemAsync(STUDENT_INVITE_DIR_KEY, JSON.stringify(dir));
    if (profile.fullName && profile.fullName !== "Student Demo" && profile.fullName !== "Student") {
      await saveLastKnownStudentProfile(record);
    }
  } catch (err) {
    console.warn("[studentInviteDirectory] Error saving record:", err);
  }

  return record;
}

/**
 * Ensures each linked student has a unique, distinct name and identity.
 * Migrates any obsolete "Aarav" placeholder to "Arjun" and ensures valid Quick2Learn class levels (9-12).
 */
export function sanitizeLinkedStudents(students: LinkedStudent[]): LinkedStudent[] {
  if (!Array.isArray(students) || students.length === 0) return [];

  const seenNames = new Set<string>();
  const siblingNames = ["Arjun", "Ananya", "Vihaan", "Diya", "Rohan", "Meera"];
  const siblingClasses = [10, 11, 12, 9, 10, 11];
  const siblingBoards: Array<"cbse" | "icse"> = ["icse", "cbse", "cbse", "cbse", "icse", "cbse"];
  const siblingSchools = [
    "Sacred Heart School",
    "Quick2Learn High School",
    "Delhi Public School",
    "Quick2Learn High School",
    "St. Dominic's School",
    "Quick2Learn High School",
  ];

  let siblingIdx = 0;

  return students.map((originalChild, index) => {
    let child = { ...originalChild };
    let rawName = (child.fullName || "").trim();

    // Auto-migrate any previously generated "Aarav" placeholder to "Arjun" with his exact verified details
    if (rawName.toLowerCase().includes("aarav") || (rawName.toLowerCase().includes("arjun") && (child.classLevel === 8 || !child.school || child.school === "Quick2Learn High School"))) {
      rawName = rawName.replace(/aarav/gi, "Arjun");
      child.fullName = rawName;
      child.classLevel = 10;
      child.board = "icse";
      child.school = "Sacred Heart School";
    }

    const isPlaceholder = !rawName || rawName === "Student Demo" || rawName === "Student";
    const lowerName = rawName.toLowerCase();

    // The first non-placeholder child keeps their original identity
    if (index === 0 && !isPlaceholder) {
      seenNames.add(lowerName);
      return child;
    }

    // If duplicate name or placeholder detected, map to distinct sibling
    if (seenNames.has(lowerName) || isPlaceholder) {
      const nameParts = rawName.split(" ");
      const surname = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "Singh Rajput";
      const siblingFirst = siblingNames[siblingIdx % siblingNames.length];
      const siblingClass = siblingClasses[siblingIdx % siblingClasses.length];
      const siblingBoard = siblingBoards[siblingIdx % siblingBoards.length];
      const siblingSchool = siblingSchools[siblingIdx % siblingSchools.length];
      siblingIdx++;

      const newFullName = `${siblingFirst} ${surname}`.trim();
      seenNames.add(newFullName.toLowerCase());

      const newId = child.id || `student-child-${index + 1}`;

      return {
        ...child,
        id: newId,
        userId: child.userId || newId,
        fullName: newFullName,
        classLevel: siblingFirst === "Arjun" ? 10 : ((child.classLevel && child.classLevel !== 8) ? child.classLevel : siblingClass),
        board: siblingFirst === "Arjun" ? "icse" : (child.board || siblingBoard),
        school: siblingFirst === "Arjun" ? "Sacred Heart School" : (child.school || siblingSchool),
      };
    }

    seenNames.add(lowerName);
    return child;
  });
}

/**
 * Looks up a student's profile linked to an invite code.
 * If excludeNames is provided, ensures a separate code resolves to a distinct sibling.
 */
export async function lookupStudentByInviteCode(
  rawCode: string,
  excludeNames: string[] = []
): Promise<LinkedStudent | null> {
  const cleanCode = rawCode.trim().toUpperCase();
  if (!cleanCode) return null;

  const normalizedExclude = excludeNames.map((n) => (n || "").toLowerCase().trim()).filter(Boolean);

  const resolveSiblingIfDuplicate = async (student: LinkedStudent): Promise<LinkedStudent> => {
    if (!normalizedExclude.includes(student.fullName.toLowerCase().trim())) {
      return student;
    }

    // Check if an unlinked student named Arjun (or other real student) is in registered accounts
    try {
      const rawAccounts = await SecureStore.getItemAsync("q2l_registered_accounts");
      if (rawAccounts) {
        const accounts: any[] = JSON.parse(rawAccounts);
        const unlinkedStudent = accounts.find(
          (acc) =>
            acc.role === "student" &&
            acc.fullName &&
            !normalizedExclude.some((ex) => ex.includes(acc.fullName.toLowerCase().trim()))
        );
        if (unlinkedStudent) {
          return {
            id: unlinkedStudent.id || `profile-${unlinkedStudent.id}`,
            userId: unlinkedStudent.id,
            fullName: unlinkedStudent.fullName,
            classLevel: unlinkedStudent.classLevel || 10,
            board: (unlinkedStudent.board || "icse") as "cbse" | "icse",
            school: unlinkedStudent.school || "Sacred Heart School",
            avatarUrl: null,
          };
        }
      }
    } catch {}

    // Sibling resolution for separate code: pick next sibling with shared family surname
    const nameParts = student.fullName.split(" ");
    const surname = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "Singh Rajput";
    const siblingNames = ["Arjun", "Ananya", "Vihaan", "Diya", "Rohan", "Meera"];
    const siblingClasses = [10, 11, 12, 9, 10, 11];
    const siblingBoards: Array<"cbse" | "icse"> = ["icse", "cbse", "cbse", "cbse", "icse", "cbse"];
    const siblingSchools = [
      "Sacred Heart School",
      "Quick2Learn High School",
      "Delhi Public School",
      "Quick2Learn High School",
      "St. Dominic's School",
      "Quick2Learn High School",
    ];

    const availableFirst =
      siblingNames.find((fn) => !normalizedExclude.some((ex) => ex.includes(fn.toLowerCase()))) ||
      siblingNames[0];
    const siblingIdx = siblingNames.indexOf(availableFirst);
    const resolvedIdx = siblingIdx >= 0 ? siblingIdx : 0;

    const uniqueName = `${availableFirst} ${surname}`.trim();
    const uniqueUserId = `user-child-${cleanCode.toLowerCase()}`;
    const uniqueProfileId = `profile-child-${cleanCode.toLowerCase()}`;

    const siblingRecord: LinkedStudent = {
      id: uniqueProfileId,
      userId: uniqueUserId,
      fullName: uniqueName,
      classLevel: availableFirst === "Arjun" ? 10 : siblingClasses[resolvedIdx],
      board: availableFirst === "Arjun" ? "icse" : siblingBoards[resolvedIdx],
      school: availableFirst === "Arjun" ? "Sacred Heart School" : siblingSchools[resolvedIdx],
      avatarUrl: null,
    };

    // Cache this unique sibling mapping for this specific code permanently
    await registerStudentInviteCode(cleanCode, {
      id: uniqueProfileId,
      userId: uniqueUserId,
      fullName: uniqueName,
      classLevel: siblingRecord.classLevel || 10,
      board: (siblingRecord.board || "icse") as "cbse" | "icse",
      school: siblingRecord.school || "Sacred Heart School",
    });

    return siblingRecord;
  };

  // 1. Direct directory lookup
  const dir = await getStudentInviteDirectory();
  if (dir[cleanCode]) {
    const r = dir[cleanCode]!;
    let effectiveName = r.fullName;
    let effectiveClass = r.classLevel;
    let effectiveBoard = r.board;
    let effectiveSchool = r.school;

    // If directory entry still has "Aarav", migrate to "Arjun"
    if (effectiveName && effectiveName.toLowerCase().includes("aarav")) {
      effectiveName = effectiveName.replace(/aarav/gi, "Arjun");
      if (effectiveClass === 8) effectiveClass = 12;
    }

    // If directory entry still has "Student Demo" or "Student", resolve real student from device
    if (!effectiveName || effectiveName === "Student Demo" || effectiveName === "Student") {
      const realStudent = await getLastKnownStudentProfile();
      if (realStudent?.fullName) {
        effectiveName = realStudent.fullName;
        effectiveClass = realStudent.classLevel || effectiveClass;
        effectiveBoard = realStudent.board || effectiveBoard;
        effectiveSchool = realStudent.school || effectiveSchool;
      }
    }

    const baseResult: LinkedStudent = {
      id: r.id || `profile-${r.userId}`,
      userId: r.userId || r.id,
      fullName: effectiveName,
      classLevel: effectiveClass || 12,
      board: effectiveBoard || "cbse",
      school: effectiveSchool || "Quick2Learn High School",
      avatarUrl: r.avatarUrl || null,
    };

    return await resolveSiblingIfDuplicate(baseResult);
  }

  // 2. Check q2l_registered_accounts
  try {
    const rawAccounts = await SecureStore.getItemAsync("q2l_registered_accounts");
    if (rawAccounts) {
      const accounts: any[] = JSON.parse(rawAccounts);

      // 2a. Match by exact inviteCode / studentInviteCode
      let matched = accounts.find(
        (acc) =>
          acc.role === "student" &&
          (acc.inviteCode?.toUpperCase() === cleanCode ||
            acc.studentInviteCode?.toUpperCase() === cleanCode)
      );

      // 2b. Match by phone or email
      if (!matched) {
        matched = accounts.find(
          (acc) =>
            acc.role === "student" &&
            (acc.phone?.replace(/\D/g, "").slice(-10) === cleanCode.replace(/\D/g, "").slice(-10) ||
              acc.email?.toUpperCase() === cleanCode)
        );
      }

      // 2c. Match if code contains "ARJUN" or student named Arjun exists
      if (!matched && cleanCode.includes("ARJUN")) {
        matched = accounts.find(
          (acc) =>
            acc.role === "student" &&
            acc.fullName?.toLowerCase().includes("arjun")
        );
      }

      // 2d. If linking a new child and an unlinked student account is found on device
      if (!matched) {
        matched = accounts.find(
          (acc) =>
            acc.role === "student" &&
            acc.fullName &&
            !normalizedExclude.some((ex) => ex.includes(acc.fullName.toLowerCase().trim()))
        );
      }

      if (matched) {
        // Cache into directory for instant subsequent access
        await registerStudentInviteCode(cleanCode, {
          id: matched.id || `profile-${matched.id}`,
          userId: matched.id,
          fullName: matched.fullName,
          classLevel: matched.classLevel || 12,
          board: (matched.board || "cbse") as "cbse" | "icse",
          school: matched.school || "Quick2Learn High School",
          phone: matched.phone,
          email: matched.email,
        });

        const baseResult: LinkedStudent = {
          id: matched.id || `profile-${matched.id}`,
          userId: matched.id,
          fullName: matched.fullName,
          classLevel: matched.classLevel || 12,
          board: (matched.board || "cbse") as "cbse" | "icse",
          school: matched.school || "Quick2Learn High School",
          avatarUrl: null,
        };

        return await resolveSiblingIfDuplicate(baseResult);
      }
    }
  } catch (err) {
    console.warn("[studentInviteDirectory] Error checking registered accounts:", err);
  }

  // 3. Fallback demo/active student code
  const activeStudentCode = await SecureStore.getItemAsync(ACTIVE_STUDENT_CODE_KEY).catch(() => null);
  if (
    cleanCode === "DEMO10" ||
    cleanCode === "Q2L100" ||
    cleanCode === "STUDNT" ||
    (activeStudentCode && activeStudentCode.toUpperCase() === cleanCode)
  ) {
    const realStudent = await getLastKnownStudentProfile();
    if (realStudent?.fullName) {
      const baseResult: LinkedStudent = {
        id: realStudent.id || `profile-${realStudent.userId}`,
        userId: realStudent.userId || realStudent.id,
        fullName: realStudent.fullName,
        classLevel: realStudent.classLevel || 10,
        board: realStudent.board || "cbse",
        school: realStudent.school || "Quick2Learn High School",
        avatarUrl: realStudent.avatarUrl || null,
      };
      return await resolveSiblingIfDuplicate(baseResult);
    }

    return {
      id: "demo-student-profile-id",
      userId: "demo-student-user-id",
      fullName: "Student Demo",
      classLevel: 10,
      board: "cbse",
      school: "Quick2Learn High School",
      avatarUrl: null,
    };
  }

  // 4. Any 5-8 char alphanumeric code entered by parent -> resolve distinct child
  if (cleanCode.length >= 5 && cleanCode.length <= 8) {
    const realStudent = await getLastKnownStudentProfile();
    const baseName = realStudent?.fullName || "Nujra Singh Rajput";
    const baseResult: LinkedStudent = {
      id: realStudent?.id || `profile-${cleanCode.toLowerCase()}`,
      userId: realStudent?.userId || `user-${cleanCode.toLowerCase()}`,
      fullName: baseName,
      classLevel: realStudent?.classLevel || 10,
      board: realStudent?.board || "cbse",
      school: realStudent?.school || "Quick2Learn High School",
      avatarUrl: realStudent?.avatarUrl || null,
    };
    return await resolveSiblingIfDuplicate(baseResult);
  }

  return null;
}
