export interface FallbackFaculty {
  id: string;
  name: string;
  slug: string;
  designation: string;
  bio: string;
  photoKey: string;
  subjectIds?: string[];
  achievements?: Array<{ title: string; description: string }>;
  sortOrder: number;
  isPublished: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FallbackResult {
  id: string;
  studentName: string;
  exam: string;
  year: number;
  scoreText: string;
  photoKey: string | null;
  isFeatured: boolean;
  sortOrder: number;
}

export interface FallbackTestimonial {
  id: string;
  studentName: string;
  classLevel: number;
  year: number;
  quote: string;
  photoKey: string | null;
  videoId: string | null;
  isPublished: boolean;
  sortOrder: number;
}

export interface FallbackBatch {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  grade: string;
  classLevel: number;
  board: string;
  facultyName: string;
  facultyAvatar?: string | null;
  schedule: string;
  pricePaise: number;
  originalPricePaise?: number;
  admissionsOpen: boolean;
  mode: string;
  status: string;
  coverImageUrl?: string;
  href: string;
  isFeatured: boolean;
  scheduleText: string;
  locationText: string;
  startDate: string;
  endDate: string;
  seatsTotal: number;
  seatsTaken?: number;
  outcomes?: string[];
  syllabus?: Array<{
    module: string;
    notes?: string;
    chapters: Array<{
      title: string;
      slug?: string;
      hasFreePreview?: boolean;
      previewUrl?: string;
      lectureCount?: number;
    }>;
  }>;
  faqs?: Array<{ question: string; answer: string }>;
}

export interface FallbackVideo {
  id: string;
  youtubeId: string;
  title: string;
  description: string;
  publishedAt: Date;
  durationSeconds: number;
  thumbnailUrl: string;
  viewCount: number;
  likeCount: number;
  classLevel: number | null;
  subjectId: string | null;
  subjectName?: string | null;
  facultyId: string | null;
  facultyName?: string | null;
  chapterId: string | null;
  chapterTitle?: string | null;
  isPublished: boolean;
}

export const DEFAULT_SITE_SETTINGS: Record<string, unknown> = {
  contact: {
    phone: "+91 76688 75809",
    whatsapp: "+91 76688 75809",
    email: "quick2learn23203@gmail.com",
    support_hours: "Mon–Sat 9:00 AM – 7:00 PM IST",
  },
  address: {
    line1: "Mathura",
    city: "Mathura",
    state: "Uttar Pradesh",
    pincode: "281004",
    landmark: "Main Center",
  },
  socials: {
    youtube: "https://www.youtube.com/@Quick2Learn",
    youtube_channel_id: "UCy1XY9I1Yeyy59Y5LMgqa8g",
    instagram: "https://instagram.com/quick2learn.in",
    facebook: "https://facebook.com/quick2learn.in",
    twitter: "https://twitter.com/Quick2Learn",
  },
  hero: {
    headline: "Maths made quick and easy",
    subheadline:
      "Master Class IX–XII Mathematics, Chemistry and Biology with conceptual clarity, Kota-level rigor, and 25+ years of trusted teaching legacy in Mathura.",
    primary_cta_text: "Join for Free",
    primary_cta_href: "/batches",
    secondary_cta_text: "Explore free lectures",
    secondary_cta_href: "/lectures",
  },
  hero_banner_slides: [
    {
      id: "slide-maths",
      headline: "Master Mathematics with 25+ years of teaching legacy",
      description:
        "Courses and coaching from Dinesh Sir — for every board, every class, every chapter. CBSE & ICSE Classes IX–XII.",
      ctaText: "Explore lectures",
      ctaHref: "/lectures",
      imageUrl: "/images/hero/banner-math.jpg",
      imageAlt:
        "Dinesh Sir teaching mathematics on a whiteboard with equations and geometric diagrams",
    },
    {
      id: "slide-science",
      headline: "Concept-first Chemistry & Biology for ICSE & CBSE",
      description:
        "Score distinction marks with structured diagrams, reaction mechanisms, and personalized doubt sessions by Namita Ma'am.",
      ctaText: "View batches",
      ctaHref: "/batches",
      imageUrl: "/images/hero/banner-science.jpg",
      imageAlt:
        "Namita Ma'am demonstrating chemistry experiments with molecular models in the lab",
    },
  ],
  hero_promo_card: {
    eyebrow: "Quick2Learn Results",
    title: "100/100 in Board Maths — proven year after year",
    description:
      "Join the institute that has produced top ranks in Mathura for over two decades. Reserve your seat for the 2026–27 session.",
    ctaText: "Reserve seat",
    ctaHref: "/batches",
    imageUrl: "/images/hero/promo-results.jpg",
    imageAlt: "Happy students celebrating outstanding board exam results",
  },
  hero_tiles: {
    badge_new_lecture: "Newest Lecture",
    badge_batch: "Admissions open",
    featured_batch_slug: "class-12-cbse-mathematics-masterclass-2026",
    results_badge: "Proven Results",
    results_title: "100/100 Top Score & 98.4% Distinction Rate",
    results_subtitle: "Recognised by the HRD Minister for outstanding CBSE board results.",
    results_image_url:
      "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=600&auto=format&fit=crop&q=80",
    results_cta_text: "View Hall of Fame",
    results_cta_href: "/results",
  },
  achievements: [
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
  popular_topics: [
    { label: "Definite Integrals", query: "Definite Integrals" },
    { label: "Matrices & Determinants", query: "Matrices" },
    { label: "Trigonometric Functions", query: "Trigonometric Functions" },
    { label: "Probability", query: "Probability" },
    { label: "Periodic Properties", query: "Periodic Properties" },
    { label: "Photosynthesis & Cell", query: "Photosynthesis" },
    { label: "Continuity & Differentiability", query: "Continuity" },
    { label: "Vectors & 3D Geometry", query: "Vectors" },
  ],
  headline_result: {
    value: "98.4%",
    label: "Board Distinction Rate",
    description:
      "Over 85% of our regular classroom students score above 90 marks in Mathematics and Science board examinations.",
    trend: "+4.2% YoY",
  },
  what_brings_you_here: [
    {
      id: "board_prep",
      label: "Board exam prep",
      description:
        "High-yield PYQs, marking schemes, and step-by-step answer writing strategies for CBSE & ICSE board candidates.",
      playlist_id: "pl-class12-board-prep",
      playlist_title: "Class 12 CBSE Board Exam Booster (PYQ & Marathon)",
      playlist_subtitle: "18 comprehensive marathon lessons covering board trends",
      batch_slug: "class-12-cbse-mathematics-masterclass-2026",
    },
    {
      id: "concepts",
      label: "Build strong concepts",
      description:
        "Deep conceptual understanding from first principles, eliminating rote memorization in Math and Sciences.",
      playlist_id: "pl-class11-strong-concepts",
      playlist_title: "Class 11 Foundations & Core Concepts Marathon",
      playlist_subtitle: "14 conceptual lessons bridging Class 10 to Senior Secondary",
      batch_slug: "class-11-cbse-mathematics-foundation-2026",
    },
    {
      id: "quick_revision",
      label: "Quick revision",
      description:
        "Rapid one-shot revision sessions, formula sheets, and essential diagrams right before term exams.",
      playlist_id: "pl-class10-quick-revision",
      playlist_title: "Class 10 CBSE & ICSE Fast-Track Revision",
      playlist_subtitle: "12 rapid-fire revision lectures for Class 10 boards",
      batch_slug: "class-10-icse-science-mastery-2026",
    },
    {
      id: "doubt_solving",
      label: "Doubt solving",
      description:
        "Live doubt clearing and walkthroughs of the trickiest textbook and competition problem sets.",
      playlist_id: "pl-class12-doubt-solving",
      playlist_title: "Class 12 Doubt Solving & Tricky Board Problems",
      playlist_subtitle: "15 targeted doubt resolution and proof sessions",
      batch_slug: "class-12-cbse-mathematics-masterclass-2026",
    },
  ],
  closing_band: {
    title: "Admissions open for 2026–27",
    subtitle:
      "Small batch sizes to guarantee personal attention, weekly testing, and direct mentorship with Dinesh Sir & Namita Ma'am in Mathura.",
    enquire_button_text: "Enquire now",
    whatsapp_button_text: "Chat on WhatsApp",
  },
  about_story: {
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
        description:
          "Step-by-step problem simplification from first principles rather than rote memorization.",
      },
      {
        title: "Continuous Testing",
        description:
          "Weekly board-pattern mock examinations with individual teacher feedback and step-marking.",
      },
      {
        title: "Single Campus Integrity",
        description:
          "Zero franchising or multi-tenancy. Direct daily access to master faculty at our Mathura centre.",
      },
    ],
  },
  channel_stats: {
    title: "Learn Anywhere on Our Official YouTube Channel",
    description:
      "Join over 100,000 students learning Mathematics, Chemistry, and Biology. Watch complete chapter one-shots, board PYQ marathons, and conceptual formula derivations for free.",
    youtube_url: "https://www.youtube.com/@Quick2Learn",
    handle: "@Quick2Learn",
    subscribers: "100K+ Learners",
    videos: "450+ High-Yield Lessons",
    views: "5M+ Views",
  },
  announcement_bar: {
    enabled: true,
    text: "New Class XII CBSE Mathematics batch admissions now open for 2026–27 session!",
    link_text: "Inquire Now",
    link_url: "/#inquire",
  },
  faqs: [
    {
      category: "Admissions",
      question: "How do admissions work at Quick2Learn Mathura?",
      answer:
        "Admissions begin with an initial counseling session with our faculty to assess the student's foundation level and learning needs. You can submit an enquiry online, contact our admissions desk (+91 76688 75809), or visit our campus in Mathura (PIN 281004) to complete registration.",
    },
    {
      category: "Admissions",
      question: "What is the typical batch size at Quick2Learn?",
      answer:
        "We strictly cap classroom batch sizes to 35–40 students. This guarantees that Dinesh Sir and Namita Ma'am can personally review every student's homework, evaluate weekly mock test scripts, and provide focused one-on-one doubt clearing.",
    },
    {
      category: "Admissions",
      question: "Can I attend trial or demo classes before enrolling?",
      answer:
        "Yes, prospective students are welcome to attend up to two (2) complimentary classroom demo sessions to experience our concept-first teaching methodology and classroom environment before formal batch enrollment.",
    },
    {
      category: "Admissions",
      question: "Which academic boards and classes are covered?",
      answer:
        "We provide dedicated coaching for CBSE, ICSE, and UP Board students from Class 9 to Class 12, focusing on Mathematics, Physics, Chemistry, and Biology, as well as Senior Secondary Board preparation.",
    },
    {
      category: "Admissions",
      question: "Can students join mid-session or during term revision?",
      answer:
        "Yes. Students joining mid-session receive foundation backup lectures and full access to recorded video sessions on our digital portal to bridge any syllabus gaps smoothly.",
    },
    {
      category: "Fees",
      question: "What fee payment options and instalment plans are available?",
      answer:
        "We accept online payments via Razorpay (UPI, Debit/Credit Cards, NetBanking) and cash/cheque at our campus office. We offer both one-time payment discounts (saving up to 25%) and flexible two- or three-instalment fee plans.",
    },
    {
      category: "Fees",
      question: "What is the fee refund policy?",
      answer:
        "Refund requests submitted in writing within 7 calendar days of batch commencement (or before the second attended lecture) qualify for a refund, minus a nominal ₹1,500 registration charge and issued book costs. Students can also transfer between cohorts within 14 days at zero penalty.",
    },
    {
      category: "Fees",
      question: "Are there merit scholarships or sibling discounts available?",
      answer:
        "Yes. Quick2Learn offers merit-based fee concessions for students scoring 90%+ in their previous board or school examinations, as well as sibling discounts when two family members enroll together.",
    },
    {
      category: "Fees",
      question: "Will I receive an official fee receipt?",
      answer:
        "Yes, every transaction generates an official serialized receipt issued by our institute administration and sent to the parent's registered email and mobile number for record-keeping.",
    },
    {
      category: "Classes",
      question: "Are classes conducted offline, online, or in hybrid mode?",
      answer:
        "We offer dedicated offline classroom batches in Mathura equipped with digital projection, supplemented by synchronized online portal access so students never miss a lecture during illness or travel.",
    },
    {
      category: "Classes",
      question: "Who will teach the classes at Quick2Learn?",
      answer:
        "Classes are directly led by veteran educators: Mr. Dinesh Singh Rajput (25+ years teaching experience, recipient of the Best Teacher Award & Teacher Innovation Award, recognized by the HRD Minister) for Mathematics, and Mrs. Namita Singh Rajput for Sciences and Humanities.",
    },
    {
      category: "Classes",
      question: "How are tests and board preparations tracked?",
      answer:
        "Full board-pattern mock examinations take place every Sunday morning. Detailed answer scripts are evaluated with step-wise marks and presentation feedback, followed by individual doubt resolution and parent updates.",
    },
    {
      category: "Classes",
      question: "What happens if a student misses a lecture?",
      answer:
        "Enrolled students can log in to the Quick2Learn digital portal to view the recorded lecture and download the corresponding lecture slides and handwritten notes, ensuring zero syllabus loss.",
    },
    {
      category: "Classes",
      question: "Where is the coaching centre located in Mathura?",
      answer:
        "Our institute campus is centrally located in Mathura, Uttar Pradesh 281004, within convenient commuting distance from major residential sectors and schools across the city.",
    },
    {
      category: "Online access",
      question: "How do I access lecture recordings and class notes online?",
      answer:
        "Enrolled students receive instant login credentials to the digital portal on this website, where chapter video lectures, PDF formula sheets, practice question banks, and past mock tests are systematically cataloged.",
    },
    {
      category: "Online access",
      question: "Can I access free lectures before enrolling in a batch?",
      answer:
        "Yes! We have hundreds of hours of free concept lectures, formula derivations, and one-shot chapter revisions available on our official YouTube channel (@Quick2Learn) and right here on this website.",
    },
    {
      category: "Online access",
      question: "Can study notes and practice papers be downloaded and printed?",
      answer:
        "Yes, all chapter summary sheets, formula booklets, and sample test papers available in the student dashboard are formatted for easy download and high-resolution printing.",
    },
  ],
};

