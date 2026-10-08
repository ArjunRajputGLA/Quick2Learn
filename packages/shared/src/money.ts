import { z } from "zod";

/**
 * Money in Quick2Learn is always stored and calculated as integer paise.
 * 1 Rupee = 100 Paise.
 */

export function paiseToRupees(paise: number): number {
  if (!Number.isFinite(paise)) {
    throw new TypeError("Paise must be a finite number");
  }
  return paise / 100;
}

export function rupeesToPaise(rupees: number): number {
  if (!Number.isFinite(rupees)) {
    throw new TypeError("Rupees must be a finite number");
  }
  return Math.round(rupees * 100);
}

export interface FormatINROptions {
  showPaise?: boolean;
  withSymbol?: boolean;
}

export function formatINR(paise: number, options: FormatINROptions = {}): string {
  const { showPaise = false, withSymbol = true } = options;

  if (!Number.isFinite(paise)) {
    return withSymbol ? "₹0" : "0";
  }

  const rupees = paiseToRupees(paise);

  const formatter = new Intl.NumberFormat("en-IN", {
    style: withSymbol ? "currency" : "decimal",
    currency: "INR",
    minimumFractionDigits: showPaise ? 2 : 0,
    maximumFractionDigits: showPaise ? 2 : 0,
  });

  return formatter.format(rupees);
}

export function isValidPaise(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

export const paiseSchema = z
  .number({
    required_error: "Amount in paise is required",
    invalid_type_error: "Amount must be a number",
  })
  .int("Amount must be an integer number of paise")
  .nonnegative("Amount in paise cannot be negative");
