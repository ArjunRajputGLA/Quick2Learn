import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

interface ReceiptPdfData {
  payment: {
    id: string;
    receiptNo: string | null;
    amountPaise: number;
    method: string;
    status: string;
    razorpayPaymentId?: string | null;
    razorpayOrderId?: string | null;
    paidAt?: Date | null;
    createdAt: Date;
  };
  student: {
    name: string;
    email: string;
  };
  profile: {
    fullName?: string | null;
    phone?: string | null;
    classLevel?: number | null;
    board?: string | null;
    school?: string | null;
    parentName?: string | null;
    parentPhone?: string | null;
    city?: string | null;
  } | null;
  batch: {
    title: string;
    slug?: string;
  } | null;
  due: {
    label?: string | null;
    dueDate?: Date | string | null;
  } | null;
}

function numberToWordsINR(amountRupees: number): string {
  const units = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  if (amountRupees === 0) return "Zero Rupees Only";

  function convertSection(num: number): string {
    if (num === 0) return "";
    if (num < 20) return units[num] + " ";
    if (num < 100) return tens[Math.floor(num / 10)] + " " + units[num % 10] + " ";
    return units[Math.floor(num / 100)] + " Hundred " + convertSection(num % 100);
  }

  let words = "";
  const crore = Math.floor(amountRupees / 10000000);
  let rem = amountRupees % 10000000;
  const lakh = Math.floor(rem / 100000);
  rem = rem % 100000;
  const thousand = Math.floor(rem / 1000);
  rem = rem % 1000;

  if (crore > 0) words += convertSection(crore) + "Crore ";
  if (lakh > 0) words += convertSection(lakh) + "Lakh ";
  if (thousand > 0) words += convertSection(thousand) + "Thousand ";
  if (rem > 0) words += convertSection(rem);

  return words.trim() + " Rupees Only";
}

