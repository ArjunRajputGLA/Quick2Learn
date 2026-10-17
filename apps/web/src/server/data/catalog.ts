import { db, schema, eq, and, sql, asc, desc, type DatabaseExecutor } from "@quick2learn/db";
import { assert, isAdmin, isStaff, type AuthUser } from "../authz";
import {
  DEFAULT_SITE_SETTINGS,
  DEFAULT_FACULTY_LIST,
  DEFAULT_RESULTS,
  DEFAULT_TESTIMONIALS,
  DEFAULT_MEGA_MENU_DATA,
  DEFAULT_BATCHES,
  DEFAULT_SUBJECTS,
  DEFAULT_CHAPTERS,
} from "./fallbacks";

// SUBJECTS
export async function getSubjects(tx?: DatabaseExecutor) {
  try {
    const d = tx || db;
    const rows = await d.select().from(schema.subjects).orderBy(asc(schema.subjects.sortOrder));
    if (rows && rows.length > 0) return rows;
  } catch (err) {
    console.warn("getSubjects failed, using static fallback:", err);
  }
  return DEFAULT_SUBJECTS;
}

export async function getSubjectBySlug(slug: string, tx?: DatabaseExecutor) {
  try {
    const d = tx || db;
    const [subject] = await d.select().from(schema.subjects).where(eq(schema.subjects.slug, slug));
    if (subject) return subject;
  } catch (err) {
    console.warn(`getSubjectBySlug failed for ${slug}, checking fallback:`, err);
  }
  return DEFAULT_SUBJECTS.find((s) => s.slug === slug) || null;
}

export async function createSubject(user: AuthUser, data: schema.NewSubject, tx?: DatabaseExecutor) {
  assert(isAdmin(user), "Only administrators can create subjects.");
  const d = tx || db;
  const [created] = await d.insert(schema.subjects).values(data).returning();
  return created;
}

export interface ClassSubjectDetail {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  chapterCount: number;
  lectureCount: number;
  board: string;
  mentor: {
    name: string;
    role: string;
    avatar: string;
  };
  sampleChapters: Array<{ number: number; title: string }>;
}

export async function getClassSubjectsWithDetails(
  classLevel: number,
  tx?: DatabaseExecutor,
): Promise<ClassSubjectDetail[]> {
  try {
    const d = tx || db;

    const rows = await d
      .select({
        id: schema.subjects.id,
        name: schema.subjects.name,
        slug: schema.subjects.slug,
        sortOrder: schema.subjects.sortOrder,
        chapterCount: sql<number>`count(distinct ${schema.chapters.id})`,
      })
      .from(schema.subjects)
      .innerJoin(
        schema.chapters,
        and(
          eq(schema.chapters.subjectId, schema.subjects.id),
          eq(schema.chapters.classLevel, classLevel),
        ),
      )
      .groupBy(
        schema.subjects.id,
        schema.subjects.name,
        schema.subjects.slug,
        schema.subjects.sortOrder,
      )
      .orderBy(asc(schema.subjects.sortOrder));

    if (rows && rows.length > 0) {
      const result: ClassSubjectDetail[] = [];

      for (const row of rows) {
        const chapters = await d
          .select({
            number: schema.chapters.number,
            title: schema.chapters.title,
            board: schema.chapters.board,
          })
          .from(schema.chapters)
          .where(
            and(
              eq(schema.chapters.subjectId, row.id),
              eq(schema.chapters.classLevel, classLevel),
            ),
          )
          .orderBy(asc(schema.chapters.sortOrder), asc(schema.chapters.number));

        const isMath = /math/i.test(row.name);
        const isHindi = /hindi/i.test(row.name);
        const isHistoryCivics = /history|civics/i.test(row.name);

        const mentor = isMath
          ? {
              name: "Mr. Dinesh Singh Rajput",
              role: "25+ Yrs Exp • Senior Mathematics Head",
              avatar: "/images/assets/Dinesh Singh Rajput.jpeg",
            }
          : isHindi
          ? {
              name: "Mrs. Namita Singh Rajput",
              role: "15+ Yrs Exp • ICSE Sciences & Hindi Mentor",
              avatar: "/images/assets/Namita Singh Rajput.jpeg",
            }
          : isHistoryCivics
          ? {
              name: "Mrs. Namita Singh Rajput",
              role: "15+ Yrs Exp • Head of ICSE Sciences, Humanities & Hindi",
              avatar: "/images/assets/Namita Singh Rajput.jpeg",
            }
          : {
              name: "Mrs. Namita Singh Rajput",
              role: "15+ Yrs Exp • Head of ICSE Sciences",
              avatar: "/images/assets/Namita Singh Rajput.jpeg",
            };

        const hasCbse = chapters.some((c) => c.board === "cbse");
        const hasIcse = chapters.some((c) => c.board === "icse");
        let board = "CBSE & ICSE";
        if (classLevel >= 11) {
          board = "CBSE & ISC";
        } else if (hasIcse && !hasCbse) {
          board = "ICSE Curriculum";
        } else if (hasCbse && !hasIcse) {
          board = "CBSE Curriculum";
        }

        result.push({
          id: row.id,
          name: row.name,
          slug: row.slug,
          sortOrder: row.sortOrder,
          chapterCount: Number(row.chapterCount),
          lectureCount: 0,
          board,
          mentor,
          sampleChapters: chapters.slice(0, 3).map((c) => ({
            number: c.number,
            title: c.title,
          })),
        });
      }

      return result;
    }
  } catch (err) {
    console.warn(`getClassSubjectsWithDetails query failed for class ${classLevel}, using static fallback:`, err);
  }

  // Fallback from DEFAULT_MEGA_MENU_DATA & DEFAULT_CHAPTERS
  const classItem = DEFAULT_MEGA_MENU_DATA.classes.find((c) => c.classLevel === classLevel);
  if (!classItem) return [];

  return classItem.subjects.map((s, idx) => {
    const isMath = /math/i.test(s.name);
    const isHindi = /hindi/i.test(s.name);
    const isHistoryCivics = /history|civics/i.test(s.name);

    const mentor = isMath
      ? {
          name: "Mr. Dinesh Singh Rajput",
          role: "25+ Yrs Exp • Senior Mathematics Head",
          avatar: "/images/assets/Dinesh Singh Rajput.jpeg",
        }
      : {
          name: "Mrs. Namita Singh Rajput",
          role: "15+ Yrs Exp • Head of ICSE Sciences & Humanities",
          avatar: "/images/assets/Namita Singh Rajput.jpeg",
        };

    // Find actual sample chapters from DEFAULT_CHAPTERS
    const subjMatch = DEFAULT_SUBJECTS.find((sub) => sub.slug === s.slug);
    const matchingChapters = DEFAULT_CHAPTERS.filter(
      (c) => c.classLevel === classLevel && (subjMatch ? c.subjectId === subjMatch.id : false),
    );

    const sampleChapters = matchingChapters.length > 0
      ? matchingChapters.slice(0, 3).map((c) => ({ number: c.number, title: c.title }))
      : [
          { number: 1, title: "Foundations & Core Principles" },
          { number: 2, title: "Concept Deep-Dive & Derivations" },
          { number: 3, title: "Board Examination Problems & Analysis" },
        ];

    return {
      id: s.id,
      name: s.name,
      slug: s.slug,
      sortOrder: idx + 1,
      chapterCount: s.chapterCount || (matchingChapters.length > 0 ? matchingChapters.length : 10),
      lectureCount: 0,
      board: classLevel >= 11 ? "CBSE & ISC" : (isHindi || isHistoryCivics ? "ICSE Curriculum" : "CBSE & ICSE"),
      mentor,
      sampleChapters,
    };
  });
}

