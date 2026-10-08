import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));
import crypto from "crypto";
import {
  paiseToRupees,
  rupeesToPaise,
  formatINR,
  isValidPaise,
  paiseSchema,
} from "../packages/shared/src/money";
import {
  verifyPaymentSignature,
  verifyWebhookSignature,
} from "../apps/web/src/server/payments/razorpay";
import {
  parseIso8601Duration,
  formatIso8601Duration,
} from "../apps/web/src/server/youtube/duration";
import {
  extractClassLevel,
  extractSubjectSlug,
  extractChapterNumber,
  tagVideo,
} from "../apps/web/src/server/youtube/tagger";
import {
  generatePlanFeeDues,
} from "../apps/web/src/server/payments/service";

describe("Vitest Core Unit Test Suite", () => {
  // 1. MONEY HELPERS
  describe("1. Money Helpers", () => {
    it("converts paise to rupees accurately", () => {
      expect(paiseToRupees(1500000)).toBe(15000);
      expect(paiseToRupees(0)).toBe(0);
      expect(paiseToRupees(99)).toBe(0.99);
      expect(() => paiseToRupees(NaN)).toThrow(TypeError);
    });

    it("converts rupees to paise accurately with rounding", () => {
      expect(rupeesToPaise(15000)).toBe(1500000);
      expect(rupeesToPaise(0)).toBe(0);
      expect(rupeesToPaise(0.99)).toBe(99);
      expect(rupeesToPaise(149.999)).toBe(15000);
      expect(() => rupeesToPaise(Infinity)).toThrow(TypeError);
    });

    it("formats amounts in Indian Rupee currency standard", () => {
      const formatted = formatINR(1500000);
      // Remove any non-breaking spaces
      const normalized = formatted.replace(/\u00a0/g, " ");
      expect(normalized).toContain("₹");
      expect(normalized).toContain("15,000");

      const withoutSymbol = formatINR(1500000, { withSymbol: false });
      expect(withoutSymbol).toContain("15,000");
      expect(withoutSymbol).not.toContain("₹");

      const withPaise = formatINR(1500050, { showPaise: true });
      expect(withPaise).toContain(".50");
    });

    it("validates paise integers and rejects floats, negatives, and non-numbers", () => {
      expect(isValidPaise(100)).toBe(true);
      expect(isValidPaise(0)).toBe(true);
      expect(isValidPaise(-1)).toBe(false);
      expect(isValidPaise(12.34)).toBe(false);
      expect(isValidPaise("100")).toBe(false);
      expect(isValidPaise(null)).toBe(false);
    });

    it("paiseSchema validates with zod", () => {
      expect(paiseSchema.safeParse(5000).success).toBe(true);
      expect(paiseSchema.safeParse(-500).success).toBe(false);
      expect(paiseSchema.safeParse(50.5).success).toBe(false);
      expect(paiseSchema.safeParse("5000").success).toBe(false);
    });
  });

  // 2. RAZORPAY SIGNATURE VERIFICATION
  describe("2. Razorpay Signature Verification", () => {
    const testSecret = "test_rzp_secret_987654321";

    it("verifies valid HMAC-SHA256 payment signature", () => {
      const orderId = "order_O8x9YZ1234567";
      const paymentId = "pay_P8x9YZ7654321";
      const payload = `${orderId}|${paymentId}`;
      const validSignature = crypto
        .createHmac("sha256", testSecret)
        .update(payload)
        .digest("hex");

      const isValid = verifyPaymentSignature(
        orderId,
        paymentId,
        validSignature,
        testSecret,
      );
      expect(isValid).toBe(true);
    });

    it("rejects invalid, tampered, or empty payment signatures", () => {
      const orderId = "order_O8x9YZ1234567";
      const paymentId = "pay_P8x9YZ7654321";
      const invalidSig = "deadbeef1234567890abcdef";

      expect(verifyPaymentSignature(orderId, paymentId, invalidSig, testSecret)).toBe(false);
      expect(verifyPaymentSignature("", paymentId, "valid", testSecret)).toBe(false);
      expect(verifyPaymentSignature(orderId, "", "valid", testSecret)).toBe(false);
      expect(verifyPaymentSignature(orderId, paymentId, "", testSecret)).toBe(false);
      // Tampered payload
      const validSignature = crypto
        .createHmac("sha256", testSecret)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");
      expect(verifyPaymentSignature("tampered_order", paymentId, validSignature, testSecret)).toBe(false);
    });

    it("verifies valid HMAC-SHA256 webhook signature", () => {
      const rawBody = JSON.stringify({
        event: "payment.captured",
        payload: { payment: { entity: { id: "pay_123" } } },
      });
      const validWebhookSig = crypto
        .createHmac("sha256", testSecret)
        .update(rawBody)
        .digest("hex");

      const isValid = verifyWebhookSignature(rawBody, validWebhookSig, testSecret);
      expect(isValid).toBe(true);
    });

    it("rejects tampered webhook payloads", () => {
      const rawBody = '{"event":"payment.captured"}';
      const validSig = crypto.createHmac("sha256", testSecret).update(rawBody).digest("hex");
      expect(verifyWebhookSignature('{"event":"payment.failed"}', validSig, testSecret)).toBe(false);
      expect(verifyWebhookSignature("", validSig, testSecret)).toBe(false);
    });
  });

  // 3. ISO 8601 DURATION PARSING AND FORMATTING
  describe("3. ISO 8601 Duration Parsing & Formatting", () => {
    it("parses valid ISO 8601 duration strings into seconds", () => {
      expect(parseIso8601Duration("PT44M30S")).toBe(2670);
      expect(parseIso8601Duration("PT1H12M45S")).toBe(4365);
      expect(parseIso8601Duration("PT20S")).toBe(20);
      expect(parseIso8601Duration("PT5M")).toBe(300);
      expect(parseIso8601Duration("PT1H")).toBe(3600);
      expect(parseIso8601Duration("P1DT2H")).toBe(93600);
    });

    it("returns 0 for empty, null, or malformed duration strings", () => {
      expect(parseIso8601Duration("")).toBe(0);
      expect(parseIso8601Duration(null)).toBe(0);
      expect(parseIso8601Duration(undefined)).toBe(0);
      expect(parseIso8601Duration("INVALID_DURATION")).toBe(0);
      expect(parseIso8601Duration("12:30")).toBe(0);
    });

    it("formats seconds into valid ISO 8601 duration strings", () => {
      expect(formatIso8601Duration(2670)).toBe("PT44M30S");
      expect(formatIso8601Duration(4365)).toBe("PT1H12M45S");
      expect(formatIso8601Duration(20)).toBe("PT20S");
      expect(formatIso8601Duration(3600)).toBe("PT1H");
      expect(formatIso8601Duration(0)).toBe("PT0S");
      expect(formatIso8601Duration(-10)).toBe("PT0S");
    });
  });

  // 4. THE YOUTUBE TAGGER
  describe("4. YouTube Tagger", () => {
    it("extracts academic class level from video titles", () => {
      expect(extractClassLevel("Class 12 integrals lecture Hindi")).toBe(12);
      expect(extractClassLevel("CLASS-XII: Chapter 7 Integration")).toBe(12);
      expect(extractClassLevel("Class 10 Quadratic Equations Proof")).toBe(10);
      expect(extractClassLevel("Class IX Number Systems")).toBe(9);
      expect(extractClassLevel("Class 11 Trigonometry Formulas")).toBe(11);
      expect(extractClassLevel("General Advice for Students")).toBeNull();
    });

    it("classifies subject based on title and description keywords", () => {
      expect(extractSubjectSlug("Class 12 Integrals Differentiation Calculus")).toBe("mathematics");
      expect(extractSubjectSlug("ICSE Organic Chemistry Hydrocarbons")).toBe("chemistry");
      expect(extractSubjectSlug("Cell Division and Genetics for Board Exam Biology")).toBe("biology");
    });

    it("extracts chapter number from video titles", () => {
      expect(extractChapterNumber("Class 12 Maths CH-7 Integrals Part 1")).toBe(7);
      expect(extractChapterNumber("Chapter 3 Matrices & Determinants")).toBe(3);
      expect(extractChapterNumber("Admissions Open Announcement")).toBeNull();
    });

    it("tagVideo tags video metadata completely with context", () => {
      const mockContext = {
        subjects: [{ id: "sub_math", slug: "mathematics", name: "Mathematics" }],
        chapters: [
          {
            id: "ch_7",
            title: "Integrals",
            slug: "class-12-maths-ch-7-integrals",
            number: 7,
            subjectId: "sub_math",
            classLevel: 12,
          },
        ],
        facultyList: [{ id: "fac_1", name: "Dinesh Singh Rajput" }],
      };

      const tagged = tagVideo(
        {
          title: "Class 12 CH-7 Integrals NCERT Solutions in Hindi",
          description: "Comprehensive lecture on Class 12 indefinite integrals",
          durationSeconds: 2700,
        },
        mockContext,
      );

      expect(tagged.classLevel).toBe(12);
      expect(tagged.chapterId).toBe("ch_7");
      expect(tagged.isShort).toBe(false);
    });
  });

  // 5. FEE-DUE GENERATION FROM A PLAN
  describe("5. Fee-Due Generation from a Plan", () => {
    it("generates single due for full one-time payment plan", () => {
      const dues = generatePlanFeeDues(1500000, null, "2026-10-15");
      expect(dues).toHaveLength(1);
      expect(dues[0].label).toBe("Full Course Payment");
      expect(dues[0].amountPaise).toBe(1500000);
      expect(dues[0].dueDate).toBe("2026-10-15");
    });

    it("generates correct instalment dues with explicit amounts and due dates", () => {
      const instalments = [
        { label: "1st Instalment (At Admission)", amount_paise: 600000, due_date: "2026-10-15" },
        { label: "2nd Instalment", amount_paise: 500000, due_date: "2026-12-15" },
        { label: "3rd Instalment", amount_paise: 400000, due_date: "2027-02-15" },
      ];

      const dues = generatePlanFeeDues(1500000, instalments, "2026-10-15");
      expect(dues).toHaveLength(3);
      expect(dues[0].amountPaise).toBe(600000);
      expect(dues[1].amountPaise).toBe(500000);
      expect(dues[2].amountPaise).toBe(400000);

      // Sum of instalments matches total
      const totalSum = dues.reduce((acc, d) => acc + d.amountPaise, 0);
      expect(totalSum).toBe(1500000);
    });

    it("distributes total amount evenly if individual instalment amounts are omitted", () => {
      const instalments = [
        { label: "Term 1", due_date: "2026-10-15" },
        { label: "Term 2", due_date: "2026-12-15" },
      ];

      const dues = generatePlanFeeDues(2000000, instalments, "2026-10-15");
      expect(dues).toHaveLength(2);
      expect(dues[0].amountPaise).toBe(1000000);
      expect(dues[1].amountPaise).toBe(1000000);
      expect(dues[0].amountPaise + dues[1].amountPaise).toBe(2000000);
    });
  });
});
