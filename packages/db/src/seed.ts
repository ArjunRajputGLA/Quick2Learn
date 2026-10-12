import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

export async function seed(targetDbUrl?: string, options?: { prodOnly?: boolean }) {
  const connectionString =
    targetDbUrl ||
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/quick2learn";

  const pool = new Pool({ connectionString });
  const db = drizzle(pool, { schema });

  console.log(`Seeding database at ${connectionString.replace(/:[^:@]*@/, ":****@")} via Drizzle ORM...`);

  // 1. SUBJECTS
  const subjectsData = [
    {
      id: "a0000000-0000-0000-0000-000000000001",
      slug: "mathematics",
      name: "Mathematics",
      sortOrder: 1,
    },
    {
      id: "a0000000-0000-0000-0000-000000000002",
      slug: "physics",
      name: "Physics",
      sortOrder: 2,
    },
    {
      id: "a0000000-0000-0000-0000-000000000003",
      slug: "chemistry",
      name: "Chemistry",
      sortOrder: 3,
    },
    {
      id: "a0000000-0000-0000-0000-000000000004",
      slug: "biology",
      name: "Biology",
      sortOrder: 4,
    },
    {
      id: "a0000000-0000-0000-0000-000000000005",
      slug: "hindi",
      name: "Hindi",
      sortOrder: 5,
    },
  ];

  for (const s of subjectsData) {
    await db
      .insert(schema.subjects)
      .values(s)
      .onConflictDoUpdate({
        target: schema.subjects.slug,
        set: { name: s.name, sortOrder: s.sortOrder },
      });
  }
  console.log("  ✓ Subjects seeded (5 rows)");

  // 2. CHAPTERS
  const mathSubjectId = "a0000000-0000-0000-0000-000000000001";
  const class12Chapters = [
    { number: 1, title: "Relations and Functions", slug: "class-12-maths-ch-1-relations-and-functions", sortOrder: 1 },
    { number: 2, title: "Inverse Trigonometric Functions", slug: "class-12-maths-ch-2-inverse-trigonometric-functions", sortOrder: 2 },
    { number: 3, title: "Matrices", slug: "class-12-maths-ch-3-matrices", sortOrder: 3 },
    { number: 4, title: "Determinants", slug: "class-12-maths-ch-4-determinants", sortOrder: 4 },
    { number: 5, title: "Continuity and Differentiability", slug: "class-12-maths-ch-5-continuity-and-differentiability", sortOrder: 5 },
    { number: 6, title: "Application of Derivatives", slug: "class-12-maths-ch-6-application-of-derivatives", sortOrder: 6 },
    { number: 7, title: "Integrals", slug: "class-12-maths-ch-7-integrals", sortOrder: 7 },
    { number: 8, title: "Application of Integrals", slug: "class-12-maths-ch-8-application-of-integrals", sortOrder: 8 },
    { number: 9, title: "Differential Equations", slug: "class-12-maths-ch-9-differential-equations", sortOrder: 9 },
    { number: 10, title: "Vector Algebra", slug: "class-12-maths-ch-10-vector-algebra", sortOrder: 10 },
    { number: 11, title: "Three Dimensional Geometry", slug: "class-12-maths-ch-11-three-dimensional-geometry", sortOrder: 11 },
    { number: 12, title: "Linear Programming", slug: "class-12-maths-ch-12-linear-programming", sortOrder: 12 },
    { number: 13, title: "Probability", slug: "class-12-maths-ch-13-probability", sortOrder: 13 },
  ];

  for (const ch of class12Chapters) {
    await db
      .insert(schema.chapters)
      .values({
        subjectId: mathSubjectId,
        classLevel: 12,
        board: "cbse",
        number: ch.number,
        title: ch.title,
        slug: ch.slug,
        sortOrder: ch.sortOrder,
      })
      .onConflictDoNothing();
  }

  const class11Chapters = [
    { number: 1, title: "Sets", slug: "class-11-maths-ch-1-sets", sortOrder: 1 },
    { number: 2, title: "Relations and Functions", slug: "class-11-maths-ch-2-relations-and-functions", sortOrder: 2 },
    { number: 3, title: "Trigonometric Functions", slug: "class-11-maths-ch-3-trigonometric-functions", sortOrder: 3 },
    { number: 4, title: "Complex Numbers and Quadratic Equations", slug: "class-11-maths-ch-4-complex-numbers-and-quadratic-equations", sortOrder: 4 },
    { number: 5, title: "Linear Inequalities", slug: "class-11-maths-ch-5-linear-inequalities", sortOrder: 5 },
    { number: 6, title: "Permutations and Combinations", slug: "class-11-maths-ch-6-permutations-and-combinations", sortOrder: 6 },
    { number: 7, title: "Binomial Theorem", slug: "class-11-maths-ch-7-binomial-theorem", sortOrder: 7 },
    { number: 8, title: "Sequences and Series", slug: "class-11-maths-ch-8-sequences-and-series", sortOrder: 8 },
    { number: 9, title: "Straight Lines", slug: "class-11-maths-ch-9-straight-lines", sortOrder: 9 },
    { number: 10, title: "Conic Sections", slug: "class-11-maths-ch-10-conic-sections", sortOrder: 10 },
    { number: 11, title: "Introduction to Three Dimensional Geometry", slug: "class-11-maths-ch-11-introduction-to-three-dimensional-geometry", sortOrder: 11 },
    { number: 12, title: "Limits and Derivatives", slug: "class-11-maths-ch-12-limits-and-derivatives", sortOrder: 12 },
    { number: 13, title: "Statistics", slug: "class-11-maths-ch-13-statistics", sortOrder: 13 },
    { number: 14, title: "Probability", slug: "class-11-maths-ch-14-probability", sortOrder: 14 },
  ];

  for (const ch of class11Chapters) {
    await db
      .insert(schema.chapters)
      .values({
        subjectId: mathSubjectId,
        classLevel: 11,
        board: "cbse",
        number: ch.number,
        title: ch.title,
        slug: ch.slug,
        sortOrder: ch.sortOrder,
      })
      .onConflictDoNothing();
  }

  const chemistrySubjectId = "a0000000-0000-0000-0000-000000000003";
  const biologySubjectId = "a0000000-0000-0000-0000-000000000004";
  const hindiSubjectId = "a0000000-0000-0000-0000-000000000005";

  const class10Chapters = [
    { subjectId: mathSubjectId, board: "cbse" as const, number: 1, title: "Real Numbers", slug: "class-10-maths-ch-1-real-numbers", sortOrder: 1 },
    { subjectId: mathSubjectId, board: "cbse" as const, number: 2, title: "Polynomials", slug: "class-10-maths-ch-2-polynomials", sortOrder: 2 },
    { subjectId: mathSubjectId, board: "cbse" as const, number: 3, title: "Quadratic Equations", slug: "class-10-maths-ch-3-quadratic-equations", sortOrder: 3 },
    { subjectId: mathSubjectId, board: "cbse" as const, number: 4, title: "Triangles", slug: "class-10-maths-ch-4-triangles", sortOrder: 4 },
    { subjectId: mathSubjectId, board: "cbse" as const, number: 5, title: "Introduction to Trigonometry", slug: "class-10-maths-ch-5-introduction-to-trigonometry", sortOrder: 5 },
    { subjectId: chemistrySubjectId, board: "icse" as const, number: 1, title: "Periodic Properties and Variations", slug: "class-10-chem-ch-1-periodic-properties", sortOrder: 1 },
    { subjectId: chemistrySubjectId, board: "icse" as const, number: 2, title: "Chemical Bonding", slug: "class-10-chem-ch-2-chemical-bonding", sortOrder: 2 },
    { subjectId: chemistrySubjectId, board: "icse" as const, number: 3, title: "Study of Acids, Bases and Salts", slug: "class-10-chem-ch-3-acids-bases-salts", sortOrder: 3 },
    { subjectId: biologySubjectId, board: "icse" as const, number: 1, title: "Cell - The Structural Unit of Life", slug: "class-10-bio-ch-1-cell-unit-of-life", sortOrder: 1 },
    { subjectId: biologySubjectId, board: "icse" as const, number: 2, title: "Transpiration and Photosynthesis", slug: "class-10-bio-ch-2-photosynthesis", sortOrder: 2 },
  ];

  for (const ch of class10Chapters) {
    await db
      .insert(schema.chapters)
      .values({
        subjectId: ch.subjectId,
        classLevel: 10,
        board: ch.board,
        number: ch.number,
        title: ch.title,
        slug: ch.slug,
        sortOrder: ch.sortOrder,
      })
      .onConflictDoNothing();
  }

  const class9Chapters = [
    { subjectId: mathSubjectId, board: "cbse" as const, number: 1, title: "Number Systems", slug: "class-9-maths-ch-1-number-systems", sortOrder: 1 },
    { subjectId: mathSubjectId, board: "cbse" as const, number: 2, title: "Polynomials", slug: "class-9-maths-ch-2-polynomials", sortOrder: 2 },
    { subjectId: mathSubjectId, board: "cbse" as const, number: 3, title: "Coordinate Geometry", slug: "class-9-maths-ch-3-coordinate-geometry", sortOrder: 3 },
    { subjectId: mathSubjectId, board: "cbse" as const, number: 4, title: "Lines and Angles", slug: "class-9-maths-ch-4-lines-and-angles", sortOrder: 4 },
    { subjectId: chemistrySubjectId, board: "icse" as const, number: 1, title: "Matter in Our Surroundings", slug: "class-9-chem-ch-1-matter-in-our-surroundings", sortOrder: 1 },
    { subjectId: chemistrySubjectId, board: "icse" as const, number: 2, title: "Atomic Structure and Chemical Bonding", slug: "class-9-chem-ch-2-atomic-structure", sortOrder: 2 },
    { subjectId: biologySubjectId, board: "icse" as const, number: 1, title: "Plant and Animal Tissues", slug: "class-9-bio-ch-1-plant-animal-tissues", sortOrder: 1 },
    { subjectId: hindiSubjectId, board: "icse" as const, number: 1, title: "Sakhi (Kabir Das)", slug: "class-9-hindi-ch-1-sakhi-kabir-das", sortOrder: 1 },
    { subjectId: hindiSubjectId, board: "icse" as const, number: 2, title: "Girdhar Ki Kundaliyan", slug: "class-9-hindi-ch-2-girdhar-ki-kundaliyan", sortOrder: 2 },
    { subjectId: hindiSubjectId, board: "icse" as const, number: 3, title: "Swarg Bana Sakte Hain", slug: "class-9-hindi-ch-3-swarg-bana-sakte-hain", sortOrder: 3 },
    { subjectId: hindiSubjectId, board: "icse" as const, number: 4, title: "Baat Athanni Ki", slug: "class-9-hindi-ch-4-baat-athanni-ki", sortOrder: 4 },
    { subjectId: hindiSubjectId, board: "icse" as const, number: 5, title: "Kaki", slug: "class-9-hindi-ch-5-kaki", sortOrder: 5 },
  ];

  for (const ch of class9Chapters) {
    await db
      .insert(schema.chapters)
      .values({
        subjectId: ch.subjectId,
        classLevel: 9,
        board: ch.board,
        number: ch.number,
        title: ch.title,
        slug: ch.slug,
        sortOrder: ch.sortOrder,
      })
      .onConflictDoNothing();
  }
  console.log("  ✓ Chapters seeded (49 rows across classes IX, X, XI, XII)");

  if (!options?.prodOnly) {
    // 3. FACULTY
  const facultyData = [
    {
      id: "f0000000-0000-0000-0000-000000000001",
      name: "Mr. Dinesh Singh Rajput",
      slug: "dinesh-singh-rajput",
      designation: "Founder & Head of Senior Mathematics",
      bio: "Over 25 years of teaching excellence in Senior Secondary Mathematics in Mathura, mentoring thousands of CBSE & ISC students to 99+ percentile board scores.",
      photoKey: "/images/assets/Dinesh Singh Rajput.jpeg",
      subjectIds: ["a0000000-0000-0000-0000-000000000001"],
      achievements: [
        {
          title: "25+ Years Teaching Mathematics",
          description: "Over 25 years teaching Senior Secondary Mathematics in Mathura with continuous district & state board rankers.",
        },
        {
          title: "Best Teacher Award 2015",
          description: "Conferred Best Teacher Award (2015) by Sharda Group for extraordinary pedagogical excellence.",
        },
        {
          title: "Teacher Innovation Award 2019",
          description: "Conferred Teacher Innovation Award (2019) by Shri Aurobindo Society for innovative conceptual learning frameworks.",
        },
        {
          title: "Certificate from the HRD Minister",
          description: "Conferred Certificate of Honour by the HRD Minister in July 2015 for outstanding CBSE Senior School results.",
        },
      ],
      sortOrder: 1,
      isPublished: true,
    },
    {
      id: "f0000000-0000-0000-0000-000000000002",
      name: "Mrs. Namita Singh Rajput",
      slug: "namita-singh-rajput",
      designation: "Head of ICSE Sciences & Hindi",
      bio: "Specialist educator in ICSE Secondary Sciences and Hindi literature with a focus on chemical reactions, equation balancing, anatomical diagrams, and rigorous board paper preparation.",
      photoKey: "faculty/faculty-namita.webp",
      subjectIds: ["a0000000-0000-0000-0000-000000000003", "a0000000-0000-0000-0000-000000000004", "a0000000-0000-0000-0000-000000000005"],
      achievements: [
        { title: "ICSE Curriculum Expert", description: "15+ years guiding students to distinction in ICSE Board examinations" },
      ],
      sortOrder: 2,
      isPublished: true,
    },
  ];

  for (const f of facultyData) {
    await db
      .insert(schema.faculty)
      .values(f)
      .onConflictDoUpdate({
        target: schema.faculty.slug,
        set: {
          name: f.name,
          designation: f.designation,
          bio: f.bio,
          photoKey: f.photoKey,
          achievements: f.achievements,
          subjectIds: f.subjectIds,
          isPublished: f.isPublished,
          sortOrder: f.sortOrder,
        },
      });
  }
  console.log("  ✓ Faculty seeded (2 rows)");

  // 4. BATCHES & FEE PLANS
  const dineshFacultyId = "f0000000-0000-0000-0000-000000000001";
  const namitaFacultyId = "f0000000-0000-0000-0000-000000000002";
  const batch1Id = "b0000000-0000-0000-0000-000000000001";
  const batch2Id = "b0000000-0000-0000-0000-000000000002";

  await db
    .insert(schema.batches)
    .values({
      id: batch1Id,
      slug: "class-12-cbse-mathematics-masterclass-2026",
      title: "Class XII CBSE Mathematics Comprehensive Masterclass",
      subtitle: "Full Board Syllabus Mastery & Mock Drill with Dinesh Sir",
      description: "Intensive classroom and online program covering complete NCERT syllabus, previous 15 years board questions, and weekly mock test series in Mathura.",
      classLevel: 12,
      board: "cbse",
      subjectId: "a0000000-0000-0000-0000-000000000001",
      facultyId: "f0000000-0000-0000-0000-000000000001",
      coverKey: "covers/batch-class12-math.webp",
      mode: "offline",
      scheduleText: "Mon, Wed, Fri 4:30 PM – 6:00 PM IST",
      locationText: "Quick2Learn Institute Campus, Mathura, UP",
      startDate: new Date("2026-04-15T11:30:00Z"),
      endDate: new Date("2027-02-28T11:30:00Z"),
      seatsTotal: 40,
      status: "open",
      outcomes: [
        "100% Board Question Mastery",
        "Weekly Step-by-Step Problem Solving",
        "Complete Calculus & 3D Geometry Drills",
      ],
      syllabus: [
        {
          module: "Relations, Functions & Matrices",
          notes: "Board foundations: Relations, inverse trigonometric functions, matrix algebra, and determinants.",
          chapters: [
            { title: "Relations and Functions", slug: "class-12-maths-ch-1-relations-and-functions" },
            { title: "Inverse Trigonometric Functions", slug: "class-12-maths-ch-2-inverse-trigonometric-functions" },
            { title: "Matrices", slug: "class-12-maths-ch-3-matrices" },
            { title: "Determinants", slug: "class-12-maths-ch-4-determinants" },
          ],
        },
        {
          module: "Differential & Integral Calculus",
          notes: "35+ marks of CBSE Board exam: Continuity, derivatives, integrals, and differential equations.",
          chapters: [
            { title: "Continuity and Differentiability", slug: "class-12-maths-ch-5-continuity-and-differentiability" },
            { title: "Application of Derivatives", slug: "class-12-maths-ch-6-application-of-derivatives" },
            { title: "Integrals", slug: "class-12-maths-ch-7-integrals" },
            { title: "Application of Integrals", slug: "class-12-maths-ch-8-application-of-integrals" },
            { title: "Differential Equations", slug: "class-12-maths-ch-9-differential-equations" },
          ],
        },
        {
          module: "Vectors, 3D Geometry & Probability",
          notes: "Spatial coordinate geometry, line/plane vector projections, and probability distributions.",
          chapters: [
            { title: "Vector Algebra", slug: "class-12-maths-ch-10-vector-algebra" },
            { title: "Three Dimensional Geometry", slug: "class-12-maths-ch-11-three-dimensional-geometry" },
            { title: "Linear Programming", slug: "class-12-maths-ch-12-linear-programming" },
            { title: "Probability", slug: "class-12-maths-ch-13-probability" },
          ],
        },
      ],
      faqs: [
        { question: "Are revision test papers included?", answer: "Yes, full board-style mock exams are conducted every Sunday." },
      ],
      whatsappGroupUrl: "https://chat.whatsapp.com/Quick2LearnClass12",
      isFeatured: true,
    })
    .onConflictDoUpdate({
      target: schema.batches.slug,
      set: {
        title: "Class XII CBSE Mathematics Comprehensive Masterclass",
        status: "open",
        isFeatured: true,
        syllabus: [
          {
            module: "Relations, Functions & Matrices",
            notes: "Board foundations: Relations, inverse trigonometric functions, matrix algebra, and determinants.",
            chapters: [
              { title: "Relations and Functions", slug: "class-12-maths-ch-1-relations-and-functions" },
              { title: "Inverse Trigonometric Functions", slug: "class-12-maths-ch-2-inverse-trigonometric-functions" },
              { title: "Matrices", slug: "class-12-maths-ch-3-matrices" },
              { title: "Determinants", slug: "class-12-maths-ch-4-determinants" },
            ],
          },
          {
            module: "Differential & Integral Calculus",
            notes: "35+ marks of CBSE Board exam: Continuity, derivatives, integrals, and differential equations.",
            chapters: [
              { title: "Continuity and Differentiability", slug: "class-12-maths-ch-5-continuity-and-differentiability" },
              { title: "Application of Derivatives", slug: "class-12-maths-ch-6-application-of-derivatives" },
              { title: "Integrals", slug: "class-12-maths-ch-7-integrals" },
              { title: "Application of Integrals", slug: "class-12-maths-ch-8-application-of-integrals" },
              { title: "Differential Equations", slug: "class-12-maths-ch-9-differential-equations" },
            ],
          },
          {
            module: "Vectors, 3D Geometry & Probability",
            notes: "Spatial coordinate geometry, line/plane vector projections, and probability distributions.",
            chapters: [
              { title: "Vector Algebra", slug: "class-12-maths-ch-10-vector-algebra" },
              { title: "Three Dimensional Geometry", slug: "class-12-maths-ch-11-three-dimensional-geometry" },
              { title: "Linear Programming", slug: "class-12-maths-ch-12-linear-programming" },
              { title: "Probability", slug: "class-12-maths-ch-13-probability" },
            ],
          },
        ],
      },
    });

  await db
    .insert(schema.batches)
    .values({
      id: batch2Id,
      slug: "class-11-cbse-mathematics-foundation-2026",
      title: "Class XI CBSE Mathematics Foundation Program",
      subtitle: "Bridge Course & Senior Secondary Algebra Prep",
      description: "Early conceptual bridge program focusing on Sets, Trigonometry, Permutations, and Introduction to Calculus.",
      classLevel: 11,
      board: "cbse",
      subjectId: "a0000000-0000-0000-0000-000000000001",
      facultyId: "f0000000-0000-0000-0000-000000000001",
      coverKey: "covers/batch-class11-math.webp",
      mode: "hybrid",
      scheduleText: "Tue, Thu, Sat 4:30 PM – 6:00 PM IST",
      locationText: "Quick2Learn Institute Campus, Mathura, UP",
      startDate: new Date("2026-05-01T11:30:00Z"),
      endDate: new Date("2027-02-15T11:30:00Z"),
      seatsTotal: 35,
      status: "open",
      outcomes: ["Strong Foundation for Class XII", "Algebra & Trigonometry Clarity"],
      syllabus: [
        { module: "Algebra Essentials", notes: "Sets, Relations, Complex Numbers" },
      ],
      faqs: [
        { question: "Is this suitable for both CBSE and State Boards?", answer: "Yes, foundation concepts align with NCERT." },
      ],
      isFeatured: true,
    })
    .onConflictDoUpdate({
      target: schema.batches.slug,
      set: {
        title: "Class XI CBSE Mathematics Foundation Program",
        status: "open",
        isFeatured: true,
      },
    });

  const batch3Id = "b0000000-0000-0000-0000-000000000003";
  await db
    .insert(schema.batches)
    .values({
      id: batch3Id,
      slug: "class-10-icse-science-mastery-2026",
      title: "Class X ICSE Science & Biology Mastery Batch",
      subtitle: "Comprehensive Chemistry & Biology with Namita Ma'am",
      description: "Complete ICSE board preparation focusing on chemical equations, periodic trends, plant physiology diagrams, and past 10 years board questions.",
      classLevel: 10,
      board: "icse",
      subjectId: chemistrySubjectId,
      facultyId: namitaFacultyId,
      coverKey: "covers/batch-class10-icse.webp",
      mode: "offline",
      scheduleText: "Mon, Wed, Fri 5:30 PM – 7:00 PM IST",
      locationText: "Quick2Learn Institute Campus, Mathura, UP",
      startDate: new Date("2026-04-20T11:30:00Z"),
      endDate: new Date("2027-02-20T11:30:00Z"),
      seatsTotal: 30,
      status: "open",
      outcomes: ["ICSE Science 95+ Score Target", "Diagram & Equation Mastery"],
      syllabus: [
        { module: "ICSE Chemistry", notes: "Periodic table, Chemical bonding, Acids & bases" },
        { module: "ICSE Biology", notes: "Cell structure, Photosynthesis, Human physiology" },
      ],
      faqs: [
        { question: "Are ICSE biology diagrams practiced in class?", answer: "Yes, step-by-step drawing sessions are held each week." },
      ],
      isFeatured: false,
    })
    .onConflictDoUpdate({
      target: schema.batches.slug,
      set: {
        title: "Class X ICSE Science & Biology Mastery Batch",
        status: "open",
      },
    });

  const batch4Id = "b0000000-0000-0000-0000-000000000004";
  await db
    .insert(schema.batches)
    .values({
      id: batch4Id,
      slug: "class-10-cbse-board-booster-2026",
      title: "Class X CBSE Mathematics Board Booster 2026–27",
      subtitle: "Target 100/100 in Class 10 Board Maths with Dinesh Sir",
      description: "Rigorous drilling of Real Numbers, Polynomials, Trigonometry, and Geometry with weekly NCERT and Exemplar problem sheets.",
      classLevel: 10,
      board: "cbse",
      subjectId: mathSubjectId,
      facultyId: dineshFacultyId,
      coverKey: "covers/batch-class10-math.webp",
      mode: "hybrid",
      scheduleText: "Tue, Thu, Sat 6:00 PM – 7:30 PM IST",
      locationText: "Quick2Learn Institute Campus, Mathura, UP",
      startDate: new Date("2026-04-18T11:30:00Z"),
      endDate: new Date("2027-02-20T11:30:00Z"),
      seatsTotal: 40,
      status: "open",
      outcomes: ["100/100 Board Strategy", "Complete NCERT & Exemplar Drill"],
      syllabus: [
        { module: "Algebra & Number Systems", notes: "Real numbers, Polynomials, Quadratics" },
        { module: "Trigonometry & Geometry", notes: "Heights & Distances, Circles, Triangles" },
      ],
      faqs: [
        { question: "Are previous year board papers solved?", answer: "Yes, past 15 years CBSE papers are solved in classroom sessions." },
      ],
      isFeatured: false,
    })
    .onConflictDoUpdate({
      target: schema.batches.slug,
      set: {
        title: "Class X CBSE Mathematics Board Booster 2026–27",
        status: "open",
      },
    });
  const batch5Id = "b0000000-0000-0000-0000-000000000005";
  await db
    .insert(schema.batches)
    .values({
      id: batch5Id,
      slug: "class-12-calculus-crash-course-draft",
      title: "Class XII Calculus Rapid Revision Crash Course (Draft)",
      subtitle: "Unreleased intensive draft batch for board aspirants",
      description: "Comprehensive 30-day revision of differential and integral calculus formulas and board exam questions.",
      classLevel: 12,
      board: "cbse",
      subjectId: mathSubjectId,
      facultyId: dineshFacultyId,
      mode: "online",
      scheduleText: "Daily 7:00 PM – 8:30 PM IST",
      locationText: "Live Online Google Meet / Zoom",
      startDate: new Date("2026-11-01T11:30:00Z"),
      endDate: new Date("2026-12-05T11:30:00Z"),
      seatsTotal: 50,
      status: "draft",
      outcomes: [
        "Calculus Speed Problem Solving",
        "Integration Tricks and Shortcut Methods",
        "High-Yield Board Question Bank Practice",
      ],
      syllabus: [
        { module: "Calculus Crash Mastery", notes: "Limits, Continuity, Derivatives, Integrals" },
      ],
      faqs: [
        { question: "Is this draft batch accessible to public?", answer: "No, staff preview only until release." },
      ],
      isFeatured: false,
    })
    .onConflictDoUpdate({
      target: schema.batches.slug,
      set: {
        title: "Class XII Calculus Rapid Revision Crash Course (Draft)",
        status: "draft",
      },
    });

  const batch6Id = "b0000000-0000-0000-0000-000000000006";
  await db
    .insert(schema.batches)
    .values({
      id: batch6Id,
      slug: "class-12-cbse-maths-early-bird-closed",
      title: "Class XII CBSE Mathematics Early Bird Super Batch",
      subtitle: "Full Cohort Admissions Closed for Spring 2026",
      description: "High-intensity classroom coaching for senior secondary mathematics toppers. All seats filled.",
      classLevel: 12,
      board: "cbse",
      subjectId: mathSubjectId,
      facultyId: dineshFacultyId,
      coverKey: "covers/batch-class12-math.webp",
      mode: "offline",
      scheduleText: "Mon, Wed, Fri 3:00 PM – 4:30 PM IST",
      locationText: "Quick2Learn Campus, Mathura, UP",
      startDate: new Date("2026-03-15T11:30:00Z"),
      endDate: new Date("2027-02-01T11:30:00Z"),
      seatsTotal: 25,
      status: "closed",
      outcomes: [
        "Complete Advanced Mathematics Coverage",
        "Exclusive Sunday Test Series & Rank List",
      ],
      syllabus: [
        { module: "Full Board Syllabus", notes: "All chapters covered from Basics to Exemplar" },
      ],
      faqs: [
        { question: "Can I still join this cohort?", answer: "Admissions are closed. You can register for the waitlist." },
      ],
      isFeatured: false,
    })
    .onConflictDoUpdate({
      target: schema.batches.slug,
      set: {
        title: "Class XII CBSE Mathematics Early Bird Super Batch",
        status: "closed",
      },
    });

  console.log("  ✓ Batches seeded (6 rows: open, closed, draft)");

  // Fee Plans
  await db
    .insert(schema.batchFeePlans)
    .values([
      {
        batchId: batch1Id,
        name: "Full Annual Course (One-Time Payment)",
        totalPaise: 1800000,
        originalPaise: 2400000,
        instalments: [{ label: "Annual Enrollment", amount_paise: 1800000, due_date: "2026-04-15" }],
        isActive: true,
      },
      {
        batchId: batch1Id,
        name: "Two-Instalment Plan",
        totalPaise: 2000000,
        originalPaise: 2400000,
        instalments: [
          { label: "Instalment 1", amount_paise: 1000000, due_date: "2026-04-15" },
          { label: "Instalment 2", amount_paise: 1000000, due_date: "2026-09-15" },
        ],
        isActive: true,
      },
      {
        batchId: batch2Id,
        name: "Class XI Foundation Annual Plan",
        totalPaise: 1500000,
        originalPaise: 1800000,
        instalments: [{ label: "Single Payment", amount_paise: 1500000, due_date: "2026-05-01" }],
        isActive: true,
      },
      {
        batchId: batch3Id,
        name: "Class X ICSE Science Annual Course",
        totalPaise: 1400000,
        originalPaise: 1750000,
        instalments: [{ label: "Annual Enrollment", amount_paise: 1400000, due_date: "2026-04-20" }],
        isActive: true,
      },
      {
        batchId: batch4Id,
        name: "Class X CBSE Mathematics Booster Annual Plan",
        totalPaise: 1400000,
        originalPaise: 1700000,
        instalments: [{ label: "Annual Enrollment", amount_paise: 1400000, due_date: "2026-04-18" }],
        isActive: true,
      },
      {
        batchId: batch5Id,
        name: "Calculus Crash Course One-Time Fee",
        totalPaise: 600000,
        originalPaise: 900000,
        instalments: [{ label: "Full Course Payment", amount_paise: 600000, due_date: "2026-11-01" }],
        isActive: true,
      },
      {
        batchId: batch6Id,
        name: "Early Bird Full Payment",
        totalPaise: 1600000,
        originalPaise: 2000000,
        instalments: [{ label: "Full Payment", amount_paise: 1600000, due_date: "2026-03-15" }],
        isActive: true,
      },
    ])
    .onConflictDoNothing();
  console.log("  ✓ Batch fee plans seeded (7 rows)");

  // 5. RESULTS
  const resultsData = [
    {
      studentName: "Aarav Sharma",
      exam: "CBSE Class XII Maths",
      year: 2025,
      scoreText: "100/100",
      photoKey: null,
      isFeatured: true,
      sortOrder: 1,
    },
    {
      studentName: "Priya Agrawal",
      exam: "CBSE Class XII Maths",
      year: 2025,
      scoreText: "99/100",
      photoKey: null,
      isFeatured: true,
      sortOrder: 2,
    },
    {
      studentName: "Rohan Verma",
      exam: "ICSE Class X Science",
      year: 2025,
      scoreText: "98/100",
      photoKey: null,
      isFeatured: true,
      sortOrder: 3,
    },
    {
      studentName: "Sneha Gupta",
      exam: "CBSE Class X Maths",
      year: 2025,
      scoreText: "99/100",
      photoKey: null,
      isFeatured: true,
      sortOrder: 4,
    },
    {
      studentName: "Devendra Singh",
      exam: "CBSE Class XII Maths",
      year: 2024,
      scoreText: "98/100",
      photoKey: null,
      isFeatured: true,
      sortOrder: 5,
    },
    {
      studentName: "Megha Bansal",
      exam: "CBSE Class XII Maths",
      year: 2024,
      scoreText: "97/100",
      photoKey: null,
      isFeatured: false,
      sortOrder: 6,
    },
    {
      studentName: "Kartik Soni",
      exam: "ICSE Class X Science",
      year: 2024,
      scoreText: "96/100",
      photoKey: null,
      isFeatured: false,
      sortOrder: 7,
    },
    {
      studentName: "Ananya Saxena",
      exam: "CBSE Class X Maths",
      year: 2024,
      scoreText: "98/100",
      photoKey: null,
      isFeatured: false,
      sortOrder: 8,
    },
  ];

  for (const r of resultsData) {
    await db.insert(schema.results).values(r).onConflictDoNothing();
  }
  console.log("  ✓ Results seeded (8 rows)");

  // 7. YOUTUBE PLAYLISTS
  const playlistsData = [
    {
      id: "pl-class12-board-prep",
      title: "Class 12 CBSE Board Exam Booster (PYQ & Marathon)",
      description: "Complete marathon problem-solving series covering definite integrals, matrices, vectors, and top expected board exam questions with Dinesh Sir.",
      thumbnailUrl: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&auto=format&fit=crop&q=80",
      itemCount: 18,
      classLevel: 12,
      subjectId: mathSubjectId,
    },
    {
      id: "pl-class11-strong-concepts",
      title: "Class 11 Foundations & Core Concepts Marathon",
      description: "Master high-yield foundations in Trigonometry, Sets, and Algebra before stepping into Class 12 board preparations.",
      thumbnailUrl: "https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=600&auto=format&fit=crop&q=80",
      itemCount: 14,
      classLevel: 11,
      subjectId: mathSubjectId,
    },
    {
      id: "pl-class10-quick-revision",
      title: "Class 10 CBSE & ICSE Fast-Track Revision",
      description: "Crucial formulas, chemical balancing shortcuts, and biology diagram guidelines for secondary board candidates.",
      thumbnailUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&auto=format&fit=crop&q=80",
      itemCount: 12,
      classLevel: 10,
      subjectId: chemistrySubjectId,
    },
    {
      id: "pl-class12-doubt-solving",
      title: "Class 12 Doubt Solving & Tricky Board Problems",
      description: "Direct classroom doubt-clearing sessions breaking down complex proofs, determinants, and application of derivatives.",
      thumbnailUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80",
      itemCount: 15,
      classLevel: 12,
      subjectId: mathSubjectId,
    },
    {
      id: "PLYAOIEphFVGaPMuJA66CKmgdngG-6jrDd",
      title: "ICSE 9 HINDI",
      description: "ICSE Class 9 Hindi literature (Sahitya Sagar) and grammar discussions with comprehensive chapter explanations and notes.",
      thumbnailUrl: "https://i.ytimg.com/vi/bu6Hmff0m0U/hqdefault.jpg",
      itemCount: 11,
      classLevel: 9,
      subjectId: hindiSubjectId,
    },
  ];

  for (const pl of playlistsData) {
    await db
      .insert(schema.youtubePlaylists)
      .values(pl)
      .onConflictDoUpdate({
        target: schema.youtubePlaylists.id,
        set: {
          title: pl.title,
          description: pl.description,
          thumbnailUrl: pl.thumbnailUrl,
          itemCount: pl.itemCount,
        },
      });
  }
  console.log("  ✓ YouTube Playlists seeded (5 rows)");

  // 8. YOUTUBE LECTURES
  const youtubeVideosData = [
    {
      id: "yt-math-12-matrices-oneshot",
      title: "Class 12 CBSE Maths: Matrices & Determinants One-Shot Revision | Dinesh Sir",
      description: "Complete chapter coverage of Matrices, operations, adjoint, and inverse calculation with board PYQs explained step-by-step by Dinesh Singh Rajput.",
      publishedAt: new Date("2026-01-10T14:30:00Z"),
      durationSeconds: 3450,
      thumbnailUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80",
      viewCount: 18450,
      likeCount: 1620,
      classLevel: 12,
      subjectId: mathSubjectId,
      facultyId: dineshFacultyId,
      isPublished: true,
      needsReview: false,
    },
    {
      id: "yt-math-12-continuity-calculus",
      title: "Class 12 CBSE Maths: Continuity and Differentiability Masterclass | Dinesh Sir",
      description: "Master limits, continuity proofs, chain rule, and logarithmic differentiation with Dinesh Sir's intuitive problem solving methods.",
      publishedAt: new Date("2026-01-18T16:00:00Z"),
      durationSeconds: 4120,
      thumbnailUrl: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=80",
      viewCount: 22100,
      likeCount: 1980,
      classLevel: 12,
      subjectId: mathSubjectId,
      facultyId: dineshFacultyId,
      isPublished: true,
      needsReview: false,
    },
    {
      id: "yt-math-11-trigonometry-identities",
      title: "Class 11 CBSE Maths: Trigonometric Functions & Formula Hacks | Dinesh Sir",
      description: "Shortcuts to remember all trigonometric identities, multiple angles, and principal solutions for Senior Secondary foundation.",
      publishedAt: new Date("2026-01-25T11:00:00Z"),
      durationSeconds: 2890,
      thumbnailUrl: "https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=600&auto=format&fit=crop&q=80",
      viewCount: 14200,
      likeCount: 1150,
      classLevel: 11,
      subjectId: mathSubjectId,
      facultyId: dineshFacultyId,
      isPublished: true,
      needsReview: false,
    },
    {
      id: "yt-chem-10-periodic-properties",
      title: "Class 10 ICSE Chemistry: Periodic Properties & Group Variations | Namita Ma'am",
      description: "In-depth ICSE chemistry board revision covering ionization energy, electronegativity trends, atomic radius, and reasoning questions.",
      publishedAt: new Date("2026-02-02T15:30:00Z"),
      durationSeconds: 2640,
      thumbnailUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&auto=format&fit=crop&q=80",
      viewCount: 12800,
      likeCount: 1340,
      classLevel: 10,
      subjectId: chemistrySubjectId,
      facultyId: namitaFacultyId,
      isPublished: true,
      needsReview: false,
    },
    {
      id: "yt-bio-10-cell-photosynthesis",
      title: "Class 10 ICSE Biology: Photosynthesis & Plant Physiology Diagrams | Namita Ma'am",
      description: "Step-by-step ICSE diagram drawing guide, light reaction equations, and expected board question formats with Namita Ma'am.",
      publishedAt: new Date("2026-02-10T12:00:00Z"),
      durationSeconds: 3100,
      thumbnailUrl: "https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=600&auto=format&fit=crop&q=80",
      viewCount: 15400,
      likeCount: 1420,
      classLevel: 10,
      subjectId: biologySubjectId,
      facultyId: namitaFacultyId,
      isPublished: true,
      needsReview: false,
    },
    {
      id: "yt-math-12-definite-integrals",
      title: "Class 12 CBSE Maths: Definite Integrals Properties & PYQ Marathon | Dinesh Sir",
      description: "Solving the 8 essential properties of definite integrals and top 15 previous board questions with Dinesh Singh Rajput.",
      publishedAt: new Date("2026-02-20T17:00:00Z"),
      durationSeconds: 4500,
      thumbnailUrl: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&auto=format&fit=crop&q=80",
      viewCount: 29500,
      likeCount: 2600,
      classLevel: 12,
      subjectId: mathSubjectId,
      facultyId: dineshFacultyId,
      isPublished: true,
      needsReview: false,
    },
    {
      id: "bu6Hmff0m0U",
      title: "ICSE Class 9 Hindi: Sakhi (Kabir Das) Explanation & Notes | Namita Ma'am",
      description: "Line-by-line explanation of Kabir Das Sakhi, word meanings, and ICSE Class 9 board question answers by Namita Ma'am.",
      publishedAt: new Date("2026-03-18T10:00:00Z"),
      durationSeconds: 4200,
      thumbnailUrl: "https://i.ytimg.com/vi/bu6Hmff0m0U/hqdefault.jpg",
      viewCount: 14500,
      likeCount: 1320,
      classLevel: 9,
      subjectId: hindiSubjectId,
      facultyId: namitaFacultyId,
      isPublished: true,
      needsReview: false,
    },
  ];

  const allDbChapters = await db
    .select({ id: schema.chapters.id, slug: schema.chapters.slug })
    .from(schema.chapters);
  const chapterIdBySlug = Object.fromEntries(
    allDbChapters.map((c) => [c.slug, c.id]),
  );

  const videoChapterMapping: Record<string, string> = {
    "yt-math-12-matrices-oneshot": "class-12-maths-ch-3-matrices",
    "yt-math-12-continuity-calculus": "class-12-maths-ch-5-continuity-and-differentiability",
    "yt-math-12-definite-integrals": "class-12-maths-ch-7-integrals",
    "yt-math-11-trigonometry-identities": "class-11-maths-ch-3-trigonometric-functions",
    "bu6Hmff0m0U": "class-9-hindi-ch-1-sakhi-kabir-das",
  };

  for (const v of youtubeVideosData) {
    const slugKey = videoChapterMapping[v.id];
    const assignedChapterId = (slugKey && chapterIdBySlug[slugKey]) || null;
    await db
      .insert(schema.youtubeVideos)
      .values({
        ...v,
        chapterId: assignedChapterId,
      })
      .onConflictDoUpdate({
        target: schema.youtubeVideos.id,
        set: {
          title: v.title,
          description: v.description,
          durationSeconds: v.durationSeconds,
          thumbnailUrl: v.thumbnailUrl,
          viewCount: v.viewCount,
          likeCount: v.likeCount,
          isPublished: v.isPublished,
          chapterId: assignedChapterId,
        },
      });
  }
  console.log("  ✓ YouTube videos seeded (7 lectures)");

  // 8.5 TESTIMONIALS (Seeded after YouTube videos to satisfy videoId FK)
  const testimonialsData = [
    {
      studentName: "Aarav Sharma",
      classLevel: 12,
      year: 2025,
      quote: "Dinesh Sir simplified calculus and 3D vectors to a degree where board questions felt almost routine. Scored 100/100 in CBSE Mathematics thanks to continuous classroom testing.",
      photoKey: "testimonials/aarav.webp",
      videoId: "yt-math-12-matrices-oneshot",
      isPublished: true,
      sortOrder: 1,
    },
    {
      studentName: "Priya Agrawal",
      classLevel: 10,
      year: 2025,
      quote: "Namita Ma'am's chemistry balancing shortcuts and biology anatomical diagram guidelines were exactly what appeared in our ICSE board examinations. Scored 98% in ICSE Sciences.",
      photoKey: "testimonials/priya.webp",
      videoId: "yt-chem-10-periodic-properties",
      isPublished: true,
      sortOrder: 2,
    },
    {
      studentName: "Shubham Verma",
      classLevel: 12,
      year: 2025,
      quote: "Watch how Dinesh Sir's calculus PYQ marathon and Sunday test series helped me secure district rank in Class 12 CBSE Mathematics.",
      photoKey: "testimonials/shubham.webp",
      videoId: "yt-math-12-definite-integrals",
      isPublished: true,
      sortOrder: 3,
    },
    {
      studentName: "Rohan Khandelwal",
      classLevel: 12,
      year: 2024,
      quote: "The discipline and regular doubt clearing sessions at Quick2Learn Mathura made all the difference. Dinesh Sir personally reviews every student's answer presentation.",
      photoKey: "testimonials/rohan.webp",
      videoId: null,
      isPublished: true,
      sortOrder: 4,
    },
    {
      studentName: "Devendra Singh",
      classLevel: 12,
      year: 2024,
      quote: "Every difficult concept in Definite Integrals and Matrices became crystal clear with Dinesh Sir's daily practice problem sheets. Scored 98/100 in CBSE Maths!",
      photoKey: "testimonials/devendra.webp",
      videoId: null,
      isPublished: true,
      sortOrder: 5,
    },
    {
      studentName: "Sneha Gupta",
      classLevel: 10,
      year: 2025,
      quote: "The weekly practice sheets for geometry and trigonometry built immense speed and accuracy for Class 10 CBSE Board Exams.",
      photoKey: "testimonials/sneha.webp",
      videoId: null,
      isPublished: true,
      sortOrder: 6,
    },
  ];

  for (const t of testimonialsData) {
    await db.insert(schema.testimonials).values(t).onConflictDoNothing();
  }
    console.log("  ✓ Testimonials seeded (6 rows)");
  }

  // 9. SITE SETTINGS
  const siteSettingsData = [
    {
      key: "contact",
      value: {
        phone: "+91 76688 75809",
        whatsapp: "+91 76688 75809",
        email: "contact@quick2learn.in",
        support_hours: "Mon–Sat 9:00 AM – 7:00 PM IST",
      },
    },
    {
      key: "address",
      value: {
        line1: "Mathura",
        city: "Mathura",
        state: "Uttar Pradesh",
        pincode: "281004",
        landmark: "Mathura City",
      },
    },
    {
      key: "socials",
      value: {
        youtube: "https://www.youtube.com/@Quick2Learn",
        youtube_channel_id: "UCy1XY9I1Yeyy59Y5LMgqa8g",
        instagram: "https://instagram.com/quick2learn.in",
        facebook: "https://facebook.com/quick2learn.in",
        twitter: "https://twitter.com/Quick2Learn",
      },
    },
    {
      key: "hero",
      value: {
        headline: "Maths made quick and easy",
        subheadline: "Master Class IX–XII Mathematics, Chemistry and Biology with conceptual clarity, Kota-level rigor, and 25+ years of trusted teaching legacy in Mathura.",
        primary_cta_text: "Join for Free",
        primary_cta_href: "/register",
        secondary_cta_text: "Explore free lectures",
        secondary_cta_href: "/#lectures",
      },
    },
    {
      key: "hero_tiles",
      value: {
        badge_new_lecture: "Newest Lecture",
        badge_batch: "Admissions open",
        featured_batch_slug: "class-12-cbse-mathematics-masterclass-2026",
        results_badge: "Proven Results",
        results_title: "100/100 Top Score & 98.4% Distinction Rate",
        results_subtitle: "Recognised by the HRD Minister for outstanding CBSE board results.",
        results_image_url: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=600&auto=format&fit=crop&q=80",
        results_cta_text: "View Hall of Fame",
        results_cta_href: "/#results",
      },
    },
    {
      key: "achievements",
      value: [
        {
          icon: "Award",
          text: "25+ years teaching Mathematics",
        },
        {
          icon: "Medal",
          text: "Best Teacher Award 2015",
        },
        {
          icon: "Lightbulb",
          text: "Teacher Innovation Award 2019",
        },
        {
          icon: "GraduationCap",
          text: "Recognised by the HRD Minister for CBSE results (2015)",
        },
      ],
    },
    {
      key: "popular_topics",
      value: [
        { label: "Definite Integrals", query: "Definite Integrals" },
        { label: "Matrices & Determinants", query: "Matrices" },
        { label: "Trigonometric Functions", query: "Trigonometric Functions" },
        { label: "Probability", query: "Probability" },
        { label: "Periodic Properties", query: "Periodic Properties" },
        { label: "Photosynthesis & Cell", query: "Photosynthesis" },
        { label: "Continuity & Differentiability", query: "Continuity" },
        { label: "Vectors & 3D Geometry", query: "Vectors" },
      ],
    },
    {
      key: "headline_result",
      value: {
        value: "98.4%",
        label: "Board Distinction Rate",
        description: "Over 85% of our regular classroom students score above 90 marks in Mathematics and Science board examinations.",
        trend: "+4.2% YoY",
      },
    },
    {
      key: "what_brings_you_here",
      value: [
        {
          id: "board_prep",
          label: "Board exam prep",
          description: "High-yield PYQs, marking schemes, and step-by-step answer writing strategies for CBSE & ICSE board candidates.",
          playlist_id: "pl-class12-board-prep",
          playlist_title: "Class 12 CBSE Board Exam Booster (PYQ & Marathon)",
          playlist_subtitle: "18 comprehensive marathon lessons covering board trends",
          batch_slug: "class-12-cbse-mathematics-masterclass-2026",
        },
        {
          id: "concepts",
          label: "Build strong concepts",
          description: "Deep conceptual understanding from first principles, eliminating rote memorization in Math and Sciences.",
          playlist_id: "pl-class11-strong-concepts",
          playlist_title: "Class 11 Foundations & Core Concepts Marathon",
          playlist_subtitle: "14 conceptual lessons bridging Class 10 to Senior Secondary",
          batch_slug: "class-11-cbse-mathematics-foundation-2026",
        },
        {
          id: "quick_revision",
          label: "Quick revision",
          description: "Rapid one-shot revision sessions, formula sheets, and essential diagrams right before term exams.",
          playlist_id: "pl-class10-quick-revision",
          playlist_title: "Class 10 CBSE & ICSE Fast-Track Revision",
          playlist_subtitle: "12 rapid-fire revision lectures for Class 10 boards",
          batch_slug: "class-10-icse-science-mastery-2026",
        },
        {
          id: "doubt_solving",
          label: "Doubt solving",
          description: "Live doubt clearing and walkthroughs of the trickiest textbook and competition problem sets.",
          playlist_id: "pl-class12-doubt-solving",
          playlist_title: "Class 12 Doubt Solving & Tricky Board Problems",
          playlist_subtitle: "15 targeted doubt resolution and proof sessions",
          batch_slug: "class-12-cbse-mathematics-masterclass-2026",
        },
      ],
    },
    {
      key: "closing_band",
      value: {
        title: "Admissions open for 2026–27",
        subtitle: "Small batch sizes to guarantee personal attention, weekly testing, and direct mentorship with Dinesh Sir & Namita Ma'am in Mathura.",
        enquire_button_text: "Enquire now",
        whatsapp_button_text: "Chat on WhatsApp",
      },
    },
    {
      key: "about_story",
      value: {
        title: "The Quick2Learn Story",
        subtitle: "Over two decades of concept-first pedagogy and board distinction results in Mathura.",
        story: "Quick2Learn was founded by veteran educator Mr. Dinesh Singh Rajput with a singular mission: to deliver rigorous, concept-first coaching in Mathematics and Sciences for Classes IX–XII. Over 25 years of teaching excellence in Mathura has produced thousands of board distinction scorers and district toppers.",
        mission: "To eliminate rote memorization in secondary and senior secondary education, replacing anxiety with mathematical intuition and structured problem-solving discipline.",
        founder_quote: "Mathematics is not about memorizing steps; it is about recognizing patterns, understanding why an identity holds true, and having the courage to break complex problems into small, obvious steps.",
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
      },
    },
    {
      key: "channel_stats",
      value: {
        title: "Learn Anywhere on Our Official YouTube Channel",
        description: "Join over 100,000 students learning Mathematics, Chemistry, and Biology. Watch complete chapter one-shots, board PYQ marathons, and conceptual formula derivations for free.",
        youtube_url: "https://www.youtube.com/@Quick2Learn",
        handle: "@Quick2Learn",
        subscribers: "100K+ Learners",
        videos: "450+ High-Yield Lessons",
        views: "5M+ Views",
      },
    },
    {
      key: "faqs",
      value: [
        {
          category: "Admissions",
          question: "How do admissions work at Quick2Learn Mathura?",
          answer: "Admissions begin with an initial counseling session with the faculty to understand the student's foundation level. You can submit an enquiry online or visit our institute campus in Mathura to register.",
        },
        {
          category: "Admissions",
          question: "What is the typical batch size at Quick2Learn?",
          answer: "We strictly cap batch sizes to 35–40 students. This guarantees that Dinesh Sir and Namita Ma'am can personally review every student's homework, test answers, and doubt clearing needs.",
        },
        {
          category: "Admissions",
          question: "Can I attend trial or demo classes before enrolling?",
          answer: "Yes, prospective students are welcome to attend up to two demo classroom sessions to experience our concept-first teaching methodology before formal batch enrollment.",
        },
        {
          category: "Fees",
          question: "What fee payment options and instalment plans are available?",
          answer: "We accept online payments via Razorpay (UPI, Debit/Credit Cards, NetBanking) and cash/cheque at the campus. Both full one-time payment discounts and two/three-instalment fee plans are supported.",
        },
        {
          category: "Fees",
          question: "What is the fee refund policy?",
          answer: "Refund requests submitted in writing within 7 calendar days of batch commencement are eligible for a refund, minus a nominal registration and study material fee.",
        },
        {
          category: "Classes",
          question: "Are classes conducted offline, online, or in hybrid mode?",
          answer: "We offer dedicated offline classroom batches in Mathura equipped with synchronized digital access, as well as live and recorded online modules so students never miss a lecture during illness or travel.",
        },
        {
          category: "Classes",
          question: "How are tests and board preparations tracked?",
          answer: "Full board-pattern mock examinations take place every Sunday. Detailed answer scripts are returned with step-wise marks and presentation feedback, accompanied by regular parent progress updates.",
        },
        {
          category: "Classes",
          question: "Where is the coaching centre located in Mathura?",
          answer: "Our institute is centrally located in Mathura, Uttar Pradesh 281004, easily accessible by local transport.",
        },
        {
          category: "Online access",
          question: "How do I access lecture recordings and class notes online?",
          answer: "Enrolled students receive instant login access to the digital portal on this website, where chapter video lectures, PDF formula sheets, and past mock tests are organized by module.",
        },
        {
          category: "Online access",
          question: "Can I access free lectures before enrolling in a batch?",
          answer: "Yes! We have hundreds of hours of free concept lectures and one-shot chapter revisions available on our official YouTube channel (@Quick2Learn) and right here on this website.",
        },
        {
          category: "Online access",
          question: "Is there a student mobile app?",
          answer: "Our dedicated Android and iOS mobile app is currently in development and will launch shortly, sharing identical credentials with this web portal.",
        },
      ],
    },
    {
      key: "announcement_bar",
      value: {
        enabled: true,
        text: "New Class XII CBSE Mathematics batch admissions now open for 2026–27 session!",
        link_text: "Inquire Now",
        link_url: "/#inquire",
      },
    },
  ];

  for (const st of siteSettingsData) {
    await db
      .insert(schema.siteSettings)
      .values(st)
      .onConflictDoUpdate({
        target: schema.siteSettings.key,
        set: { value: st.value },
      });
  }
  console.log("  ✓ Site settings seeded (12 items)");

  console.log("🎉 Seeding completed successfully!");
  await pool.end();
}

export async function seedProduction(targetDbUrl?: string) {
  return seed(targetDbUrl, { prodOnly: true });
}

if (require.main === module) {
  seed().catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
  });
}