export async function generateReceiptPdf(data: ReceiptPdfData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  // Standard A4 portrait: 595.28 x 841.89 points
  const page = doc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();

  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const primaryColor = rgb(0.145, 0.388, 0.922); // #2563EB Quick2Learn Blue
  const inkColor = rgb(0.067, 0.090, 0.153); // #111827 Dark ink
  const mutedColor = rgb(0.420, 0.447, 0.502); // #6B7280 Muted gray
  const lineColor = rgb(0.898, 0.906, 0.922); // #E5E7EB Light border
  const accentSoft = rgb(0.937, 0.965, 1.0); // #EFF6FF Light blue background

  const margin = 40;
  const contentWidth = width - margin * 2;

  // Outer Border Box
  page.drawRectangle({
    x: margin,
    y: margin,
    width: contentWidth,
    height: height - margin * 2,
    borderWidth: 1.5,
    borderColor: primaryColor,
    color: rgb(1, 1, 1),
  });

  // Top Institute Header Banner
  page.drawRectangle({
    x: margin,
    y: height - margin - 85,
    width: contentWidth,
    height: 85,
    color: accentSoft,
  });

  let currentY = height - margin - 26;

  page.drawText("QUICK2LEARN COACHING INSTITUTE", {
    x: margin + 20,
    y: currentY,
    size: 16,
    font: fontBold,
    color: primaryColor,
  });

  currentY -= 16;
  page.drawText(
    "Mathematics & Sciences Excellence • Classes IX – XII (CBSE & ICSE)",
    {
      x: margin + 20,
      y: currentY,
      size: 10,
      font: fontRegular,
      color: inkColor,
    }
  );

  currentY -= 14;
  page.drawText(
    "Mathura, Uttar Pradesh • Director: Dinesh Singh Rajput (25+ Yrs Exp.)",
    {
      x: margin + 20,
      y: currentY,
      size: 9,
      font: fontRegular,
      color: mutedColor,
    }
  );

  currentY -= 13;
  page.drawText(
    "Website: https://quick2learn.in  •  Official Serialized Receipt",
    {
      x: margin + 20,
      y: currentY,
      size: 8.5,
      font: fontRegular,
      color: mutedColor,
    }
  );

  // Line below header
  currentY = height - margin - 85;
  page.drawLine({
    start: { x: margin, y: currentY },
    end: { x: width - margin, y: currentY },
    thickness: 1.5,
    color: primaryColor,
  });

  // Receipt Title Bar
  currentY -= 32;
  page.drawText("FEE PAYMENT RECEIPT", {
    x: margin + 20,
    y: currentY,
    size: 14,
    font: fontBold,
    color: inkColor,
  });

  // Receipt Meta Grid (Right aligned receipt no & date)
  const receiptNo = data.payment.receiptNo || `Q2L-${data.payment.id.slice(0, 8).toUpperCase()}`;
  const paidDate = data.payment.paidAt
    ? new Date(data.payment.paidAt)
    : new Date(data.payment.createdAt);

  const dateStr = paidDate.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  page.drawText(`Receipt No: ${receiptNo}`, {
    x: width - margin - 220,
    y: currentY,
    size: 11,
    font: fontBold,
    color: primaryColor,
  });

  currentY -= 16;
  page.drawText(`Date: ${dateStr}`, {
    x: width - margin - 220,
    y: currentY,
    size: 9.5,
    font: fontRegular,
    color: inkColor,
  });

  // Section 1: Student Details Box
  currentY -= 20;
  page.drawRectangle({
    x: margin + 20,
    y: currentY - 80,
    width: contentWidth - 40,
    height: 80,
    borderWidth: 1,
    borderColor: lineColor,
    color: rgb(0.98, 0.98, 0.99),
  });

  const studentName = data.profile?.fullName || data.student.name || "Student";
  const classText = data.profile?.classLevel
    ? `Class ${data.profile.classLevel} (${(data.profile.board || "CBSE").toUpperCase()})`
    : "Class IX–XII";
  const schoolText = data.profile?.school || "Enrolled Institute Student";
  const phoneText = data.profile?.phone || "Registered Mobile";
  const parentText = data.profile?.parentName
    ? `${data.profile.parentName} (${data.profile.parentPhone || "Phone"})`
    : "Parent / Guardian Record";

  let boxY = currentY - 20;
  page.drawText("STUDENT DETAILS", {
    x: margin + 32,
    y: boxY,
    size: 9,
    font: fontBold,
    color: mutedColor,
  });

  boxY -= 16;
  page.drawText(`Student Name:  ${studentName}`, {
    x: margin + 32,
    y: boxY,
    size: 10,
    font: fontBold,
    color: inkColor,
  });
  page.drawText(`Academic Level:  ${classText}`, {
    x: margin + 270,
    y: boxY,
    size: 9.5,
    font: fontRegular,
    color: inkColor,
  });

  boxY -= 16;
  page.drawText(`School / Phone:  ${schoolText} (${phoneText})`, {
    x: margin + 32,
    y: boxY,
    size: 9,
    font: fontRegular,
    color: inkColor,
  });
  page.drawText(`Parent / Contact:  ${parentText}`, {
    x: margin + 270,
    y: boxY,
    size: 9,
    font: fontRegular,
    color: inkColor,
  });

  // Section 2: Payment Particulars Table
  currentY -= 110;

  // Table Header
  page.drawRectangle({
    x: margin + 20,
    y: currentY - 22,
    width: contentWidth - 40,
    height: 22,
    color: accentSoft,
  });

  page.drawText("PARTICULARS / TUITION DETAILS", {
    x: margin + 32,
    y: currentY - 15,
    size: 9,
    font: fontBold,
    color: primaryColor,
  });

  page.drawText("AMOUNT (INR)", {
    x: width - margin - 130,
    y: currentY - 15,
    size: 9,
    font: fontBold,
    color: primaryColor,
  });

  currentY -= 22;

  // Row 1: Batch & Instalment
  const batchTitle = data.batch?.title || "Tuition & Coaching Fee";
  const dueLabel = data.due?.label || "Tuition Fee Instalment";

  page.drawRectangle({
    x: margin + 20,
    y: currentY - 50,
    width: contentWidth - 40,
    height: 50,
    borderWidth: 1,
    borderColor: lineColor,
  });

  page.drawText(batchTitle, {
    x: margin + 32,
    y: currentY - 20,
    size: 10,
    font: fontBold,
    color: inkColor,
  });

  page.drawText(`Description: ${dueLabel} • Direct Class Access`, {
    x: margin + 32,
    y: currentY - 36,
    size: 8.5,
    font: fontRegular,
    color: mutedColor,
  });

  const formattedAmount = `Rs. ${(data.payment.amountPaise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  page.drawText(formattedAmount, {
    x: width - margin - 130,
    y: currentY - 24,
    size: 11,
    font: fontBold,
    color: inkColor,
  });

  currentY -= 50;

  // Total Row
  page.drawRectangle({
    x: margin + 20,
    y: currentY - 28,
    width: contentWidth - 40,
    height: 28,
    color: rgb(0.97, 0.98, 0.99),
    borderWidth: 1,
    borderColor: lineColor,
  });

  page.drawText("TOTAL AMOUNT PAID:", {
    x: margin + 32,
    y: currentY - 18,
    size: 10,
    font: fontBold,
    color: inkColor,
  });

  page.drawText(formattedAmount, {
    x: width - margin - 130,
    y: currentY - 18,
    size: 12,
    font: fontBold,
    color: primaryColor,
  });

  currentY -= 40;

  // Amount in words
  const amountRupees = Math.round(data.payment.amountPaise / 100);
  const words = numberToWordsINR(amountRupees);
  page.drawText(`Amount in Words:  ${words}`, {
    x: margin + 24,
    y: currentY,
    size: 9.5,
    font: fontRegular,
    color: inkColor,
  });

  // Section 3: Payment Method & Reference
  currentY -= 24;
  page.drawLine({
    start: { x: margin + 20, y: currentY },
    end: { x: width - margin - 20, y: currentY },
    thickness: 1,
    color: lineColor,
  });

  currentY -= 18;
  const methodLabel =
    data.payment.method === "razorpay"
      ? "Razorpay Online (UPI / Card / NetBanking)"
      : data.payment.method === "upi_offline"
        ? "Institute UPI QR Transfer"
        : data.payment.method === "cash"
          ? "Cash at Institute Front Desk"
          : "Bank Wire Transfer";

  page.drawText(`Payment Mode:  ${methodLabel}`, {
    x: margin + 24,
    y: currentY,
    size: 9,
    font: fontRegular,
    color: inkColor,
  });

  if (data.payment.razorpayPaymentId) {
    currentY -= 14;
    page.drawText(`Payment Reference:  ${data.payment.razorpayPaymentId}`, {
      x: margin + 24,
      y: currentY,
      size: 8.5,
      font: fontRegular,
      color: mutedColor,
    });
  }

  // Section 4: Signature, Seal & Legal Notice
  const footerY = margin + 110;

  // Institute Stamp / Seal Box
  page.drawRectangle({
    x: margin + 24,
    y: footerY - 50,
    width: 170,
    height: 60,
    borderWidth: 1,
    borderColor: rgb(0.7, 0.8, 0.95),
    color: rgb(0.96, 0.98, 1.0),
  });

  page.drawText("[ QUICK2LEARN INSTITUTE SEAL ]", {
    x: margin + 30,
    y: footerY - 18,
    size: 8,
    font: fontBold,
    color: primaryColor,
  });
  page.drawText("Mathura Center • Verified Record", {
    x: margin + 30,
    y: footerY - 32,
    size: 7.5,
    font: fontRegular,
    color: mutedColor,
  });
  page.drawText("Tax Audit Compliant Receipt", {
    x: margin + 30,
    y: footerY - 44,
    size: 7.5,
    font: fontRegular,
    color: mutedColor,
  });

  // Signature Block
  page.drawText("For QUICK2LEARN COACHING", {
    x: width - margin - 190,
    y: footerY - 10,
    size: 9,
    font: fontBold,
    color: inkColor,
  });

  page.drawText("Dinesh Singh Rajput", {
    x: width - margin - 190,
    y: footerY - 30,
    size: 11,
    font: fontBold,
    color: primaryColor,
  });

  page.drawText("Director & Authorized Signatory", {
    x: width - margin - 190,
    y: footerY - 44,
    size: 8.5,
    font: fontRegular,
    color: mutedColor,
  });

  // Bottom Notice
  page.drawText(
    "This is a computer-generated official receipt. Retain for income tax and institute records.",
    {
      x: margin + 40,
      y: margin + 15,
      size: 7.5,
      font: fontRegular,
      color: mutedColor,
    }
  );

  return await doc.save();
}
