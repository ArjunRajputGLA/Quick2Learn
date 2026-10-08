export interface SubjectRecord {
  id: string;
  slug: string;
  name: string;
}

export interface ChapterRecord {
  id: string;
  classLevel: number;
  subjectId: string;
  number: number;
  title: string;
  slug: string;
}

export interface FacultyRecord {
  id: string;
  name: string;
}

export interface PlaylistTagMapping {
  id: string;
  title: string;
  classLevel?: number | null;
  subjectId?: string | null;
  chapterId?: string | null;
}

export interface TaggingContext {
  subjects: SubjectRecord[];
  chapters: ChapterRecord[];
  facultyList: FacultyRecord[];
  playlistMappings?: Map<string, PlaylistTagMapping>;
}

export interface VideoTagResult {
  classLevel: number | null;
  subjectId: string | null;
  chapterId: string | null;
  facultyId: string | null;
  isShort: boolean;
  needsReview: boolean;
}

export interface PlaylistTagResult {
  classLevel: number | null;
  subjectId: string | null;
  chapterId: string | null;
}

/**
 * Extracts class level (9, 10, 11, 12) from text.
 * Handles English, Hindi, and Roman numeral formats.
 */
export function extractClassLevel(text: string): number | null {
  if (!text) return null;
  const clean = text.trim();

  // 1. Hindi patterns: कक्षा 12, कक्षा १२, etc.
  if (/कक्षा\s*(?:12|१२)/i.test(clean)) return 12;
  if (/कक्षा\s*(?:11|११)/i.test(clean)) return 11;
  if (/कक्षा\s*(?:10|१०)/i.test(clean)) return 10;
  if (/कक्षा\s*(?:9|९|09)/i.test(clean)) return 9;

  // 2. Class 12 / XII / 12th
  if (
    /\b(?:class|grade|icse|cbse|std|standard)\s*(?:12th|12|xii)\b/i.test(clean) ||
    /\b12th\b/i.test(clean) ||
    /\bXII\b/.test(clean)
  ) {
    return 12;
  }

  // 3. Class 11 / XI / 11th
  if (
    /\b(?:class|grade|icse|cbse|std|standard)\s*(?:11th|11|xi)\b/i.test(clean) ||
    /\b11th\b/i.test(clean) ||
    /\bXI\b/.test(clean)
  ) {
    return 11;
  }

  // 4. Class 10 / X / 10th
  if (
    /\b(?:class|grade|icse|cbse|std|standard)\s*(?:10th|10|x)\b/i.test(clean) ||
    /\b10th\b/i.test(clean) ||
    (/\bX\b/.test(clean) && /\b(?:icse|cbse|maths?|bio|chem|physics)\b/i.test(clean))
  ) {
    return 10;
  }

  // 5. Class 9 / IX / 9th
  if (
    /\b(?:class|grade|icse|cbse|std|standard)\s*(?:9th|9|ix|09)\b/i.test(clean) ||
    /\b9th\b/i.test(clean) ||
    /\bIX\b/.test(clean)
  ) {
    return 9;
  }

  return null;
}

/**
 * Extracts subject slug from text.
 * Covers maths, chemistry, biology, physics, and civics/history.
 */
export function extractSubjectSlug(text: string): string | null {
  if (!text) return null;
  const clean = text.toLowerCase();

  // Specific subjects
  if (/\b(bio|biology|जीव\s*विज्ञान|जीवविज्ञान)\b/i.test(clean)) {
    return "biology";
  }
  if (/\b(chem|chemistry|रसायन\s*विज्ञान|रसायन)\b/i.test(clean)) {
    return "chemistry";
  }
  if (/\b(phys|physics|भौतिक\s*विज्ञान|भौतिकी?)\b/i.test(clean)) {
    return "physics";
  }
  if (/\b(history|civics|इतिहास|नागरिक\s*शास्त्र)\b/i.test(clean)) {
    return "history-civics";
  }

  // Mathematics keywords & topic indicators
  if (
    /\b(math|maths|mathematics|गणित|calculus|algebra|integrals?|matrices|matrix|determinants?|vectors?|trigonometry|derivatives?|parabola|conic|probability|समाकलन|आव्यूह)\b/i.test(
      clean,
    )
  ) {
    return "mathematics";
  }

  return null;
}