export const DEFAULT_FACULTY_LIST: FallbackFaculty[] = [
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
        description:
          "Over 25 years teaching Senior Secondary Mathematics in Mathura with continuous district & state board rankers.",
      },
      {
        title: "Best Teacher Award 2015",
        description:
          "Conferred Best Teacher Award (2015) by Sharda Group for extraordinary pedagogical excellence.",
      },
      {
        title: "Teacher Innovation Award 2019",
        description:
          "Conferred Teacher Innovation Award (2019) by Shri Aurobindo Society for innovative conceptual learning frameworks.",
      },
      {
        title: "Certificate from the HRD Minister",
        description:
          "Conferred Certificate of Honour by the HRD Minister in July 2015 for outstanding CBSE Senior School results.",
      },
    ],
    sortOrder: 1,
    isPublished: true,
  },
  {
    id: "f0000000-0000-0000-0000-000000000002",
    name: "Mrs. Namita Singh Rajput",
    slug: "namita-singh-rajput",
    designation: "Head of ICSE Sciences, Humanities & Hindi",
    bio: "Specialist educator in ICSE Secondary Sciences, History-Civics, and Hindi literature with a focus on chemical reactions, equation balancing, anatomical diagrams, historical timelines, and rigorous board paper preparation.",
    photoKey: "/images/assets/Namita Singh Rajput.jpeg",
    subjectIds: [
      "a0000000-0000-0000-0000-000000000003",
      "a0000000-0000-0000-0000-000000000004",
      "a0000000-0000-0000-0000-000000000005",
      "a0000000-0000-0000-0000-000000000006",
    ],
    achievements: [
      {
        title: "ICSE Curriculum Expert",
        description: "15+ years guiding students to distinction in ICSE Board examinations",
      },
    ],
    sortOrder: 2,
    isPublished: true,
  },
];