// CHAPTERS
export async function getChapters(
  filters?: {
    subjectId?: string;
    classLevel?: number;
    board?: schema.Board;
    search?: string;
  },
  tx?: DatabaseExecutor,
) {
  try {
    const d = tx || db;
    const conditions = [];
    if (filters?.subjectId) conditions.push(eq(schema.chapters.subjectId, filters.subjectId));
    if (filters?.classLevel) conditions.push(eq(schema.chapters.classLevel, filters.classLevel));
    if (filters?.board) conditions.push(eq(schema.chapters.board, filters.board));
    if (filters?.search) {
      conditions.push(sql`${schema.chapters.fts} @@ plainto_tsquery('simple', ${filters.search})`);
    }

    const query = d.select().from(schema.chapters);
    const rows = conditions.length > 0
      ? await query.where(and(...conditions)).orderBy(asc(schema.chapters.sortOrder), asc(schema.chapters.number))
      : await query.orderBy(asc(schema.chapters.sortOrder), asc(schema.chapters.number));

    if (rows && rows.length > 0) return rows;
  } catch (err) {
    console.warn("getChapters query failed, checking static fallback:", err);
  }

  let result = DEFAULT_CHAPTERS;
  if (filters?.classLevel) {
    result = result.filter((c) => c.classLevel === filters.classLevel);
  }
  if (filters?.subjectId) {
    result = result.filter((c) => c.subjectId === filters.subjectId);
  }
  if (filters?.board) {
    result = result.filter((c) => c.board === filters.board);
  }
  return result.map((c) => ({
    ...c,
    fts: null as any,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
}

export async function createChapter(user: AuthUser, data: schema.NewChapter, tx?: DatabaseExecutor) {
  assert(isAdmin(user), "Only administrators can create chapters.");
  const d = tx || db;
  const [created] = await d.insert(schema.chapters).values(data).returning();
  return created;
}

// FACULTY
export async function getFacultyList(user?: AuthUser | null, tx?: DatabaseExecutor) {
  try {
    const d = tx || db;
    const staff = isStaff(user);
    if (staff) {
      return await d.select().from(schema.faculty).orderBy(asc(schema.faculty.sortOrder));
    }
    const rows = await d
      .select()
      .from(schema.faculty)
      .where(eq(schema.faculty.isPublished, true))
      .orderBy(asc(schema.faculty.sortOrder));
    if (rows && rows.length > 0) return rows;
  } catch (err) {
    console.warn("getFacultyList query failed, using static fallback:", err);
  }
  return DEFAULT_FACULTY_LIST as unknown as (typeof schema.faculty.$inferSelect)[];
}

export async function createFaculty(user: AuthUser, data: schema.NewFaculty, tx?: DatabaseExecutor) {
  assert(isAdmin(user), "Only administrators can add faculty.");
  const d = tx || db;
  const [created] = await d.insert(schema.faculty).values(data).returning();
  return created;
}

// TESTIMONIALS
export async function getTestimonials(user?: AuthUser | null, tx?: DatabaseExecutor) {
  try {
    const d = tx || db;
    const staff = isStaff(user);
    if (staff) {
      return await d.select().from(schema.testimonials).orderBy(asc(schema.testimonials.sortOrder));
    }
    const rows = await d
      .select()
      .from(schema.testimonials)
      .where(eq(schema.testimonials.isPublished, true))
      .orderBy(asc(schema.testimonials.sortOrder));
    if (rows && rows.length > 0) return rows;
  } catch (err) {
    console.warn("getTestimonials query failed, using static fallback:", err);
  }
  return DEFAULT_TESTIMONIALS as unknown as (typeof schema.testimonials.$inferSelect)[];
}

export async function createTestimonial(user: AuthUser, data: schema.NewTestimonial, tx?: DatabaseExecutor) {
  assert(isAdmin(user), "Only administrators can manage testimonials.");
  const d = tx || db;
  const [created] = await d.insert(schema.testimonials).values(data).returning();
  return created;
}

// RESULTS
export async function getResults(tx?: DatabaseExecutor) {
  try {
    const d = tx || db;
    const rows = await d.select().from(schema.results).orderBy(asc(schema.results.sortOrder));
    if (rows && rows.length > 0) return rows;
  } catch (err) {
    console.warn("getResults query failed, using static fallback:", err);
  }
  return DEFAULT_RESULTS as unknown as (typeof schema.results.$inferSelect)[];
}

export async function createResult(user: AuthUser, data: schema.NewResult, tx?: DatabaseExecutor) {
  assert(isAdmin(user), "Only administrators can publish results.");
  const d = tx || db;
  const [created] = await d.insert(schema.results).values(data).returning();
  return created;
}

// PROFILES
export async function getProfile(user: AuthUser, targetUserId: string, tx?: DatabaseExecutor) {
  assert(isStaff(user) || user.id === targetUserId, "Cannot access another user's profile.");
  const d = tx || db;
  const [found] = await d.select().from(schema.profiles).where(eq(schema.profiles.userId, targetUserId));
  return found || null;
}

export async function getAllProfiles(user: AuthUser, tx?: DatabaseExecutor) {
  assert(isStaff(user), "Only staff can list all profiles.");
  const d = tx || db;
  return await d.select().from(schema.profiles).orderBy(desc(schema.profiles.createdAt));
}

export async function updateProfile(
  user: AuthUser,
  targetUserId: string,
  data: Partial<schema.NewProfile>,
  tx?: DatabaseExecutor,
) {
  assert(isAdmin(user) || user.id === targetUserId, "Cannot update another user's profile.");
  if (data.role && data.role !== "student") {
    assert(isAdmin(user), "Only administrators can modify user roles.");
  }

  const d = tx || db;
  const [updated] = await d
    .update(schema.profiles)
    .set(data)
    .where(eq(schema.profiles.userId, targetUserId))
    .returning();
  return updated;
}

// MEGA-MENU
export interface MegaMenuSubjectItem {
  id: string;
  slug: string;
  name: string;
  href: string;
  chapterCount?: number;
}

export interface MegaMenuClassColumn {
  classLevel: number;
  classRoman: "IX" | "X" | "XI" | "XII";
  classSlug: "ix" | "x" | "xi" | "xii";
  subjects: MegaMenuSubjectItem[];
}

export interface MegaMenuData {
  classes: MegaMenuClassColumn[];
  sidePanelLinks: Array<{
    label: string;
    href: string;
    description: string;
    icon: "video" | "calendar" | "award";
  }>;
}

export async function getMegaMenuData(tx?: DatabaseExecutor): Promise<MegaMenuData> {
  try {
    const d = tx || db;

    const rows = await d
      .select({
        classLevel: schema.chapters.classLevel,
        subjectId: schema.subjects.id,
        subjectSlug: schema.subjects.slug,
        subjectName: schema.subjects.name,
        sortOrder: schema.subjects.sortOrder,
        chapterCount: sql<number>`count(${schema.chapters.id})::int`,
      })
      .from(schema.chapters)
      .innerJoin(schema.subjects, eq(schema.chapters.subjectId, schema.subjects.id))
      .groupBy(
        schema.chapters.classLevel,
        schema.subjects.id,
        schema.subjects.slug,
        schema.subjects.name,
        schema.subjects.sortOrder,
      )
      .orderBy(asc(schema.subjects.sortOrder));

    const allSubjects = await d.select().from(schema.subjects).orderBy(asc(schema.subjects.sortOrder));

    if (rows && rows.length > 0) {
      const classConfigs: Array<{
        level: number;
        roman: "IX" | "X" | "XI" | "XII";
        slug: "ix" | "x" | "xi" | "xii";
      }> = [
        { level: 9, roman: "IX", slug: "ix" },
        { level: 10, roman: "X", slug: "x" },
        { level: 11, roman: "XI", slug: "xi" },
        { level: 12, roman: "XII", slug: "xii" },
      ];

      const classes: MegaMenuClassColumn[] = classConfigs.map(({ level, roman, slug }) => {
        const classRows = rows.filter((r) => r.classLevel === level);

        const subjects: MegaMenuSubjectItem[] =
          classRows.length > 0
            ? classRows.map((r) => ({
                id: r.subjectId,
                slug: r.subjectSlug,
                name: r.subjectName,
                href: `/learn/${slug}/${r.subjectSlug}`,
                chapterCount: r.chapterCount,
              }))
            : allSubjects.map((s) => ({
                id: s.id,
                slug: s.slug,
                name: s.name,
                href: `/learn/${slug}/${s.slug}`,
              }));

        return {
          classLevel: level,
          classRoman: roman,
          classSlug: slug,
          subjects,
        };
      });

      return {
        classes,
        sidePanelLinks: [
          {
            label: "All free lectures",
            href: "/lectures",
            description: "Watch conceptual YouTube lessons by veteran mentors",
            icon: "video",
          },
          {
            label: "All batches",
            href: "/batches",
            description: "Explore offline & online classroom coaching schedules",
            icon: "calendar",
          },
          {
            label: "Results",
            href: "/results",
            description: "Inspect board toppers & 99+ percentile track record",
            icon: "award",
          },
        ],
      };
    }
  } catch (err) {
    console.warn("getMegaMenuData query failed, using static fallback:", err);
  }

  return DEFAULT_MEGA_MENU_DATA as MegaMenuData;
}

export interface ClassSubjectCardItem {
  id: string;
  name: string;
  slug: string;
  facultyName: string;
  lectureCount: number;
  href: string;
}

export interface PickYourClassData {
  [classRoman: string]: {
    cbse: ClassSubjectCardItem[];
    icse: ClassSubjectCardItem[];
  };
}

export async function getPickYourClassData(tx?: DatabaseExecutor): Promise<PickYourClassData> {
  try {
    const d = tx || db;

    const subjects = await d.select().from(schema.subjects).orderBy(asc(schema.subjects.sortOrder));
    if (subjects && subjects.length > 0) {
      const videos = await d
        .select({
          classLevel: schema.youtubeVideos.classLevel,
          subjectId: schema.youtubeVideos.subjectId,
        })
        .from(schema.youtubeVideos)
        .where(eq(schema.youtubeVideos.isPublished, true));

      // Count videos by classLevel and subjectId
      const countMap: Record<string, number> = {};
      for (const v of videos) {
        if (v.classLevel && v.subjectId) {
          const key = `${v.classLevel}-${v.subjectId}`;
          countMap[key] = (countMap[key] || 0) + 1;
        }
      }

      const romanLevels: Array<{ roman: string; level: number; slug: string }> = [
        { roman: "IX", level: 9, slug: "ix" },
        { roman: "X", level: 10, slug: "x" },
        { roman: "XI", level: 11, slug: "xi" },
        { roman: "XII", level: 12, slug: "xii" },
      ];

      const result: PickYourClassData = {};

      for (const { roman, level, slug } of romanLevels) {
        // CBSE subjects for this class
        const cbseItems: ClassSubjectCardItem[] = subjects
          .filter((s) => {
            // Classes 11 & 12 focus on Mathematics, Physics, Chemistry
            if (level >= 11 && s.slug === "biology") return false;
            if (s.slug === "hindi" || s.slug === "history-civics") return false; // Hindi & History-Civics are specific to ICSE 9
            return true;
          })
          .map((s) => {
            const count = countMap[`${level}-${s.id}`] || (s.slug === "mathematics" ? (level === 12 ? 3 : 2) : 1);
            const faculty = s.slug === "mathematics" ? "Mr. Dinesh Singh Rajput" : s.slug === "chemistry" || s.slug === "biology" ? "Mrs. Namita Singh Rajput" : "Subject Mentor";
            return {
              id: s.id,
              name: s.name,
              slug: s.slug,
              facultyName: faculty,
              lectureCount: count,
              href: `/learn/${slug}/${s.slug}`,
            };
          });

        // ICSE / ISC subjects for this class
        const icseItems: ClassSubjectCardItem[] = subjects
          .filter((s) => {
            // ICSE has Mathematics, Chemistry, Biology, and for Class 9 also Hindi and History-Civics
            if (s.slug === "hindi" || s.slug === "history-civics") return level === 9;
            return ["mathematics", "chemistry", "biology"].includes(s.slug);
          })
          .map((s) => {
            const count =
              countMap[`${level}-${s.id}`] ||
              (s.slug === "history-civics"
                ? 54
                : s.slug === "hindi"
                ? 11
                : s.slug === "chemistry" || s.slug === "biology"
                ? 2
                : 1);
            const faculty = s.slug === "mathematics" ? "Mr. Dinesh Singh Rajput" : "Mrs. Namita Singh Rajput";
            return {
              id: s.id,
              name: s.name,
              slug: s.slug,
              facultyName: faculty,
              lectureCount: count,
              href: `/learn/${slug}/${s.slug}`,
            };
          });

        result[roman] = {
          cbse: cbseItems,
          icse: icseItems,
        };
      }

      return result;
    }
  } catch (err) {
    console.warn("getPickYourClassData failed, using static fallback:", err);
  }

  // Pure static fallback
  return {
    IX: {
      cbse: [
        { id: "a1", name: "Mathematics", slug: "mathematics", facultyName: "Mr. Dinesh Singh Rajput", lectureCount: 2, href: "/learn/ix/mathematics" },
        { id: "a2", name: "Physics", slug: "physics", facultyName: "Mrs. Namita Singh Rajput", lectureCount: 1, href: "/learn/ix/physics" },
        { id: "a3", name: "Chemistry", slug: "chemistry", facultyName: "Mrs. Namita Singh Rajput", lectureCount: 1, href: "/learn/ix/chemistry" },
        { id: "a4", name: "Biology", slug: "biology", facultyName: "Mrs. Namita Singh Rajput", lectureCount: 1, href: "/learn/ix/biology" },
      ],
      icse: [
        { id: "a1", name: "Mathematics", slug: "mathematics", facultyName: "Mr. Dinesh Singh Rajput", lectureCount: 2, href: "/learn/ix/mathematics" },
        { id: "a3", name: "Chemistry", slug: "chemistry", facultyName: "Mrs. Namita Singh Rajput", lectureCount: 2, href: "/learn/ix/chemistry" },
        { id: "a4", name: "Biology", slug: "biology", facultyName: "Mrs. Namita Singh Rajput", lectureCount: 2, href: "/learn/ix/biology" },
        { id: "a5", name: "Hindi", slug: "hindi", facultyName: "Mrs. Namita Singh Rajput", lectureCount: 11, href: "/learn/ix/hindi" },
        { id: "a6", name: "History & Civics", slug: "history-civics", facultyName: "Mrs. Namita Singh Rajput", lectureCount: 54, href: "/learn/ix/history-civics" },
      ],
    },
    X: {
      cbse: [
        { id: "a1", name: "Mathematics", slug: "mathematics", facultyName: "Mr. Dinesh Singh Rajput", lectureCount: 2, href: "/learn/x/mathematics" },
        { id: "a2", name: "Physics", slug: "physics", facultyName: "Mrs. Namita Singh Rajput", lectureCount: 1, href: "/learn/x/physics" },
        { id: "a3", name: "Chemistry", slug: "chemistry", facultyName: "Mrs. Namita Singh Rajput", lectureCount: 1, href: "/learn/x/chemistry" },
        { id: "a4", name: "Biology", slug: "biology", facultyName: "Mrs. Namita Singh Rajput", lectureCount: 1, href: "/learn/x/biology" },
      ],
      icse: [
        { id: "a1", name: "Mathematics", slug: "mathematics", facultyName: "Mr. Dinesh Singh Rajput", lectureCount: 2, href: "/learn/x/mathematics" },
        { id: "a3", name: "Chemistry", slug: "chemistry", facultyName: "Mrs. Namita Singh Rajput", lectureCount: 2, href: "/learn/x/chemistry" },
        { id: "a4", name: "Biology", slug: "biology", facultyName: "Mrs. Namita Singh Rajput", lectureCount: 2, href: "/learn/x/biology" },
      ],
    },
    XI: {
      cbse: [
        { id: "a1", name: "Mathematics", slug: "mathematics", facultyName: "Mr. Dinesh Singh Rajput", lectureCount: 2, href: "/learn/xi/mathematics" },
        { id: "a2", name: "Physics", slug: "physics", facultyName: "Mrs. Namita Singh Rajput", lectureCount: 1, href: "/learn/xi/physics" },
        { id: "a3", name: "Chemistry", slug: "chemistry", facultyName: "Mrs. Namita Singh Rajput", lectureCount: 1, href: "/learn/xi/chemistry" },
      ],
      icse: [
        { id: "a1", name: "Mathematics", slug: "mathematics", facultyName: "Mr. Dinesh Singh Rajput", lectureCount: 2, href: "/learn/xi/mathematics" },
        { id: "a3", name: "Chemistry", slug: "chemistry", facultyName: "Mrs. Namita Singh Rajput", lectureCount: 2, href: "/learn/xi/chemistry" },
      ],
    },
    XII: {
      cbse: [
        { id: "a1", name: "Mathematics", slug: "mathematics", facultyName: "Mr. Dinesh Singh Rajput", lectureCount: 3, href: "/learn/xii/mathematics" },
        { id: "a2", name: "Physics", slug: "physics", facultyName: "Mrs. Namita Singh Rajput", lectureCount: 1, href: "/learn/xii/physics" },
        { id: "a3", name: "Chemistry", slug: "chemistry", facultyName: "Mrs. Namita Singh Rajput", lectureCount: 1, href: "/learn/xii/chemistry" },
      ],
      icse: [
        { id: "a1", name: "Mathematics", slug: "mathematics", facultyName: "Mr. Dinesh Singh Rajput", lectureCount: 3, href: "/learn/xii/mathematics" },
        { id: "a3", name: "Chemistry", slug: "chemistry", facultyName: "Mrs. Namita Singh Rajput", lectureCount: 2, href: "/learn/xii/chemistry" },
      ],
    },
  };
}

// FACULTY PROFILE WITH BATCHES AND LECTURES
export interface FacultyProfileData {
  faculty: typeof schema.faculty.$inferSelect;
  batches: Array<{
    id: string;
    slug: string;
    title: string;
    subtitle: string | null;
    mode: string;
    scheduleText: string;
    classLevel: number;
    board: string;
    seatsTotal: number;
    seatsRemaining: number;
    startingPricePaise: number;
    href: string;
  }>;
  lectures: Array<{
    id: string;
    title: string;
    thumbnailUrl: string;
    duration: string;
    gradeAndSubject: string;
    faculty: string;
    views: string;
    publishedAt: string;
    href: string;
  }>;
}

export async function getFacultyProfileWithBatchesAndLectures(
  slug: string,
  tx?: DatabaseExecutor,
): Promise<FacultyProfileData | null> {
  try {
    const d = tx || db;

    const [facultyMember] = await d
      .select()
      .from(schema.faculty)
      .where(and(eq(schema.faculty.slug, slug), eq(schema.faculty.isPublished, true)));

    if (facultyMember) {
      // 1. Fetch batches mentored by this faculty
      const batchRows = await d
        .select({
          batch: schema.batches,
          subjectName: schema.subjects.name,
        })
        .from(schema.batches)
        .leftJoin(schema.subjects, eq(schema.batches.subjectId, schema.subjects.id))
        .where(
          and(
            eq(schema.batches.facultyId, facultyMember.id),
            sql`"batches"."status" != 'draft'`,
          ),
        )
        .orderBy(
          sql`CASE WHEN "batches"."status" = 'open' THEN 0 ELSE 1 END`,
          desc(schema.batches.startDate),
        );

      const feePlans = await d
        .select()
        .from(schema.batchFeePlans)
        .where(eq(schema.batchFeePlans.isActive, true));

      const enrollmentCounts = await d
        .select({
          batchId: schema.enrollments.batchId,
          count: sql<number>`count(${schema.enrollments.id})::int`,
        })
        .from(schema.enrollments)
        .where(sql`"enrollments"."status" != 'cancelled'`)
        .groupBy(schema.enrollments.batchId);

      const countMap = Object.fromEntries(enrollmentCounts.map((c) => [c.batchId, c.count]));

      const formattedBatches = batchRows.map((r) => {
        const plans = feePlans.filter((p) => p.batchId === r.batch.id);
        const minPrice = plans.length > 0 ? Math.min(...plans.map((p) => p.totalPaise)) : 0;
        const taken = countMap[r.batch.id] || 0;
        return {
          id: r.batch.id,
          slug: r.batch.slug,
          title: r.batch.title,
          subtitle: r.batch.subtitle,
          mode: r.batch.mode,
          scheduleText: r.batch.scheduleText,
          classLevel: r.batch.classLevel,
          board: r.batch.board.toUpperCase(),
          seatsTotal: r.batch.seatsTotal,
          seatsRemaining: Math.max(0, r.batch.seatsTotal - taken),
          startingPricePaise: minPrice,
          href: `/batches/${r.batch.slug}`,
        };
      });

      // 2. Fetch latest lectures for this faculty
      let lectureRows = await d
        .select({
          video: schema.youtubeVideos,
          subjectName: schema.subjects.name,
        })
        .from(schema.youtubeVideos)
        .leftJoin(schema.subjects, eq(schema.youtubeVideos.subjectId, schema.subjects.id))
        .where(
          and(
            eq(schema.youtubeVideos.facultyId, facultyMember.id),
            eq(schema.youtubeVideos.isPublished, true),
            eq(schema.youtubeVideos.isShort, false),
          ),
        )
        .orderBy(desc(schema.youtubeVideos.publishedAt))
        .limit(6);

      if (lectureRows.length === 0) {
        lectureRows = await d
          .select({
            video: schema.youtubeVideos,
            subjectName: schema.subjects.name,
          })
          .from(schema.youtubeVideos)
          .leftJoin(schema.subjects, eq(schema.youtubeVideos.subjectId, schema.subjects.id))
          .where(
            and(
              eq(schema.youtubeVideos.isPublished, true),
              eq(schema.youtubeVideos.isShort, false),
            ),
          )
          .orderBy(desc(schema.youtubeVideos.publishedAt))
          .limit(4);
      }

      const formattedLectures = lectureRows.map((lr) => {
        const v = lr.video;
        const minutes = Math.floor(v.durationSeconds / 60);
        const seconds = v.durationSeconds % 60;
        const duration = `${minutes}:${seconds.toString().padStart(2, "0")}`;
        const views = v.viewCount >= 1000 ? `${(v.viewCount / 1000).toFixed(1)}k` : `${v.viewCount}`;
        const classRom = v.classLevel ? (v.classLevel === 9 ? "IX" : v.classLevel === 10 ? "X" : v.classLevel === 11 ? "XI" : "XII") : "";
        const gradeAndSubject = [classRom ? `Class ${classRom}` : null, lr.subjectName || "Maths"].filter(Boolean).join(" • ");

        return {
          id: v.id,
          title: v.title,
          thumbnailUrl: v.thumbnailUrl || "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80",
          duration,
          gradeAndSubject,
          faculty: facultyMember.name,
          views: `${views} views`,
          publishedAt: v.publishedAt ? new Date(v.publishedAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "Recent",
          href: `/lecture/${v.id}`,
        };
      });

      return {
        faculty: facultyMember,
        batches: formattedBatches,
        lectures: formattedLectures,
      };
    }
  } catch (err) {
    console.warn(`getFacultyProfileWithBatchesAndLectures for ${slug} failed, using fallback:`, err);
  }

  // Fallback profile
  const fallbackFaculty = DEFAULT_FACULTY_LIST.find((f) => f.slug === slug || slug.includes(f.slug.split("-")[0] || "")) || DEFAULT_FACULTY_LIST[0];
  if (!fallbackFaculty) return null;

  const isDinesh = fallbackFaculty.slug.includes("dinesh");
  const matchingBatches = DEFAULT_BATCHES.filter((b) => isDinesh ? b.facultyName.includes("Dinesh") : b.facultyName.includes("Namita"));

  return {
    faculty: fallbackFaculty as unknown as (typeof schema.faculty.$inferSelect),
    batches: matchingBatches.map((b) => ({
      id: b.id,
      slug: b.slug,
      title: b.title,
      subtitle: b.subtitle,
      mode: b.mode,
      scheduleText: b.scheduleText,
      classLevel: b.classLevel,
      board: b.board,
      seatsTotal: b.seatsTotal,
      seatsRemaining: b.seatsTotal - (b.seatsTaken || 0),
      startingPricePaise: b.pricePaise,
      href: `/batches/${b.slug}`,
    })),
    lectures: [
      {
        id: "yt-1",
        title: isDinesh ? "Class 12 CBSE Maths: Matrices & Determinants One-Shot Revision | Dinesh Sir" : "Class 10 ICSE Chemistry: Periodic Properties & Group Variations | Namita Ma'am",
        thumbnailUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80",
        duration: "58m",
        gradeAndSubject: isDinesh ? "Class XII • Mathematics" : "Class X • Chemistry",
        faculty: fallbackFaculty.name,
        views: "18.4k views",
        publishedAt: "Jan 10, 2026",
        href: "/lectures",
      },
    ],
  };
}

// ABOUT PAGE DATA
export interface AboutPageData {
  story: {
    title: string;
    subtitle: string;
    story: string;
    mission: string;
    founder_quote: string;
    values: Array<{ title: string; description: string }>;
  };
  channelStats: {
    title: string;
    description: string;
    youtube_url: string;
    handle: string;
    subscribers: string;
    videos: string;
    views: string;
  };
  facultyList: (typeof schema.faculty.$inferSelect)[];
  dineshProfile: typeof schema.faculty.$inferSelect | null;
}

export async function getAboutPageData(tx?: DatabaseExecutor): Promise<AboutPageData> {
  const defaultStory = (DEFAULT_SITE_SETTINGS.about_story as AboutPageData["story"]) || {
    title: "The Quick2Learn Story",
    subtitle: "Over two decades of concept-first pedagogy and board distinction results in Mathura.",
    story:
      "Quick2Learn was founded by veteran educator Mr. Dinesh Singh Rajput with a singular mission: to deliver rigorous, concept-first coaching in Mathematics and Sciences for Classes IX–XII. Over 25 years of teaching excellence in Mathura has produced thousands of board distinction scorers and district toppers.",
    mission:
      "To eliminate rote memorization in secondary and senior secondary education, replacing anxiety with mathematical intuition and structured problem-solving discipline.",
    founder_quote:
      "Mathematics is not about memorizing steps; it is about recognizing patterns, understanding why an identity holds true, and having the courage to break complex problems into small, obvious steps.",
    values: [
      {
        title: "Concept Mastery",
        description: "Step-by-step problem simplification from first principles rather than rote memorization.",
      },
      {
        title: "Continuous Testing",
        description: "Weekly board-pattern mock examinations with individual teacher feedback and step-marking.",
      },
      {
        title: "Single Campus Integrity",
        description: "Zero franchising or multi-tenancy. Direct daily access to master faculty at our Mathura centre.",
      },
    ],
  };

  const defaultChannelStats = (DEFAULT_SITE_SETTINGS.channel_stats as AboutPageData["channelStats"]) || {
    title: "Learn Anywhere on Our Official YouTube Channel",
    description:
      "Join over 100,000 students learning Mathematics, Chemistry, and Biology. Watch complete chapter one-shots, board PYQ marathons, and conceptual formula derivations for free.",
    youtube_url: "https://www.youtube.com/@Quick2Learn",
    handle: "@Quick2Learn",
    subscribers: "100K+ Learners",
    videos: "450+ High-Yield Lessons",
    views: "5M+ Views",
  };

  const defaultFaculty = DEFAULT_FACULTY_LIST as unknown as (typeof schema.faculty.$inferSelect)[];

  try {
    const d = tx || db;
    const settingsRows = await d.select().from(schema.siteSettings);
    const settingsMap: Record<string, unknown> = {};
    for (const r of settingsRows) {
      settingsMap[r.key] = r.value;
    }

    const facultyList = await d
      .select()
      .from(schema.faculty)
      .where(eq(schema.faculty.isPublished, true))
      .orderBy(asc(schema.faculty.sortOrder));

    const finalFaculty = facultyList && facultyList.length > 0 ? facultyList : defaultFaculty;
    const dineshProfile =
      finalFaculty.find((f) => f.slug.includes("dinesh")) ||
      finalFaculty[0] ||
      null;

    return {
      story: (settingsMap.about_story as AboutPageData["story"]) || defaultStory,
      channelStats: (settingsMap.channel_stats as AboutPageData["channelStats"]) || defaultChannelStats,
      facultyList: finalFaculty,
      dineshProfile,
    };
  } catch (err) {
    console.warn("getAboutPageData query failed, using static fallback:", err);
    return {
      story: defaultStory,
      channelStats: defaultChannelStats,
      facultyList: defaultFaculty,
      dineshProfile: defaultFaculty[0] || null,
    };
  }
}

// GROUPED FAQS
export interface FaqItem {
  category: "Admissions" | "Fees" | "Classes" | "Online access" | string;
  question: string;
  answer: string;
}

export type GroupedFaqs = Record<string, FaqItem[]>;

export async function getGroupedFaqs(tx?: DatabaseExecutor): Promise<GroupedFaqs> {
  const defaultFaqs = (DEFAULT_SITE_SETTINGS.faqs as FaqItem[]) || [];

  let rawList: FaqItem[] = defaultFaqs;
  try {
    const d = tx || db;
    const [row] = await d
      .select()
      .from(schema.siteSettings)
      .where(eq(schema.siteSettings.key, "faqs"));
    if (row?.value && Array.isArray(row.value) && row.value.length > 0) {
      rawList = row.value as FaqItem[];
    }
  } catch (err) {
    console.warn("getGroupedFaqs query failed, using static fallback:", err);
  }

  const grouped: GroupedFaqs = {
    Admissions: [],
    Fees: [],
    Classes: [],
    "Online access": [],
  };

  for (const item of rawList) {
    let cat = item.category || "Admissions";
    if (cat.toLowerCase().includes("admis")) cat = "Admissions";
    else if (cat.toLowerCase().includes("fee") || cat.toLowerCase().includes("pay")) cat = "Fees";
    else if (cat.toLowerCase().includes("class") || cat.toLowerCase().includes("centre")) cat = "Classes";
    else if (cat.toLowerCase().includes("online") || cat.toLowerCase().includes("app")) cat = "Online access";

    if (!grouped[cat]) {
      grouped[cat] = [];
    }
    grouped[cat]!.push({
      category: cat,
      question: item.question,
      answer: item.answer,
    });
  }

  return grouped;
}

// CONTACT PAGE DATA
export interface ContactPageData {
  phone: string;
  whatsapp: string;
  cleanWhatsApp: string;
  email: string;
  supportHours: string;
  addressLine: string;
  cityState: string;
  landmark: string;
  mapEmbedUrl: string;
}

export async function getContactPageData(tx?: DatabaseExecutor): Promise<ContactPageData> {
  const map: Record<string, unknown> = { ...DEFAULT_SITE_SETTINGS };
  try {
    const d = tx || db;
    const rows = await d.select().from(schema.siteSettings);
    for (const r of rows) {
      map[r.key] = r.value;
    }
  } catch (err) {
    console.warn("getContactPageData query failed, using static fallback:", err);
  }

  const contactObj = (map.contact || {}) as {
    phone?: string;
    whatsapp?: string;
    email?: string;
    support_hours?: string;
  };
  const addressObj = (map.address || {}) as {
    line1?: string;
    city?: string;
    state?: string;
    pincode?: string;
    landmark?: string;
  };

  const phone = contactObj.phone || "+91 76688 75809";
  const whatsapp = contactObj.whatsapp || "+91 76688 75809";
  const email = contactObj.email || "quick2learn23203@gmail.com";
  const supportHours = contactObj.support_hours || "Mon–Sat 9:00 AM – 7:00 PM IST";

  const rawLine1 = addressObj.line1 || "";
  const addressLine =
    rawLine1 && !rawLine1.toLowerCase().includes("bsa") && rawLine1.toLowerCase() !== "mathura"
      ? rawLine1
      : "Mathura";
  const city = addressObj.city || "Mathura";
  const state = addressObj.state || "Uttar Pradesh";
  const pincode = addressObj.pincode || "281004";
  const rawLandmark = addressObj.landmark || "";
  const landmark =
    rawLandmark && !rawLandmark.toLowerCase().includes("bsa")
      ? rawLandmark
      : "Mathura Centre";
  const cityState = `${city}, ${state} ${pincode}`;

  // Default Google Maps embed for Mathura, UP centre
  const mapEmbedUrl =
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d113175.76747209733!2d77.60814674751515!3d27.492413410712793!2m3!1f0!2f0!3f0!3m2!1i1024!2i784!4f13.1!3m3!1m2!1s0x397371165972f043%3A0x2a59bf4615b1a7d1!2sMathura%2C%20Uttar%20Pradesh!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin";

  return {
    phone,
    whatsapp,
    cleanWhatsApp: whatsapp.replace(/[^0-9]/g, ""),
    email,
    supportHours,
    addressLine,
    cityState,
    landmark,
    mapEmbedUrl,
  };
}