/**
 * Extracts chapter number from text (e.g. "CH-7", "CH - 7", "Chapter 3", "अध्याय 7").
 */
export function extractChapterNumber(text: string): number | null {
  if (!text) return null;
  const match = text.match(/(?:ch|chapter|अध्याय)\s*[-:.]?\s*(\d+)/i);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  return null;
}

/**
 * Auto-tags a playlist based on its title and context.
 */
export function tagPlaylist(
  title: string,
  context: { subjects: SubjectRecord[]; chapters: ChapterRecord[] },
): PlaylistTagResult {
  const classLevel = extractClassLevel(title);
  const subjectSlug = extractSubjectSlug(title);

  const matchedSubject = subjectSlug
    ? context.subjects.find((s) => s.slug === subjectSlug)
    : context.subjects.find((s) => s.slug === "mathematics");

  const subjectId = matchedSubject ? matchedSubject.id : null;

  let chapterId: string | null = null;
  const chNum = extractChapterNumber(title);

  // Match chapter if possible
  if (classLevel && subjectId) {
    if (chNum) {
      const ch = context.chapters.find(
        (c) => c.classLevel === classLevel && c.subjectId === subjectId && c.number === chNum,
      );
      if (ch) chapterId = ch.id;
    }

    if (!chapterId) {
      const cleanTitle = title.toLowerCase();
      const ch = context.chapters.find((c) => {
        if (c.classLevel !== classLevel || c.subjectId !== subjectId) return false;
        const cleanCh = c.title.toLowerCase();
        return cleanTitle.includes(cleanCh) || cleanCh.split(" ").some((w) => w.length > 5 && cleanTitle.includes(w));
      });
      if (ch) chapterId = ch.id;
    }
  }

  return {
    classLevel,
    subjectId,
    chapterId,
  };
}

/**
 * Auto-tags a video using title, duration, playlist mappings, and institute context.
 */
