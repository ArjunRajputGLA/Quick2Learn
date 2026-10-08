/**
 * Converts a string to a URL-friendly slug.
 */
export function slugify(text: string): string {
  if (!text) return "video";
  const slug = text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "video";
}

/**
 * Converts a class level number to Roman numeral slug ("ix", "x", "xi", "xii").
 */
export function classLevelToSlug(level: number | null | undefined): string {
  switch (level) {
    case 9:
      return "ix";
    case 10:
      return "x";
    case 11:
      return "xi";
    case 12:
      return "xii";
    default:
      return level ? String(level) : "xii";
  }
}

/**
 * Converts a class slug ("ix", "x", "xi", "xii", "9", "10", "11", "12") to class level number.
 */
export function slugToClassLevel(slug: string | null | undefined): number | null {
  if (!slug) return null;
  const clean = slug.toLowerCase().trim();
  switch (clean) {
    case "ix":
    case "9":
      return 9;
    case "x":
    case "10":
      return 10;
    case "xi":
    case "11":
      return 11;
    case "xii":
    case "12":
      return 12;
    default:
      return null;
  }
}

/**
 * Returns formatted Roman representation for class level.
 */
export function formatClassRoman(level: number | null | undefined): string {
  switch (level) {
    case 9:
      return "IX";
    case 10:
      return "X";
    case 11:
      return "XI";
    case 12:
      return "XII";
    default:
      return level ? String(level) : "";
  }
}
