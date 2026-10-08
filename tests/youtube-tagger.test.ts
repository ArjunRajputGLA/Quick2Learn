import { describe, it, expect } from "vitest";
import {
  extractClassLevel,
  extractSubjectSlug,
  extractChapterNumber,
  tagVideo,
  tagPlaylist,
  type TaggingContext,
  type SubjectRecord,
  type ChapterRecord,
  type FacultyRecord,
} from "../apps/web/src/server/youtube/tagger";
import { parseIso8601Duration } from "../apps/web/src/server/youtube/duration";

describe("YouTube ISO 8601 Duration Parser", () => {
  it("parses seconds only (PT20S, PT45S)", () => {
    expect(parseIso8601Duration("PT20S")).toBe(20);
    expect(parseIso8601Duration("PT45S")).toBe(45);
  });

  it("parses minutes and seconds (PT44M30S)", () => {
    expect(parseIso8601Duration("PT44M30S")).toBe(44 * 60 + 30);
  });

  it("parses hours, minutes and seconds (PT1H0M22S, PT1H1M15S)", () => {
    expect(parseIso8601Duration("PT1H0M22S")).toBe(3600 + 22);
    expect(parseIso8601Duration("PT1H1M15S")).toBe(3600 + 60 + 15);
  });

  it("parses hours only (PT2H)", () => {
    expect(parseIso8601Duration("PT2H")).toBe(7200);
  });

  it("handles empty or invalid duration safely", () => {
    expect(parseIso8601Duration("")).toBe(0);
    expect(parseIso8601Duration(null)).toBe(0);
    expect(parseIso8601Duration(undefined)).toBe(0);
    expect(parseIso8601Duration("INVALID_DURATION")).toBe(0);
  });
});