export const DEFAULT_RESULTS: FallbackResult[] = [
  {
    id: "res-1",
    studentName: "Aarav Sharma",
    exam: "CBSE Class XII Maths",
    year: 2025,
    scoreText: "100/100",
    photoKey: null,
    isFeatured: true,
    sortOrder: 1,
  },
  {
    id: "res-2",
    studentName: "Priya Agrawal",
    exam: "CBSE Class XII Maths",
    year: 2025,
    scoreText: "99/100",
    photoKey: null,
    isFeatured: true,
    sortOrder: 2,
  },
  {
    id: "res-3",
    studentName: "Rohan Verma",
    exam: "ICSE Class X Science",
    year: 2025,
    scoreText: "98/100",
    photoKey: null,
    isFeatured: true,
    sortOrder: 3,
  },
  {
    id: "res-4",
    studentName: "Sneha Gupta",
    exam: "CBSE Class X Maths",
    year: 2025,
    scoreText: "99/100",
    photoKey: null,
    isFeatured: true,
    sortOrder: 4,
  },
  {
    id: "res-5",
    studentName: "Devendra Singh",
    exam: "CBSE Class XII Maths",
    year: 2024,
    scoreText: "98/100",
    photoKey: null,
    isFeatured: true,
    sortOrder: 5,
  },
  {
    id: "res-6",
    studentName: "Megha Bansal",
    exam: "CBSE Class XII Maths",
    year: 2024,
    scoreText: "97/100",
    photoKey: null,
    isFeatured: false,
    sortOrder: 6,
  },
  {
    id: "res-7",
    studentName: "Kartik Soni",
    exam: "ICSE Class X Science",
    year: 2024,
    scoreText: "96/100",
    photoKey: null,
    isFeatured: false,
    sortOrder: 7,
  },
  {
    id: "res-8",
    studentName: "Ananya Saxena",
    exam: "CBSE Class X Maths",
    year: 2024,
    scoreText: "98/100",
    photoKey: null,
    isFeatured: false,
    sortOrder: 8,
  },
];

export const DEFAULT_TESTIMONIALS: FallbackTestimonial[] = [
  {
    id: "test-1",
    studentName: "Aarav Sharma",
    classLevel: 12,
    year: 2025,
    quote:
      "Dinesh Sir simplified calculus and 3D vectors to a degree where board questions felt almost routine. Scored 100/100 in CBSE Mathematics thanks to continuous classroom testing.",
    photoKey: "testimonials/aarav.webp",
    videoId: "yt-math-12-matrices-oneshot",
    isPublished: true,
    sortOrder: 1,
  },
  {
    id: "test-2",
    studentName: "Priya Agrawal",
    classLevel: 10,
    year: 2025,
    quote:
      "Namita Ma'am's chemistry balancing shortcuts and biology anatomical diagram guidelines were exactly what appeared in our ICSE board examinations. Scored 98% in ICSE Sciences.",
    photoKey: "testimonials/priya.webp",
    videoId: "yt-chem-10-periodic-properties",
    isPublished: true,
    sortOrder: 2,
  },
  {
    id: "test-3",
    studentName: "Shubham Verma",
    classLevel: 12,
    year: 2025,
    quote:
      "Watch how Dinesh Sir's calculus PYQ marathon and Sunday test series helped me secure district rank in Class 12 CBSE Mathematics.",
    photoKey: "testimonials/shubham.webp",
    videoId: "yt-math-12-definite-integrals",
    isPublished: true,
    sortOrder: 3,
  },
  {
    id: "test-4",
    studentName: "Rohan Khandelwal",
    classLevel: 12,
    year: 2024,
    quote:
      "The discipline and regular doubt clearing sessions at Quick2Learn Mathura made all the difference. Dinesh Sir personally reviews every student's answer presentation.",
    photoKey: "testimonials/rohan.webp",
    videoId: null,
    isPublished: true,
    sortOrder: 4,
  },
  {
    id: "test-5",
    studentName: "Devendra Singh",
    classLevel: 12,
    year: 2024,
    quote:
      "Every difficult concept in Definite Integrals and Matrices became crystal clear with Dinesh Sir's daily practice problem sheets. Scored 98/100 in CBSE Maths!",
    photoKey: "testimonials/devendra.webp",
    videoId: null,
    isPublished: true,
    sortOrder: 5,
  },
  {
    id: "test-6",
    studentName: "Sneha Gupta",
    classLevel: 10,
    year: 2025,
    quote:
      "The weekly practice sheets for geometry and trigonometry built immense speed and accuracy for Class 10 CBSE Board Exams.",
    photoKey: "testimonials/sneha.webp",
    videoId: null,
    isPublished: true,
    sortOrder: 6,
  },
];

