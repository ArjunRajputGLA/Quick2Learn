/**
 * Parses an ISO 8601 duration string (e.g. "PT44M30S", "PT1H12M45S", "PT20S", "P1DT2H")
 * into total seconds.
 */
export function parseIso8601Duration(duration: string | null | undefined): number {
  if (!duration || typeof duration !== "string") {
    return 0;
  }

  // Regex matching ISO 8601 duration: P[n]Y[n]M[n]DT[n]H[n]M[n]S
  const matches = duration.match(
    /^P(?:([0-9]+)Y)?(?:([0-9]+)M)?(?:([0-9]+)W)?(?:([0-9]+)D)?(?:T(?:([0-9]+)H)?(?:([0-9]+)M)?(?:([0-9]+)S)?)?$/,
  );

  if (!matches) {
    return 0;
  }

  const days = parseInt(matches[4] || "0", 10);
  const hours = parseInt(matches[5] || "0", 10);
  const minutes = parseInt(matches[6] || "0", 10);
  const seconds = parseInt(matches[7] || "0", 10);

  return days * 86400 + hours * 3600 + minutes * 60 + seconds;
}

/**
 * Formats seconds into an ISO 8601 duration string (e.g. 2670 -> "PT44M30S", 3662 -> "PT1H1M2S", 20 -> "PT20S").
 */
export function formatIso8601Duration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return "PT0S";
  }

  const rounded = Math.floor(totalSeconds);
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const seconds = rounded % 60;

  let iso = "PT";
  if (hours > 0) iso += `${hours}H`;
  if (minutes > 0) iso += `${minutes}M`;
  if (seconds > 0 || (hours === 0 && minutes === 0)) iso += `${seconds}S`;

  return iso;
}