export function tagVideo(
  video: {
    title: string;
    description?: string | null;
    durationSeconds: number;
    playlistIds?: string[];
  },
  context: TaggingContext,
): VideoTagResult {
  const isShort = video.durationSeconds <= 180;
  const fullText = `${video.title} ${video.description || ""}`;

  let classLevel = extractClassLevel(video.title);
  let subjectSlug = extractSubjectSlug(video.title);
  let chapterId: string | null = null;
  let hasHighConfidence = false;

  // 1. Check playlist mappings FIRST (Playlist mappings win over title guesses)
  if (video.playlistIds && video.playlistIds.length > 0 && context.playlistMappings) {
    for (const pid of video.playlistIds) {
      const mapping = context.playlistMappings.get(pid);
      if (mapping) {
        if (mapping.classLevel != null) {
          classLevel = mapping.classLevel;
          hasHighConfidence = true;
        }
        if (mapping.subjectId != null) {
          const s = context.subjects.find((sub) => sub.id === mapping.subjectId);
          if (s) {
            subjectSlug = s.slug;
            hasHighConfidence = true;
          }
        }
        if (mapping.chapterId != null) {
          chapterId = mapping.chapterId;
          hasHighConfidence = true;
        }
      }
    }
  }

  // 2. Fallback to description for class if not found in title or playlist
  if (classLevel == null && video.description) {
    classLevel = extractClassLevel(video.description);
  }

  // 3. Fallback to channel default for subject (Mathematics is default for Quick2Learn)
  if (!subjectSlug) {
    if (
      /\b(?:dinesh|rajput|formula|one-shot|pyq|ncert|board|exam|mock)\b/i.test(fullText) ||
      !/\b(?:namita|bio|chem|history|civics)\b/i.test(fullText)
    ) {
      subjectSlug = "mathematics";
    }
  }

  // Map subject slug to subject ID in DB
  const subjectRecord = subjectSlug ? context.subjects.find((s) => s.slug === subjectSlug) : null;
  let subjectId = subjectRecord ? subjectRecord.id : null;

  // 4. Chapter matching if not already resolved by playlist
  if (!chapterId) {
    const chNum = extractChapterNumber(video.title);

    // Try number match
    if (classLevel && subjectId && chNum) {
      const ch = context.chapters.find(
        (c) => c.classLevel === classLevel && c.subjectId === subjectId && c.number === chNum,
      );
      if (ch) {
        chapterId = ch.id;
        hasHighConfidence = true;
      }
    }

    // Try title / topic fuzzy match
    if (!chapterId) {
      const lowerTitle = video.title.toLowerCase();

      // Topic keywords mappings
      const topicKeywords: Array<{
        pattern: RegExp;
        classLevel: number;
        slug: string;
        titleFragment: string;
      }> = [
        { pattern: /\bparabola\b/i, classLevel: 11, slug: "mathematics", titleFragment: "conic sections" },
        { pattern: /\bdot product\b/i, classLevel: 12, slug: "mathematics", titleFragment: "vector algebra" },
        { pattern: /\bline in space\b/i, classLevel: 12, slug: "mathematics", titleFragment: "three dimensional geometry" },
        { pattern: /\bmatrices\b/i, classLevel: 12, slug: "mathematics", titleFragment: "matrices" },
        { pattern: /\bdeterminants\b/i, classLevel: 12, slug: "mathematics", titleFragment: "determinants" },
        { pattern: /\bcontinuity\b/i, classLevel: 12, slug: "mathematics", titleFragment: "continuity" },
        { pattern: /\bintegrals?|समाकलन\b/i, classLevel: 12, slug: "mathematics", titleFragment: "integrals" },
        { pattern: /\breal numbers\b/i, classLevel: 10, slug: "mathematics", titleFragment: "real numbers" },
        { pattern: /\bcell\b/i, classLevel: 10, slug: "biology", titleFragment: "cell" },
        { pattern: /\btrigonometric\b/i, classLevel: 11, slug: "mathematics", titleFragment: "trigonometric" },
      ];

      for (const tk of topicKeywords) {
        if (tk.pattern.test(lowerTitle)) {
          if (!classLevel) classLevel = tk.classLevel;
          if (!subjectId) {
            const s = context.subjects.find((sub) => sub.slug === tk.slug);
            if (s) subjectId = s.id;
          }
          const ch = context.chapters.find(
            (c) =>
              c.classLevel === tk.classLevel &&
              c.title.toLowerCase().includes(tk.titleFragment),
          );
          if (ch) {
            chapterId = ch.id;
            hasHighConfidence = true;
            break;
          }
        }
      }

      // Check general chapter titles in DB
      if (!chapterId && classLevel && subjectId) {
        const ch = context.chapters.find((c) => {
          if (c.classLevel !== classLevel || c.subjectId !== subjectId) return false;
          const cleanChTitle = c.title.toLowerCase();
          return lowerTitle.includes(cleanChTitle);
        });
        if (ch) {
          chapterId = ch.id;
          hasHighConfidence = true;
        }
      }
    }
  }

  // 5. Faculty assignment
  let facultyId: string | null = null;
  const dineshFaculty = context.facultyList.find((f) => f.name.toLowerCase().includes("dinesh"));
  const namitaFaculty = context.facultyList.find((f) => f.name.toLowerCase().includes("namita"));

  if (/\b(?:namita)\b/i.test(fullText) || subjectSlug === "biology" || subjectSlug === "chemistry") {
    facultyId = namitaFaculty ? namitaFaculty.id : null;
  } else if (
    /\b(?:dinesh)\b/i.test(fullText) ||
    subjectSlug === "mathematics" ||
    (!subjectSlug && dineshFaculty)
  ) {
    facultyId = dineshFaculty ? dineshFaculty.id : null;
  }

  // 6. needsReview evaluation:
  // Must be true if:
  // - Class level is missing or uncertain
  // - Subject ID is null
  // - Or neither playlist nor confident chapter/keyword match was found
  const needsReview = !hasHighConfidence && (classLevel == null || subjectId == null || chapterId == null);

  return {
    classLevel,
    subjectId,
    chapterId,
    facultyId,
    isShort,
    needsReview,
  };
}
