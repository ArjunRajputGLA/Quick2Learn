import { getPaymentReceipt } from "@/server/data/payments";
import { generateReceiptPdf } from "@/server/pdf/receipt-pdf";
import {
  apiResponse,
  checkApiRateLimits,
  handleApiError,
  requireApiSession,
} from "../../../utils";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { session, errorResponse } = await requireApiSession(req);
    if (errorResponse) return errorResponse;

    const rateLimitError = await checkApiRateLimits(req, session.user.id);
    if (rateLimitError) return rateLimitError;

    const { id } = await params;

    const authUser = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: (session.user as any).role || "student",
    };

    const receiptData = await getPaymentReceipt(authUser, id);
    if (!receiptData) {
      return apiResponse.notFound("Payment record not found.");
    }

    if (receiptData.payment.status !== "paid") {
      return apiResponse.badRequest("Official receipts are only available for paid transactions.");
    }

    const pdfBytes = await generateReceiptPdf(receiptData);
    const receiptFilename = `Receipt_${receiptData.payment.receiptNo || id}.pdf`;

    return new Response(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${receiptFilename}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