export const DEFAULT_BATCHES: FallbackBatch[] = [
  {
    id: "b0000000-0000-0000-0000-000000000001",
    slug: "class-12-cbse-mathematics-masterclass-2026",
    title: "Class XII CBSE Mathematics Comprehensive Masterclass",
    subtitle: "Full Board Syllabus Mastery & Mock Drill with Dinesh Sir",
    description:
      "Intensive classroom and online program covering complete NCERT syllabus, previous 15 years board questions, and weekly mock test series in Mathura.",
    grade: "Class XII",
    classLevel: 12,
    board: "CBSE",
    facultyName: "Mr. Dinesh Singh Rajput",
    facultyAvatar: "/images/assets/Dinesh Singh Rajput.jpeg",
    schedule: "Mon, Wed, Fri 4:30 PM – 6:00 PM IST",
    scheduleText: "Mon, Wed, Fri 4:30 PM – 6:00 PM IST",
    locationText: "Quick2Learn Institute Campus, Mathura, UP",
    startDate: "2026-04-15",
    endDate: "2027-02-28",
    pricePaise: 1800000,
    originalPricePaise: 2400000,
    seatsTotal: 40,
    seatsTaken: 28,
    admissionsOpen: true,
    mode: "offline",
    status: "open",
    coverImageUrl: "/images/hero/banner-math.jpg",
    href: "/batches/class-12-cbse-mathematics-masterclass-2026",
    isFeatured: true,
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
      {
        question: "Are revision test papers included?",
        answer: "Yes, full board-style mock exams are conducted every Sunday.",
      },
    ],
  },
  {
    id: "b0000000-0000-0000-0000-000000000002",
    slug: "class-11-cbse-mathematics-foundation-2026",
    title: "Class XI CBSE Mathematics Foundation Program",
    subtitle: "Bridge Course & Senior Secondary Algebra Prep",
    description:
      "Early conceptual bridge program focusing on Sets, Trigonometry, Permutations, and Introduction to Calculus.",
    grade: "Class XI",
    classLevel: 11,
    board: "CBSE",
    facultyName: "Mr. Dinesh Singh Rajput",
    facultyAvatar: "/images/assets/Dinesh Singh Rajput.jpeg",
    schedule: "Tue, Thu, Sat 4:30 PM – 6:00 PM IST",
    scheduleText: "Tue, Thu, Sat 4:30 PM – 6:00 PM IST",
    locationText: "Quick2Learn Institute Campus, Mathura, UP",
    startDate: "2026-05-01",
    endDate: "2027-02-15",
    pricePaise: 1500000,
    originalPricePaise: 1800000,
    seatsTotal: 35,
    seatsTaken: 18,
    admissionsOpen: true,
    mode: "hybrid",
    status: "open",
    coverImageUrl: "/images/hero/banner-math.jpg",
    href: "/batches/class-11-cbse-mathematics-foundation-2026",
    isFeatured: true,
    outcomes: ["Strong Foundation for Class XII", "Algebra & Trigonometry Clarity"],
    syllabus: [
      {
        module: "Algebra Essentials",
        notes: "Sets, Relations, Complex Numbers, Sequences & Series",
        chapters: [
          { title: "Sets", slug: "class-11-maths-ch-1-sets" },
          { title: "Relations and Functions", slug: "class-11-maths-ch-2-relations-and-functions" },
          { title: "Trigonometric Functions", slug: "class-11-maths-ch-3-trigonometric-functions" },
        ],
      },
    ],
    faqs: [
      {
        question: "Is this suitable for both CBSE and State Boards?",
        answer: "Yes, foundation concepts align with NCERT.",
      },
    ],
  },
  {
    id: "b0000000-0000-0000-0000-000000000003",
    slug: "class-10-icse-science-mastery-2026",
    title: "Class X ICSE Science & Biology Mastery Batch",
    subtitle: "Comprehensive Chemistry & Biology with Namita Ma'am",
    description:
      "Complete ICSE board preparation focusing on chemical equations, periodic trends, plant physiology diagrams, and past 10 years board questions.",
    grade: "Class X",
    classLevel: 10,
    board: "ICSE",
    facultyName: "Mrs. Namita Singh Rajput",
    facultyAvatar: "/images/assets/Namita Singh Rajput.jpeg",
    schedule: "Mon, Wed, Fri 5:30 PM – 7:00 PM IST",
    scheduleText: "Mon, Wed, Fri 5:30 PM – 7:00 PM IST",
    locationText: "Quick2Learn Institute Campus, Mathura, UP",
    startDate: "2026-04-20",
    endDate: "2027-02-20",
    pricePaise: 1400000,
    originalPricePaise: 1750000,
    seatsTotal: 30,
    seatsTaken: 22,
    admissionsOpen: true,
    mode: "offline",
    status: "open",
    coverImageUrl: "/images/hero/banner-science.jpg",
    href: "/batches/class-10-icse-science-mastery-2026",
    isFeatured: true,
    outcomes: ["ICSE Science 95+ Score Target", "Diagram & Equation Mastery"],
    syllabus: [
      {
        module: "ICSE Chemistry",
        notes: "Periodic table, Chemical bonding, Acids & bases",
        chapters: [
          { title: "Periodic Properties and Variations", slug: "class-10-chem-ch-1-periodic-properties" },
          { title: "Chemical Bonding", slug: "class-10-chem-ch-2-chemical-bonding" },
        ],
      },
      {
        module: "ICSE Biology",
        notes: "Cell structure, Photosynthesis, Human physiology",
        chapters: [
          { title: "Cell - The Structural Unit of Life", slug: "class-10-bio-ch-1-cell-unit-of-life" },
          { title: "Transpiration and Photosynthesis", slug: "class-10-bio-ch-2-photosynthesis" },
        ],
      },
    ],
    faqs: [
      {
        question: "Are ICSE biology diagrams practiced in class?",
        answer: "Yes, step-by-step drawing sessions are held each week.",
      },
    ],
  },
  {
    id: "b0000000-0000-0000-0000-000000000004",
    slug: "class-10-cbse-board-booster-2026",
    title: "Class X CBSE Mathematics Board Booster 2026–27",
    subtitle: "Target 100/100 in Class 10 Board Maths with Dinesh Sir",
    description:
      "Rigorous drilling of Real Numbers, Polynomials, Trigonometry, and Geometry with weekly NCERT and Exemplar problem sheets.",
    grade: "Class X",
    classLevel: 10,
    board: "CBSE",
    facultyName: "Mr. Dinesh Singh Rajput",
    facultyAvatar: "/images/assets/Dinesh Singh Rajput.jpeg",
    schedule: "Tue, Thu, Sat 6:00 PM – 7:30 PM IST",
    scheduleText: "Tue, Thu, Sat 6:00 PM – 7:30 PM IST",
    locationText: "Quick2Learn Institute Campus, Mathura, UP",
    startDate: "2026-04-18",
    endDate: "2027-02-20",
    pricePaise: 1400000,
    originalPricePaise: 1700000,
    seatsTotal: 40,
    seatsTaken: 31,
    admissionsOpen: true,
    mode: "hybrid",
    status: "open",
    coverImageUrl: "/images/hero/banner-math.jpg",
    href: "/batches/class-10-cbse-board-booster-2026",
    isFeatured: false,
    outcomes: ["100/100 Board Strategy", "Complete NCERT & Exemplar Drill"],
    syllabus: [
      {
        module: "Algebra & Number Systems",
        notes: "Real numbers, Polynomials, Quadratics",
        chapters: [
          { title: "Real Numbers", slug: "class-10-maths-ch-1-real-numbers" },
          { title: "Polynomials", slug: "class-10-maths-ch-2-polynomials" },
        ],
      },
    ],
    faqs: [
      {
        question: "Are previous year board papers solved?",
        answer: "Yes, past 15 years CBSE papers are solved in classroom sessions.",
      },
    ],
  },
];

