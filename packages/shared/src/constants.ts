export const ACADEMIC_CLASSES = ["IX", "X", "XI", "XII"] as const;
export type AcademicClass = (typeof ACADEMIC_CLASSES)[number];

export const ACADEMIC_BOARDS = ["CBSE", "ICSE", "ISC"] as const;
export type AcademicBoard = (typeof ACADEMIC_BOARDS)[number];

export const SUBJECTS = ["Mathematics", "Chemistry", "Biology"] as const;
export type Subject = (typeof SUBJECTS)[number];

export interface FacultyMember {
  id: string;
  name: string;
  title: string;
  subjects: readonly Subject[];
  experience: string;
  bio: string;
}

export const FACULTY_MEMBERS: readonly FacultyMember[] = [
  {
    id: "dinesh-singh-rajput",
    name: "Mr. Dinesh Singh Rajput",
    title: "Senior Mathematics Educator & Founder",
    subjects: ["Mathematics"] as const,
    experience: "25+ Years",
    bio: "Renowned Mathematics mentor in Mathura, guiding thousands of Class IX–XII CBSE and ICSE/ISC students to board and entrance triumphs.",
  },
  {
    id: "namita-singh-rajput",
    name: "Mrs. Namita Singh Rajput",
    title: "Senior ICSE Science Educator",
    subjects: ["Chemistry", "Biology"] as const,
    experience: "15+ Years",
    bio: "Specialist mentor for ICSE Chemistry and Biology, simplifying complex science curricula with conceptual mastery.",
  },
] as const;

export const INSTITUTE_INFO = {
  name: "Quick2Learn",
  legalName: "Quick2Learn Coaching Institute",
  tagline: "Concepts Simplified, Results Delivered",
  location: {
    city: "Mathura",
    state: "Uttar Pradesh",
    country: "India",
  },
  youtube: {
    handle: "@Quick2Learn",
    url: "https://www.youtube.com/@Quick2Learn",
    channelId: "UCy1XY9I1Yeyy59Y5LMgqa8g",
  },
  isMultiTenant: false,
  timezone: "Asia/Kolkata",
  currency: "INR",
} as const;
