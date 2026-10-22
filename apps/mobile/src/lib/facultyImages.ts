import { Image as RNImage } from 'react-native';

export const FACULTY_IMAGES = {
  dinesh: require('../../assets/Dinesh Singh Rajput.jpeg'),
  namita: require('../../assets/Namita Singh Rajput.jpeg'),
};

export function getFacultyAvatarSource(name?: string | null) {
  if (!name) return null;
  const lower = name.toLowerCase().trim();
  if (lower.includes('dinesh') || lower === 'faculty-dinesh' || lower.includes('dsr')) {
    return FACULTY_IMAGES.dinesh;
  }
  if (lower.includes('namita') || lower === 'faculty-namita' || lower.includes('nsr')) {
    return FACULTY_IMAGES.namita;
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