export const DEFAULT_VIDEOS: FallbackVideo[] = [
  {
    id: "yt-math-12-matrices-oneshot",
    youtubeId: "bu6Hmff0m0U",
    title: "Class 12 CBSE Maths: Matrices & Determinants One-Shot Revision | Dinesh Sir",
    description:
      "Complete chapter coverage of Matrices, operations, adjoint, and inverse calculation with board PYQs explained step-by-step by Dinesh Singh Rajput.",
    publishedAt: new Date("2026-01-10T14:30:00Z"),
    durationSeconds: 3450,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80",
    viewCount: 18450,
    likeCount: 1620,
    classLevel: 12,
    subjectId: "a0000000-0000-0000-0000-000000000001",
    subjectName: "Mathematics",
    facultyId: "f0000000-0000-0000-0000-000000000001",
    facultyName: "Mr. Dinesh Singh Rajput",
    chapterId: null,
    chapterTitle: "Matrices",
    isPublished: true,
  },
  {
    id: "yt-math-12-continuity-calculus",
    youtubeId: "Sa6vSiYCqyo",
    title: "Class 12 CBSE Maths: Continuity and Differentiability Masterclass | Dinesh Sir",
    description:
      "Master limits, continuity proofs, chain rule, and logarithmic differentiation with Dinesh Sir's intuitive problem solving methods.",
    publishedAt: new Date("2026-01-18T16:00:00Z"),
    durationSeconds: 4120,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=80",
    viewCount: 22100,
    likeCount: 1980,
    classLevel: 12,
    subjectId: "a0000000-0000-0000-0000-000000000001",
    subjectName: "Mathematics",
    facultyId: "f0000000-0000-0000-0000-000000000001",
    facultyName: "Mr. Dinesh Singh Rajput",
    chapterId: null,
    chapterTitle: "Continuity and Differentiability",
    isPublished: true,
  },
  {
    id: "yt-math-11-trigonometry-identities",
    youtubeId: "pl-trig-demo",
    title: "Class 11 CBSE Maths: Trigonometric Functions & Formula Hacks | Dinesh Sir",
    description:
      "Shortcuts to remember all trigonometric identities, multiple angles, and principal solutions for Senior Secondary foundation.",
    publishedAt: new Date("2026-01-25T11:00:00Z"),
    durationSeconds: 2890,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=600&auto=format&fit=crop&q=80",
    viewCount: 14200,
    likeCount: 1150,
    classLevel: 11,
    subjectId: "a0000000-0000-0000-0000-000000000001",
    subjectName: "Mathematics",
    facultyId: "f0000000-0000-0000-0000-000000000001",
    facultyName: "Mr. Dinesh Singh Rajput",
    chapterId: null,
    chapterTitle: "Trigonometric Functions",
    isPublished: true,
  },
  {
    id: "yt-chem-10-periodic-properties",
    youtubeId: "pl-chem-demo",
    title: "Class 10 ICSE Chemistry: Periodic Properties & Group Variations | Namita Ma'am",
    description:
      "In-depth ICSE chemistry board revision covering ionization energy, electronegativity trends, atomic radius, and reasoning questions.",
    publishedAt: new Date("2026-02-02T15:30:00Z"),
    durationSeconds: 2640,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&auto=format&fit=crop&q=80",
    viewCount: 12800,
    likeCount: 970,
    classLevel: 10,
    subjectId: "a0000000-0000-0000-0000-000000000003",
    subjectName: "Chemistry",
    facultyId: "f0000000-0000-0000-0000-000000000002",
    facultyName: "Mrs. Namita Singh Rajput",
    chapterId: null,
    chapterTitle: "Periodic Properties",
    isPublished: true,
  },
];

export const DEFAULT_MEGA_MENU_DATA = {
  classes: [
    {
      classLevel: 9,
      classRoman: "IX" as const,
      classSlug: "ix" as const,
      subjects: [
        { id: "a1", slug: "mathematics", name: "Mathematics", href: "/learn/ix/mathematics", chapterCount: 15 },
        { id: "a2", slug: "physics", name: "Physics", href: "/learn/ix/physics", chapterCount: 8 },
        { id: "a3", slug: "chemistry", name: "Chemistry", href: "/learn/ix/chemistry", chapterCount: 8 },
        { id: "a4", slug: "biology", name: "Biology", href: "/learn/ix/biology", chapterCount: 10 },
        { id: "a5", slug: "hindi", name: "Hindi", href: "/learn/ix/hindi", chapterCount: 11 },
        { id: "a6", slug: "history-civics", name: "History & Civics", href: "/learn/ix/history-civics", chapterCount: 16 },
      ],
    },
    {
      classLevel: 10,
      classRoman: "X" as const,
      classSlug: "x" as const,
      subjects: [
        { id: "a1", slug: "mathematics", name: "Mathematics", href: "/learn/x/mathematics", chapterCount: 15 },
        { id: "a2", slug: "physics", name: "Physics", href: "/learn/x/physics", chapterCount: 10 },
        { id: "a3", slug: "chemistry", name: "Chemistry", href: "/learn/x/chemistry", chapterCount: 10 },
        { id: "a4", slug: "biology", name: "Biology", href: "/learn/x/biology", chapterCount: 10 },
      ],
    },
    {
      classLevel: 11,
      classRoman: "XI" as const,
      classSlug: "xi" as const,
      subjects: [
        { id: "a1", slug: "mathematics", name: "Mathematics", href: "/learn/xi/mathematics", chapterCount: 14 },
        { id: "a2", slug: "physics", name: "Physics", href: "/learn/xi/physics", chapterCount: 12 },
        { id: "a3", slug: "chemistry", name: "Chemistry", href: "/learn/xi/chemistry", chapterCount: 12 },
      ],
    },
    {
      classLevel: 12,
      classRoman: "XII" as const,
      classSlug: "xii" as const,
      subjects: [
        { id: "a1", slug: "mathematics", name: "Mathematics", href: "/learn/xii/mathematics", chapterCount: 13 },
        { id: "a2", slug: "physics", name: "Physics", href: "/learn/xii/physics", chapterCount: 14 },
        { id: "a3", slug: "chemistry", name: "Chemistry", href: "/learn/xii/chemistry", chapterCount: 14 },
      ],
    },
  ],
  sidePanelLinks: [
    {
      label: "All free lectures",
      href: "/lectures",
      description: "Watch conceptual YouTube lessons by veteran mentors",
      icon: "video" as const,
    },
    {
      label: "All batches",
      href: "/batches",
      description: "Explore offline & online classroom coaching schedules",
      icon: "calendar" as const,
    },
    {
      label: "Board toppers & results",
      href: "/results",
      description: "100/100 marks and district ranks in Mathura",
      icon: "award" as const,
    },
  ],
};

