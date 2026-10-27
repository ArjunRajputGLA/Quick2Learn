import { Image as RNImage } from 'react-native';

export const FACULTY_IMAGES = {
  dinesh: require('../../assets/Dinesh Singh Rajput.jpeg'),
  namita: require('../../assets/Namita Singh Rajput.jpeg'),
};

export interface FacultyDetails {
  id: string;
  name: string;
  shortName: string;
  role: string;
  honorific: string;
  subjects: string[];
  avatarSource: any;
  avatarUri: string | null;
}

export function isNamitaFaculty(identifier?: string | null): boolean {
  if (!identifier) return false;
  const lower = identifier.toLowerCase().trim();
  return (
    lower.includes('namita') ||
    lower.includes('nsr') ||
    lower === 'faculty-namita' ||
    lower.includes('science') ||
    lower.includes('biology') ||
    lower.includes('chemistry') ||
    lower.includes('hindi') ||
    lower.includes('civics')
  );
}

export function getFacultyAvatarSource(name?: string | null) {
  if (!name) return null;
  const lower = name.toLowerCase().trim();
  if (lower.includes('namita') || lower === 'faculty-namita' || lower.includes('nsr')) {
    return FACULTY_IMAGES.namita;
  }
  if (lower.includes('dinesh') || lower === 'faculty-dinesh' || lower.includes('dsr')) {
    return FACULTY_IMAGES.dinesh;
  }
  // Secondary fallback: if subject name was passed
  if (lower.includes('biology') || lower.includes('chemistry') || lower.includes('science')) {
    return FACULTY_IMAGES.namita;
  }
  if (lower.includes('math') || lower.includes('calculus')) {
    return FACULTY_IMAGES.dinesh;
  }
  return null;
}

export function getFacultyAvatarUri(name?: string | null): string | null {
  const source = getFacultyAvatarSource(name);
  if (!source) return null;
  try {
    const resolved = RNImage.resolveAssetSource(source);
    return resolved?.uri || null;
  } catch {
    return null;
  }
}

export function getFacultyDetails(nameOrSubject?: string | null): FacultyDetails {
  const isNamita = isNamitaFaculty(nameOrSubject);

  if (isNamita) {
    return {
      id: 'teacher-namita',
      name: 'Namita Singh Rajput',
      shortName: "Namita Ma'am",
      role: 'Senior Faculty, ICSE Science & Biology',
      honorific: 'Mrs.',
      subjects: ['Biology', 'Chemistry', 'Science', 'Hindi'],
      avatarSource: FACULTY_IMAGES.namita,
      avatarUri: getFacultyAvatarUri('namita'),
    };
  }

  return {
    id: 'teacher-dinesh',
    name: 'Dinesh Singh Rajput',
    shortName: 'Dinesh Sir',
    role: 'Director & HOD Mathematics',
    honorific: 'Mr.',
    subjects: ['Mathematics'],
    avatarSource: FACULTY_IMAGES.dinesh,
    avatarUri: getFacultyAvatarUri('dinesh'),
  };
}