describe("YouTube Auto-Tagger - 20+ Real Channel Title Patterns", () => {
  const subjects: SubjectRecord[] = [
    { id: "sub-math", slug: "mathematics", name: "Mathematics" },
    { id: "sub-phys", slug: "physics", name: "Physics" },
    { id: "sub-chem", slug: "chemistry", name: "Chemistry" },
    { id: "sub-bio", slug: "biology", name: "Biology" },
  ];

  const chapters: ChapterRecord[] = [
    { id: "ch-m12-3", classLevel: 12, subjectId: "sub-math", number: 3, title: "Matrices", slug: "class-12-maths-ch-3-matrices" },
    { id: "ch-m12-4", classLevel: 12, subjectId: "sub-math", number: 4, title: "Determinants", slug: "class-12-maths-ch-4-determinants" },
    { id: "ch-m12-7", classLevel: 12, subjectId: "sub-math", number: 7, title: "Integrals", slug: "class-12-maths-ch-7-integrals" },
    { id: "ch-m12-10", classLevel: 12, subjectId: "sub-math", number: 10, title: "Vector Algebra", slug: "class-12-maths-ch-10-vector-algebra" },
    { id: "ch-m12-11", classLevel: 12, subjectId: "sub-math", number: 11, title: "Three Dimensional Geometry", slug: "class-12-maths-ch-11-three-dimensional-geometry" },
    { id: "ch-m11-10", classLevel: 11, subjectId: "sub-math", number: 10, title: "Conic Sections", slug: "class-11-maths-ch-10-conic-sections" },
    { id: "ch-m10-1", classLevel: 10, subjectId: "sub-math", number: 1, title: "Real Numbers", slug: "class-10-maths-ch-1-real-numbers" },
    { id: "ch-b9-1", classLevel: 9, subjectId: "sub-bio", number: 1, title: "Basic Biology", slug: "class-9-bio-ch-1-basic-biology" },
    { id: "ch-b9-2", classLevel: 9, subjectId: "sub-bio", number: 2, title: "Cell", slug: "class-9-bio-ch-2-cell" },
    { id: "ch-b9-3", classLevel: 9, subjectId: "sub-bio", number: 3, title: "Tissues", slug: "class-9-bio-ch-3-tissues" },
    { id: "ch-b9-4", classLevel: 9, subjectId: "sub-bio", number: 4, title: "The Flower", slug: "class-9-bio-ch-4-the-flower" },
    { id: "ch-b9-5", classLevel: 9, subjectId: "sub-bio", number: 5, title: "Pollination & Fertilisation", slug: "class-9-bio-ch-5-pollination" },
    { id: "ch-b9-6", classLevel: 9, subjectId: "sub-bio", number: 6, title: "Seeds", slug: "class-9-bio-ch-6-seeds" },
    { id: "ch-b9-7", classLevel: 9, subjectId: "sub-bio", number: 7, title: "Respiration in Plants", slug: "class-9-bio-ch-7-respiration" },
    { id: "ch-b9-8", classLevel: 9, subjectId: "sub-bio", number: 8, title: "Five Kingdom Classification", slug: "class-9-bio-ch-8-five-kingdom" },
  ];

  const facultyList: FacultyRecord[] = [
    { id: "fac-dinesh", name: "Dinesh Singh Rajput" },
    { id: "fac-namita", name: "Namita Singh Rajput" },
  ];

  const context: TaggingContext = {
    subjects,
    chapters,
    facultyList,
    playlistMappings: new Map(),
  };

  // Pattern 1: Parabola Standard Forms (Conic Sections)
  it("Pattern 1: LECTURE-5: PARABOLA & ITS STANDARD FORMS", () => {
    const res = tagVideo(
      { title: "LECTURE-5:  PARABOLA & ITS STANDARD FORMS", durationSeconds: 2670 },
      context,
    );
    expect(res.classLevel).toBe(11);
    expect(res.subjectId).toBe("sub-math");
    expect(res.chapterId).toBe("ch-m11-10");
    expect(res.facultyId).toBe("fac-dinesh");
    expect(res.isShort).toBe(false);
  });

  // Pattern 2: Dot Product of Two Vectors (Vector Algebra)
  it("Pattern 2: LECTURE-9: DOT PRODUCT OF TWO VECTORS", () => {
    const res = tagVideo(
      { title: "LECTURE-9: DOT PRODUCT OF TWO VECTORS", durationSeconds: 3622 },
      context,
    );
    expect(res.classLevel).toBe(12);
    expect(res.subjectId).toBe("sub-math");
    expect(res.chapterId).toBe("ch-m12-10");
    expect(res.facultyId).toBe("fac-dinesh");
    expect(res.isShort).toBe(false);
  });

  // Pattern 3: Equation of a Line in Space (Three Dimensional Geometry)
  it("Pattern 3: LECTURE-5: EQUATION OA A LINE IN SPACE", () => {
    const res = tagVideo(
      { title: "LECTURE-5: EQUATION OA A LINE IN SPACE", durationSeconds: 3675 },
      context,
    );
    expect(res.classLevel).toBe(12);
    expect(res.subjectId).toBe("sub-math");
    expect(res.chapterId).toBe("ch-m12-11");
    expect(res.facultyId).toBe("fac-dinesh");
    expect(res.isShort).toBe(false);
  });

  // Pattern 4: ICSE Class 9 History-Civics Ch-7 (Short video <= 180s)
  it("Pattern 4: ICSE CLASS 9 HISTORY-CIVICS CH-7 (short video)", () => {
    const res = tagVideo(
      {
        title: "ICSE CLASS 9 HISTORY-CIVICS CH-7, MEDIEVAL INDIA: SOUTH INDIA & THE CHOLAS QAs, NOTES",
        durationSeconds: 20,
      },
      context,
    );
    expect(res.classLevel).toBe(9);
    expect(res.isShort).toBe(true);
  });

  // Pattern 5: ICSE Class 9 History-Civics Ch-6 (Short video)
  it("Pattern 5: ICSE CLASS 9 HISTORY-CIVICS CH-6", () => {
    const res = tagVideo(
      {
        title: "ICSE CLASS 9 HISTORY-CIVICS CH-6  THE GOLDEN AGE OF THE GUPTAS, QAs, NOTES",
        durationSeconds: 25,
      },
      context,
    );
    expect(res.classLevel).toBe(9);
    expect(res.isShort).toBe(true);
  });

  // Pattern 6: ICSE Class 9 History-Civics Ch-5
  it("Pattern 6: ICSE CLASS 9 HISTORY-CIVICS CH-5 THE SANGAM AGE", () => {
    const res = tagVideo(
      {
        title: "ICSE CLASS 9 HISTORY-CIVICS CH-5 THE SANGAM AGE, QAs, NOTES",
        durationSeconds: 10,
      },
      context,
    );
    expect(res.classLevel).toBe(9);
    expect(res.isShort).toBe(true);
  });

  // Pattern 7: ICSE Class IX Bio Ch-8 Five Kingdom Classification
  it("Pattern 7: ICSE CLASS IX BIO CH-8 FIVE KINGDOM CLASSIFICATION", () => {
    const res = tagVideo(
      {
        title: "ICSE CLASS IX BIO CH-8 FIVE KINGDOM CLASSIFICATION , ONE SHOT REVISION ( WITH OBJECTIVE QUESTIONS)",
        durationSeconds: 3195,
      },
      context,
    );
    expect(res.classLevel).toBe(9);
    expect(res.subjectId).toBe("sub-bio");
    expect(res.chapterId).toBe("ch-b9-8");
    expect(res.facultyId).toBe("fac-namita");
    expect(res.isShort).toBe(false);
  });

  // Pattern 8: ICSE Class IX Bio Ch-7 Respiration in Plants
  it("Pattern 8: ICSE CLASS IX BIO CH-7 RESPIRATION IN PLANTS", () => {
    const res = tagVideo(
      {
        title: "ICSE CLASS IX BIO CH-7 RESPIRATION IN PLANTS , ONE SHOT REVISION ( WITH OBJECTIVE QUESTIONS)",
        durationSeconds: 4176,
      },
      context,
    );
    expect(res.classLevel).toBe(9);
    expect(res.subjectId).toBe("sub-bio");
    expect(res.chapterId).toBe("ch-b9-7");
    expect(res.facultyId).toBe("fac-namita");
  });

  // Pattern 9: ICSE Class IX Bio Ch-6 Seeds Structure & Germination
  it("Pattern 9: ICSE CLASS IX BIO CH-6 SEEDS: STRUCTURE & GERMINATION", () => {
    const res = tagVideo(
      {
        title: "ICSE CLASS IX BIO CH-6 SEEDS: STRUCTURE & GERMINATION, ONE SHOT REVISION ( WITH OBJECTIVE QUESTIONS)",
        durationSeconds: 3159,
      },
      context,
    );
    expect(res.classLevel).toBe(9);
    expect(res.subjectId).toBe("sub-bio");
    expect(res.chapterId).toBe("ch-b9-6");
    expect(res.facultyId).toBe("fac-namita");
  });

  // Pattern 10: ICSE Class IX Bio Ch-4 The Flower
  it("Pattern 10: ICSE CLASS IX BIO CH-4 THE FLOWER", () => {
    const res = tagVideo(
      {
        title: "ICSE CLASS IX BIO CH-4 THE FLOWER ONE SHOT REVISION ( EXPLANATION WITH OBJECTIVE QUESTIONS)",
        durationSeconds: 2360,
      },
      context,
    );
    expect(res.classLevel).toBe(9);
    expect(res.subjectId).toBe("sub-bio");
    expect(res.chapterId).toBe("ch-b9-4");
    expect(res.facultyId).toBe("fac-namita");
  });

  // Pattern 11: ICSE Class IX Bio Ch-3 Tissues
  it("Pattern 11: ICSE CLASS IX BIO CH-3 TISSUES", () => {
    const res = tagVideo(
      {
        title: "ICSE CLASS IX BIO CH-3 TISSUES ONE SHOT REVISION ( EXPLANATION WITH OBJECTIVE QUESTIONS PART 2",
        durationSeconds: 2942,
      },
      context,
    );
    expect(res.classLevel).toBe(9);
    expect(res.subjectId).toBe("sub-bio");
    expect(res.chapterId).toBe("ch-b9-3");
    expect(res.facultyId).toBe("fac-namita");
  });

  // Pattern 12: ICSE Class IX Bio Ch-2 Cell
  it("Pattern 12: ICSE CLASS IX BIO CH-2 CELL", () => {
    const res = tagVideo(
      {
        title: "ICSE CLASS IX BIO CH-2 CELL ONE SHOT REVISION ( EXPLANATION WITH OBJECTIVE QUESTIONS",
        durationSeconds: 4495,
      },
      context,
    );
    expect(res.classLevel).toBe(9);
    expect(res.subjectId).toBe("sub-bio");
    expect(res.chapterId).toBe("ch-b9-2");
    expect(res.facultyId).toBe("fac-namita");
  });

  // Pattern 13: ICSE Class IX Bio Ch-1 Basic Biology
  it("Pattern 13: ICSE CLASS IX BIO CH-1 BASIC BIOLOGY", () => {
    const res = tagVideo(
      {
        title: "ICSE CLASS IX BIO CH-1 BASIC BIOLOGY ONE SHOT REVISION ( EXPLANATION WITH OBJECTIVE QUESTIONS",
        durationSeconds: 1495,
      },
      context,
    );
    expect(res.classLevel).toBe(9);
    expect(res.subjectId).toBe("sub-bio");
    expect(res.chapterId).toBe("ch-b9-1");
    expect(res.facultyId).toBe("fac-namita");
  });

  // Pattern 14: ICSE Class 9 Civics Ch-5 Elections
  it("Pattern 14: ICSE CLASS 9 CIVICS CH-5 ELECTIONS . QUESTION- ANSWERS", () => {
    const res = tagVideo(
      {
        title: "ICSE CLASS 9 CIVICS CH-5 ELECTIONS . QUESTION- ANSWERS",
        durationSeconds: 48,
      },
      context,
    );
    expect(res.classLevel).toBe(9);
    expect(res.isShort).toBe(true);
  });

  // Pattern 15: ICSE Class 9 Civics Ch-4 Directive Principles of State Policy
  it("Pattern 15: ICSE CLASS 9 CIVICS CH-4 DIRECTIVE PRINCIPLES OF STATE POLICY", () => {
    const res = tagVideo(
      {
        title: "ICSE CLASS 9 CIVICS CH-4 DIRECTIVE PRINCIPLES OF STATE POLICY ; L-3 , NOTES IN THE FORM OF Q & As",
        durationSeconds: 43,
      },
      context,
    );
    expect(res.classLevel).toBe(9);
    expect(res.isShort).toBe(true);
  });

  // Pattern 16: Chapter 3 Matrices Class 12
  it("Pattern 16: Chapter 3 Matrices Class 12", () => {
    const res = tagVideo(
      {
        title: "Chapter 3 Matrices Class 12 One Shot",
        durationSeconds: 3800,
      },
      context,
    );
    expect(res.classLevel).toBe(12);
    expect(res.subjectId).toBe("sub-math");
    expect(res.chapterId).toBe("ch-m12-3");
    expect(res.facultyId).toBe("fac-dinesh");
    expect(res.isShort).toBe(false);
  });

  // Pattern 17: Real Numbers Class 10
  it("Pattern 17: Real Numbers Class 10th Maths", () => {
    const res = tagVideo(
      {
        title: "Class 10th Maths Chapter 1 Real Numbers Full Concept",
        durationSeconds: 3100,
      },
      context,
    );
    expect(res.classLevel).toBe(10);
    expect(res.subjectId).toBe("sub-math");
    expect(res.chapterId).toBe("ch-m10-1");
  });

  // Pattern 18: Hindi Devanagari "कक्षा 12 गणित समाकलन अध्याय 7"
  it("Pattern 18: कक्षा 12 गणित समाकलन (Integrals) अध्याय 7", () => {
    const res = tagVideo(
      {
        title: "कक्षा 12 गणित समाकलन (Integrals) अध्याय 7",
        durationSeconds: 3600,
      },
      context,
    );
    expect(res.classLevel).toBe(12);
    expect(res.subjectId).toBe("sub-math");
    expect(res.chapterId).toBe("ch-m12-7");
  });

  // Pattern 19: Class 12th Maths New Exam Pattern & Syllabus
  it("Pattern 19: Class 12th Maths New Exam Pattern & Syllabus", () => {
    const res = tagVideo(
      {
        title: "Class 12th Maths New Exam Pattern & Syllabus 2026",
        durationSeconds: 950,
      },
      context,
    );
    expect(res.classLevel).toBe(12);
    expect(res.subjectId).toBe("sub-math");
    expect(res.facultyId).toBe("fac-dinesh");
  });

  // Pattern 20: Important Questions for Class 11 Maths
  it("Pattern 20: Important Questions for Class 11 Maths", () => {
    const res = tagVideo(
      {
        title: "Important Questions for Class 11 Maths Final Exam",
        durationSeconds: 2400,
      },
      context,
    );
    expect(res.classLevel).toBe(11);
    expect(res.subjectId).toBe("sub-math");
  });

  // Playlist mappings override title guesses
  it("Playlist mapping overrides title guesses with higher authority", () => {
    const playlistMappings = new Map([
      [
        "playlist-matrices-12",
        {
          id: "playlist-matrices-12",
          title: "Chapter 3 Matrices Class 12",
          classLevel: 12,
          subjectId: "sub-math",
          chapterId: "ch-m12-3",
        },
      ],
    ]);

    const res = tagVideo(
      {
        title: "Daily Practice Problem Discussion Session #4", // Vague title with no class/subject
        durationSeconds: 1500,
        playlistIds: ["playlist-matrices-12"],
      },
      { ...context, playlistMappings },
    );

    // Playlist mapping wins!
    expect(res.classLevel).toBe(12);
    expect(res.subjectId).toBe("sub-math");
    expect(res.chapterId).toBe("ch-m12-3");
    expect(res.facultyId).toBe("fac-dinesh");
  });

  // Playlist tagger matches playlist titles correctly
  it("tagPlaylist tags playlist titles accurately", () => {
    const p1 = tagPlaylist("Chapter 3 Matrices Class 12", { subjects, chapters });
    expect(p1.classLevel).toBe(12);
    expect(p1.subjectId).toBe("sub-math");
    expect(p1.chapterId).toBe("ch-m12-3");

    const p2 = tagPlaylist("CLASS X ICSE BIOLOGY", { subjects, chapters });
    expect(p2.classLevel).toBe(10);
    expect(p2.subjectId).toBe("sub-bio");

    const p3 = tagPlaylist("CLASS IX ICSE CHEMISTRY", { subjects, chapters });
    expect(p3.classLevel).toBe(9);
    expect(p3.subjectId).toBe("sub-chem");
  });
});