export const DEFAULT_SUBJECTS = [
  { id: "a0000000-0000-0000-0000-000000000001", slug: "mathematics", name: "Mathematics", sortOrder: 1 },
  { id: "a0000000-0000-0000-0000-000000000002", slug: "physics", name: "Physics", sortOrder: 2 },
  { id: "a0000000-0000-0000-0000-000000000003", slug: "chemistry", name: "Chemistry", sortOrder: 3 },
  { id: "a0000000-0000-0000-0000-000000000004", slug: "biology", name: "Biology", sortOrder: 4 },
  { id: "a0000000-0000-0000-0000-000000000005", slug: "hindi", name: "Hindi", sortOrder: 5 },
  { id: "a0000000-0000-0000-0000-000000000006", slug: "history-civics", name: "History & Civics", sortOrder: 6 },
];

export interface FallbackChapter {
  id: string;
  subjectId: string;
  classLevel: number;
  board: "cbse" | "icse" | "state";
  number: number;
  title: string;
  slug: string;
  sortOrder: number;
}

export const DEFAULT_CHAPTERS: FallbackChapter[] = [
  // CLASS 12 MATHS
  { id: "ch-12-m-1", subjectId: "a0000000-0000-0000-0000-000000000001", classLevel: 12, board: "cbse", number: 1, title: "Relations and Functions", slug: "class-12-maths-ch-1-relations-and-functions", sortOrder: 1 },
  { id: "ch-12-m-2", subjectId: "a0000000-0000-0000-0000-000000000001", classLevel: 12, board: "cbse", number: 2, title: "Inverse Trigonometric Functions", slug: "class-12-maths-ch-2-inverse-trigonometric-functions", sortOrder: 2 },
  { id: "ch-12-m-3", subjectId: "a0000000-0000-0000-0000-000000000001", classLevel: 12, board: "cbse", number: 3, title: "Matrices", slug: "class-12-maths-ch-3-matrices", sortOrder: 3 },
  { id: "ch-12-m-4", subjectId: "a0000000-0000-0000-0000-000000000001", classLevel: 12, board: "cbse", number: 4, title: "Determinants", slug: "class-12-maths-ch-4-determinants", sortOrder: 4 },
  { id: "ch-12-m-5", subjectId: "a0000000-0000-0000-0000-000000000001", classLevel: 12, board: "cbse", number: 5, title: "Continuity and Differentiability", slug: "class-12-maths-ch-5-continuity-and-differentiability", sortOrder: 5 },
  { id: "ch-12-m-6", subjectId: "a0000000-0000-0000-0000-000000000001", classLevel: 12, board: "cbse", number: 6, title: "Application of Derivatives", slug: "class-12-maths-ch-6-application-of-derivatives", sortOrder: 6 },
  { id: "ch-12-m-7", subjectId: "a0000000-0000-0000-0000-000000000001", classLevel: 12, board: "cbse", number: 7, title: "Integrals", slug: "class-12-maths-ch-7-integrals", sortOrder: 7 },
  { id: "ch-12-m-8", subjectId: "a0000000-0000-0000-0000-000000000001", classLevel: 12, board: "cbse", number: 8, title: "Application of Integrals", slug: "class-12-maths-ch-8-application-of-integrals", sortOrder: 8 },
  { id: "ch-12-m-9", subjectId: "a0000000-0000-0000-0000-000000000001", classLevel: 12, board: "cbse", number: 9, title: "Differential Equations", slug: "class-12-maths-ch-9-differential-equations", sortOrder: 9 },
  { id: "ch-12-m-10", subjectId: "a0000000-0000-0000-0000-000000000001", classLevel: 12, board: "cbse", number: 10, title: "Vector Algebra", slug: "class-12-maths-ch-10-vector-algebra", sortOrder: 10 },
  { id: "ch-12-m-11", subjectId: "a0000000-0000-0000-0000-000000000001", classLevel: 12, board: "cbse", number: 11, title: "Three Dimensional Geometry", slug: "class-12-maths-ch-11-three-dimensional-geometry", sortOrder: 11 },
  { id: "ch-12-m-12", subjectId: "a0000000-0000-0000-0000-000000000001", classLevel: 12, board: "cbse", number: 12, title: "Linear Programming", slug: "class-12-maths-ch-12-linear-programming", sortOrder: 12 },
  { id: "ch-12-m-13", subjectId: "a0000000-0000-0000-0000-000000000001", classLevel: 12, board: "cbse", number: 13, title: "Probability", slug: "class-12-maths-ch-13-probability", sortOrder: 13 },

  // CLASS 12 PHYSICS
  { id: "ch-12-p-1", subjectId: "a0000000-0000-0000-0000-000000000002", classLevel: 12, board: "cbse", number: 1, title: "Electric Charges and Fields", slug: "class-12-physics-ch-1-electric-charges", sortOrder: 1 },
  { id: "ch-12-p-2", subjectId: "a0000000-0000-0000-0000-000000000002", classLevel: 12, board: "cbse", number: 2, title: "Electrostatic Potential and Capacitance", slug: "class-12-physics-ch-2-electrostatic-potential", sortOrder: 2 },
  { id: "ch-12-p-3", subjectId: "a0000000-0000-0000-0000-000000000002", classLevel: 12, board: "cbse", number: 3, title: "Current Electricity", slug: "class-12-physics-ch-3-current-electricity", sortOrder: 3 },

  // CLASS 12 CHEMISTRY
  { id: "ch-12-c-1", subjectId: "a0000000-0000-0000-0000-000000000003", classLevel: 12, board: "cbse", number: 1, title: "Solutions", slug: "class-12-chem-ch-1-solutions", sortOrder: 1 },
  { id: "ch-12-c-2", subjectId: "a0000000-0000-0000-0000-000000000003", classLevel: 12, board: "cbse", number: 2, title: "Electrochemistry", slug: "class-12-chem-ch-2-electrochemistry", sortOrder: 2 },
  { id: "ch-12-c-3", subjectId: "a0000000-0000-0000-0000-000000000003", classLevel: 12, board: "cbse", number: 3, title: "Chemical Kinetics", slug: "class-12-chem-ch-3-chemical-kinetics", sortOrder: 3 },

  // CLASS 11 MATHS
  { id: "ch-11-m-1", subjectId: "a0000000-0000-0000-0000-000000000001", classLevel: 11, board: "cbse", number: 1, title: "Sets", slug: "class-11-maths-ch-1-sets", sortOrder: 1 },
  { id: "ch-11-m-2", subjectId: "a0000000-0000-0000-0000-000000000001", classLevel: 11, board: "cbse", number: 2, title: "Relations and Functions", slug: "class-11-maths-ch-2-relations-and-functions", sortOrder: 2 },
  { id: "ch-11-m-3", subjectId: "a0000000-0000-0000-0000-000000000001", classLevel: 11, board: "cbse", number: 3, title: "Trigonometric Functions", slug: "class-11-maths-ch-3-trigonometric-functions", sortOrder: 3 },
  { id: "ch-11-m-4", subjectId: "a0000000-0000-0000-0000-000000000001", classLevel: 11, board: "cbse", number: 4, title: "Complex Numbers and Quadratic Equations", slug: "class-11-maths-ch-4-complex-numbers-and-quadratic-equations", sortOrder: 4 },
  { id: "ch-11-m-5", subjectId: "a0000000-0000-0000-0000-000000000001", classLevel: 11, board: "cbse", number: 5, title: "Linear Inequalities", slug: "class-11-maths-ch-5-linear-inequalities", sortOrder: 5 },
  { id: "ch-11-m-6", subjectId: "a0000000-0000-0000-0000-000000000001", classLevel: 11, board: "cbse", number: 6, title: "Permutations and Combinations", slug: "class-11-maths-ch-6-permutations-and-combinations", sortOrder: 6 },
  { id: "ch-11-m-7", subjectId: "a0000000-0000-0000-0000-000000000001", classLevel: 11, board: "cbse", number: 7, title: "Binomial Theorem", slug: "class-11-maths-ch-7-binomial-theorem", sortOrder: 7 },
  { id: "ch-11-m-8", subjectId: "a0000000-0000-0000-0000-000000000001", classLevel: 11, board: "cbse", number: 8, title: "Sequences and Series", slug: "class-11-maths-ch-8-sequences-and-series", sortOrder: 8 },
  { id: "ch-11-m-9", subjectId: "a0000000-0000-0000-0000-000000000001", classLevel: 11, board: "cbse", number: 9, title: "Straight Lines", slug: "class-11-maths-ch-9-straight-lines", sortOrder: 9 },
  { id: "ch-11-m-10", subjectId: "a0000000-0000-0000-0000-000000000001", classLevel: 11, board: "cbse", number: 10, title: "Conic Sections", slug: "class-11-maths-ch-10-conic-sections", sortOrder: 10 },
  { id: "ch-11-m-11", subjectId: "a0000000-0000-0000-0000-000000000001", classLevel: 11, board: "cbse", number: 11, title: "Introduction to Three Dimensional Geometry", slug: "class-11-maths-ch-11-introduction-to-three-dimensional-geometry", sortOrder: 11 },
  { id: "ch-11-m-12", subjectId: "a0000000-0000-0000-0000-000000000001", classLevel: 11, board: "cbse", number: 12, title: "Limits and Derivatives", slug: "class-11-maths-ch-12-limits-and-derivatives", sortOrder: 12 },
  { id: "ch-11-m-13", subjectId: "a0000000-0000-0000-0000-000000000001", classLevel: 11, board: "cbse", number: 13, title: "Statistics", slug: "class-11-maths-ch-13-statistics", sortOrder: 13 },
  { id: "ch-11-m-14", subjectId: "a0000000-0000-0000-0000-000000000001", classLevel: 11, board: "cbse", number: 14, title: "Probability", slug: "class-11-maths-ch-14-probability", sortOrder: 14 },

  // CLASS 11 PHYSICS & CHEMISTRY
  { id: "ch-11-p-1", subjectId: "a0000000-0000-0000-0000-000000000002", classLevel: 11, board: "cbse", number: 1, title: "Units and Measurements", slug: "class-11-physics-ch-1-units-and-measurements", sortOrder: 1 },
  { id: "ch-11-p-2", subjectId: "a0000000-0000-0000-0000-000000000002", classLevel: 11, board: "cbse", number: 2, title: "Kinematics & Laws of Motion", slug: "class-11-physics-ch-2-kinematics", sortOrder: 2 },
  { id: "ch-11-c-1", subjectId: "a0000000-0000-0000-0000-000000000003", classLevel: 11, board: "cbse", number: 1, title: "Some Basic Concepts of Chemistry", slug: "class-11-chem-ch-1-basic-concepts", sortOrder: 1 },
  { id: "ch-11-c-2", subjectId: "a0000000-0000-0000-0000-000000000003", classLevel: 11, board: "cbse", number: 2, title: "Structure of Atom", slug: "class-11-chem-ch-2-structure-of-atom", sortOrder: 2 },

  // CLASS 10
  { id: "ch-10-m-1", subjectId: "a0000000-0000-0000-0000-000000000001", classLevel: 10, board: "cbse", number: 1, title: "Real Numbers", slug: "class-10-maths-ch-1-real-numbers", sortOrder: 1 },
  { id: "ch-10-m-2", subjectId: "a0000000-0000-0000-0000-000000000001", classLevel: 10, board: "cbse", number: 2, title: "Polynomials", slug: "class-10-maths-ch-2-polynomials", sortOrder: 2 },
  { id: "ch-10-m-3", subjectId: "a0000000-0000-0000-0000-000000000001", classLevel: 10, board: "cbse", number: 3, title: "Quadratic Equations", slug: "class-10-maths-ch-3-quadratic-equations", sortOrder: 3 },
  { id: "ch-10-m-4", subjectId: "a0000000-0000-0000-0000-000000000001", classLevel: 10, board: "cbse", number: 4, title: "Triangles", slug: "class-10-maths-ch-4-triangles", sortOrder: 4 },
  { id: "ch-10-m-5", subjectId: "a0000000-0000-0000-0000-000000000001", classLevel: 10, board: "cbse", number: 5, title: "Introduction to Trigonometry", slug: "class-10-maths-ch-5-introduction-to-trigonometry", sortOrder: 5 },
  { id: "ch-10-p-1", subjectId: "a0000000-0000-0000-0000-000000000002", classLevel: 10, board: "cbse", number: 1, title: "Light - Reflection and Refraction", slug: "class-10-physics-ch-1-light-reflection-refraction", sortOrder: 1 },
  { id: "ch-10-c-1", subjectId: "a0000000-0000-0000-0000-000000000003", classLevel: 10, board: "icse", number: 1, title: "Periodic Properties and Variations", slug: "class-10-chem-ch-1-periodic-properties", sortOrder: 1 },
  { id: "ch-10-c-2", subjectId: "a0000000-0000-0000-0000-000000000003", classLevel: 10, board: "icse", number: 2, title: "Chemical Bonding", slug: "class-10-chem-ch-2-chemical-bonding", sortOrder: 2 },
  { id: "ch-10-c-3", subjectId: "a0000000-0000-0000-0000-000000000003", classLevel: 10, board: "icse", number: 3, title: "Study of Acids, Bases and Salts", slug: "class-10-chem-ch-3-acids-bases-salts", sortOrder: 3 },
  { id: "ch-10-b-1", subjectId: "a0000000-0000-0000-0000-000000000004", classLevel: 10, board: "icse", number: 1, title: "Cell - The Structural Unit of Life", slug: "class-10-bio-ch-1-cell-unit-of-life", sortOrder: 1 },
  { id: "ch-10-b-2", subjectId: "a0000000-0000-0000-0000-000000000004", classLevel: 10, board: "icse", number: 2, title: "Transpiration and Photosynthesis", slug: "class-10-bio-ch-2-photosynthesis", sortOrder: 2 },

  // CLASS 9
  { id: "ch-9-m-1", subjectId: "a0000000-0000-0000-0000-000000000001", classLevel: 9, board: "cbse", number: 1, title: "Number Systems", slug: "class-9-maths-ch-1-number-systems", sortOrder: 1 },
  { id: "ch-9-m-2", subjectId: "a0000000-0000-0000-0000-000000000001", classLevel: 9, board: "cbse", number: 2, title: "Polynomials", slug: "class-9-maths-ch-2-polynomials", sortOrder: 2 },
  { id: "ch-9-m-3", subjectId: "a0000000-0000-0000-0000-000000000001", classLevel: 9, board: "cbse", number: 3, title: "Coordinate Geometry", slug: "class-9-maths-ch-3-coordinate-geometry", sortOrder: 3 },
  { id: "ch-9-m-4", subjectId: "a0000000-0000-0000-0000-000000000001", classLevel: 9, board: "cbse", number: 4, title: "Lines and Angles", slug: "class-9-maths-ch-4-lines-and-angles", sortOrder: 4 },
  { id: "ch-9-p-1", subjectId: "a0000000-0000-0000-0000-000000000002", classLevel: 9, board: "cbse", number: 1, title: "Motion in One Dimension", slug: "class-9-physics-ch-1-motion", sortOrder: 1 },
  { id: "ch-9-c-1", subjectId: "a0000000-0000-0000-0000-000000000003", classLevel: 9, board: "icse", number: 1, title: "Matter in Our Surroundings", slug: "class-9-chem-ch-1-matter-in-our-surroundings", sortOrder: 1 },
  { id: "ch-9-c-2", subjectId: "a0000000-0000-0000-0000-000000000003", classLevel: 9, board: "icse", number: 2, title: "Atomic Structure and Chemical Bonding", slug: "class-9-chem-ch-2-atomic-structure", sortOrder: 2 },
  { id: "ch-9-b-1", subjectId: "a0000000-0000-0000-0000-000000000004", classLevel: 9, board: "icse", number: 1, title: "Plant and Animal Tissues", slug: "class-9-bio-ch-1-plant-animal-tissues", sortOrder: 1 },
  { id: "ch-9-h-1", subjectId: "a0000000-0000-0000-0000-000000000005", classLevel: 9, board: "icse", number: 1, title: "Sakhi (Kabir Das)", slug: "class-9-hindi-ch-1-sakhi-kabir-das", sortOrder: 1 },
  { id: "ch-9-h-2", subjectId: "a0000000-0000-0000-0000-000000000005", classLevel: 9, board: "icse", number: 2, title: "Girdhar Ki Kundaliyan", slug: "class-9-hindi-ch-2-girdhar-ki-kundaliyan", sortOrder: 2 },
  { id: "ch-9-h-3", subjectId: "a0000000-0000-0000-0000-000000000005", classLevel: 9, board: "icse", number: 3, title: "Swarg Bana Sakte Hain", slug: "class-9-hindi-ch-3-swarg-bana-sakte-hain", sortOrder: 3 },
  { id: "ch-9-h-4", subjectId: "a0000000-0000-0000-0000-000000000005", classLevel: 9, board: "icse", number: 4, title: "Baat Athanni Ki", slug: "class-9-hindi-ch-4-baat-athanni-ki", sortOrder: 4 },
  { id: "ch-9-h-5", subjectId: "a0000000-0000-0000-0000-000000000005", classLevel: 9, board: "icse", number: 5, title: "Kaki", slug: "class-9-hindi-ch-5-kaki", sortOrder: 5 },
  { id: "ch-9-hc-1", subjectId: "a0000000-0000-0000-0000-000000000006", classLevel: 9, board: "icse", number: 1, title: "The Harappan Civilisation (Indus Valley)", slug: "class-9-history-civics-ch-1-harappan-civilisation", sortOrder: 1 },
  { id: "ch-9-hc-2", subjectId: "a0000000-0000-0000-0000-000000000006", classLevel: 9, board: "icse", number: 2, title: "Early & Later Vedic Period", slug: "class-9-history-civics-ch-2-vedic-period", sortOrder: 2 },
  { id: "ch-9-hc-3", subjectId: "a0000000-0000-0000-0000-000000000006", classLevel: 9, board: "icse", number: 3, title: "Jainism & Buddhism", slug: "class-9-history-civics-ch-3-jainism-buddhism", sortOrder: 3 },
  { id: "ch-9-hc-4", subjectId: "a0000000-0000-0000-0000-000000000006", classLevel: 9, board: "icse", number: 4, title: "The Mauryan Empire", slug: "class-9-history-civics-ch-4-mauryan-empire", sortOrder: 4 },
  { id: "ch-9-hc-5", subjectId: "a0000000-0000-0000-0000-000000000006", classLevel: 9, board: "icse", number: 5, title: "The Sangam Age", slug: "class-9-history-civics-ch-5-sangam-age", sortOrder: 5 },
  { id: "ch-9-hc-6", subjectId: "a0000000-0000-0000-0000-000000000006", classLevel: 9, board: "icse", number: 6, title: "The Golden Age of the Guptas", slug: "class-9-history-civics-ch-6-guptas-age", sortOrder: 6 },
  { id: "ch-9-hc-7", subjectId: "a0000000-0000-0000-0000-000000000006", classLevel: 9, board: "icse", number: 7, title: "Our Constitution & Salient Features", slug: "class-9-history-civics-ch-7-our-constitution", sortOrder: 7 },
  { id: "ch-9-hc-8", subjectId: "a0000000-0000-0000-0000-000000000006", classLevel: 9, board: "icse", number: 8, title: "Elections & Local Self-Government", slug: "class-9-history-civics-ch-8-elections-local-government", sortOrder: 8 },
];

