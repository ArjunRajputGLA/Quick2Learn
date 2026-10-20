import { describe, it, expect, beforeAll, vi } from "vitest";

vi.mock("server-only", () => ({}));
import {
  generateStudentParentInviteCode,
  getActiveStudentInviteCode,
  claimParentInviteCode,
  getLinkedStudentsForParent,
} from "../apps/web/src/server/data/parent";
import { db, schema, eq } from "@quick2learn/db";

describe("Unique Student Parent Invite Code & Profile Link Suite", () => {
  let student1Id: string;
  let student2Id: string;
  let parent1Id: string;

  beforeAll(async () => {
    // 1. Create Student 1
    const s1User = await db
      .insert(schema.user)
      .values({
        id: "student-unique-test-1",
        name: "Aarav Sharma",
        email: "aarav.unique@quick2learn.in",
        emailVerified: true,
      })
      .onConflictDoNothing()
      .returning();

    student1Id = s1User[0]?.id || "student-unique-test-1";

    await db
      .insert(schema.profiles)
      .values({
        userId: student1Id,
        fullName: "Aarav Sharma",
        phone: "+919876500001",
        role: "student",
        classLevel: 10,
        board: "cbse",
        school: "Delhi Public School Mathura",
      })
      .onConflictDoNothing();

    // 2. Create Student 2
    const s2User = await db
      .insert(schema.user)
      .values({
        id: "student-unique-test-2",
        name: "Ananya Patel",
        email: "ananya.unique@quick2learn.in",
        emailVerified: true,
      })
      .onConflictDoNothing()
      .returning();

    student2Id = s2User[0]?.id || "student-unique-test-2";

    await db
      .insert(schema.profiles)
      .values({
        userId: student2Id,
        fullName: "Ananya Patel",
        phone: "+919876500002",
        role: "student",
        classLevel: 12,
        board: "icse",
        school: "St. Paul's Senior Secondary School",
      })
      .onConflictDoNothing();

    // 3. Create Parent 1
    const p1User = await db
      .insert(schema.user)
      .values({
        id: "parent-unique-test-1",
        name: "Rajesh Sharma",
        email: "rajesh.parent@quick2learn.in",
        emailVerified: true,
      })
      .onConflictDoNothing()
      .returning();

    parent1Id = p1User[0]?.id || "parent-unique-test-1";

    await db
      .insert(schema.profiles)
      .values({
        userId: parent1Id,
        fullName: "Rajesh Sharma",
        phone: "+919876599999",
        role: "parent",
      })
      .onConflictDoNothing();
  });

  it("Generates a fresh, unique invite code every time forceNew is requested", async () => {
    const code1 = await generateStudentParentInviteCode(student1Id, true);
    expect(code1.code).toHaveLength(6);

    const code2 = await generateStudentParentInviteCode(student1Id, true);
    expect(code2.code).toHaveLength(6);
    expect(code2.code).not.toEqual(code1.code); // Unique every time!

    const code3 = await generateStudentParentInviteCode(student1Id, true);
    expect(code3.code).toHaveLength(6);
    expect(code3.code).not.toEqual(code2.code);
    expect(code3.code).not.toEqual(code1.code);
  });

  it("Links the parent to the accurate student profile details using the unique invite code", async () => {
    // Generate fresh unique code for Aarav Sharma
    const aaravInvite = await generateStudentParentInviteCode(student1Id, true);

    // Parent claims Aarav's unique code
    const linkedStudent = await claimParentInviteCode(parent1Id, aaravInvite.code);

    expect(linkedStudent.userId).toBe(student1Id);
    expect(linkedStudent.fullName).toBe("Aarav Sharma");
    expect(linkedStudent.classLevel).toBe(10);
    expect(linkedStudent.board).toBe("cbse");
    expect(linkedStudent.school).toBe("Delhi Public School Mathura");

    // Check parent linked students query
    const parentStudents = await getLinkedStudentsForParent(parent1Id);
    expect(parentStudents.length).toBeGreaterThanOrEqual(1);
    const found = parentStudents.find((s) => s.userId === student1Id);
    expect(found).toBeDefined();
    expect(found?.fullName).toBe("Aarav Sharma");
    expect(found?.classLevel).toBe(10);
    expect(found?.school).toBe("Delhi Public School Mathura");
  });
});
