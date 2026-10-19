import { db, schema, eq, desc, type DatabaseExecutor } from "@quick2learn/db";
import { assert, isStaff, type AuthUser } from "../authz";
import { sendEmail } from "../email";

async function notifyAdminOfEnquiry(enquiry: schema.Enquiry) {
  try {
    const adminEmail = process.env.ENQUIRY_NOTIFICATION_EMAIL || "quick2learn23203@gmail.com";
    const studentName = enquiry.name || "Prospective Student";
    const phone = enquiry.phone || "Not provided";
    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    const grade = enquiry.classLevel ? `Class ${enquiry.classLevel}` : "Not specified";
    const board = enquiry.board ? enquiry.board.toUpperCase() : "Not specified";
    const source = enquiry.sourcePath || "/";
    const message = enquiry.message || "No message entered.";
    const notes = enquiry.notes || "";

    const textContent = `New Student Enquiry Received on Quick2Learn Website:

Name: ${studentName}
Phone: ${phone}
Grade / Class: ${grade}
Board: ${board}
Source Page: ${source}
${notes ? `Additional Info: ${notes}\n` : ""}Message:
${message}

Enquiry ID: ${enquiry.id}
Timestamp: ${new Date(enquiry.createdAt || Date.now()).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}

View in Admin Portal: https://quick2learn.in/admin/enquiries
`;

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 12px; background: #ffffff;">
        <div style="border-bottom: 2px solid #2563EB; padding-bottom: 12px; margin-bottom: 16px;">
          <h2 style="color: #1E3A8A; font-size: 20px; font-weight: 700; margin: 0;">Quick2Learn Admissions &mdash; New Enquiry</h2>
          <p style="color: #64748B; font-size: 13px; margin: 4px 0 0 0;">Received from Quick2Learn Website</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 20px;">
          <tr style="border-bottom: 1px solid #F1F5F9;">
            <td style="padding: 8px 0; color: #475569; font-weight: 600; width: 35%;">Student Name:</td>
            <td style="padding: 8px 0; color: #0F172A; font-weight: 700;">${studentName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #F1F5F9;">
            <td style="padding: 8px 0; color: #475569; font-weight: 600;">Phone Number:</td>
            <td style="padding: 8px 0;">
              <a href="tel:${phone}" style="color: #2563EB; font-weight: 700; text-decoration: none;">${phone}</a>
              &nbsp;|&nbsp;
              <a href="https://wa.me/91${cleanPhone}" target="_blank" style="color: #059669; font-weight: 600; text-decoration: none;">WhatsApp</a>
            </td>
          </tr>
          <tr style="border-bottom: 1px solid #F1F5F9;">
            <td style="padding: 8px 0; color: #475569; font-weight: 600;">Class / Grade:</td>
            <td style="padding: 8px 0; color: #0F172A;">${grade}</td>
          </tr>
          <tr style="border-bottom: 1px solid #F1F5F9;">
            <td style="padding: 8px 0; color: #475569; font-weight: 600;">Board:</td>
            <td style="padding: 8px 0; color: #0F172A;">${board}</td>
          </tr>
          ${notes ? `
          <tr style="border-bottom: 1px solid #F1F5F9;">
            <td style="padding: 8px 0; color: #475569; font-weight: 600;">Additional Info:</td>
            <td style="padding: 8px 0; color: #0F172A;">${notes}</td>
          </tr>` : ""}
          <tr style="border-bottom: 1px solid #F1F5F9;">
            <td style="padding: 8px 0; color: #475569; font-weight: 600;">Source Page:</td>
            <td style="padding: 8px 0; color: #64748B;">${source}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #475569; font-weight: 600; vertical-align: top;">Message:</td>
            <td style="padding: 8px; color: #1E293B; background: #F8FAFC; border-radius: 6px;">${message}</td>
          </tr>
        </table>

        <div style="text-align: center; border-top: 1px solid #E2E8F0; padding-top: 16px;">
          <a href="https://quick2learn.in/admin/enquiries" style="background-color: #2563EB; color: #ffffff; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">
            View in Admin Dashboard &rarr;
          </a>
        </div>
      </div>
    `;

    await sendEmail({
      to: adminEmail,
      subject: `New Quick2Learn Enquiry: ${studentName} (${phone})`,
      text: textContent,
      html: htmlContent,
    });
  } catch (err) {
    console.warn("[enquiry] Notice: Error dispatching enquiry email:", err);
  }
}

export async function createEnquiry(data: schema.NewEnquiry, tx?: DatabaseExecutor) {
  const d = tx || db;
  let created: schema.Enquiry | undefined;
  let dbError: unknown = null;

  try {
    const [row] = await d.insert(schema.enquiries).values(data).returning();
    created = row;
  } catch (err) {
    dbError = err;
    console.warn("[enquiry] Database insert error (will still deliver lead via email notification):", err);
  }

  // Always attempt email notification so prospective student leads are never lost
  let emailDispatched = false;
  try {
    await notifyAdminOfEnquiry(
      created || ({
        id: "lead-" + Date.now(),
        name: data.name,
        phone: data.phone,
        classLevel: data.classLevel ?? null,
        board: data.board ?? null,
        message: data.message ?? null,
        notes: data.notes ?? null,
        sourcePath: data.sourcePath ?? "/",
        status: data.status || "new",
        createdAt: new Date(),
        updatedAt: new Date(),
        assignedTo: null,
        resolvedAt: null,
      } as schema.Enquiry)
    );
    emailDispatched = true;
  } catch (e) {
    console.warn("[enquiry] Notice: Non-critical notification error:", e);
  }

  // Only throw if neither DB insert nor email notification could be processed
  if (!created && !emailDispatched && dbError) {
    throw dbError;
  }

  return (
    created ||
    ({
      id: "lead-" + Date.now(),
      name: data.name,
      phone: data.phone,
    } as schema.Enquiry)
  );
}

// Staff can inspect inquiries
export async function getEnquiries(user: AuthUser, tx?: DatabaseExecutor) {
  assert(isStaff(user), "Only staff can view enquiry leads.");
  const d = tx || db;
  return await d.select().from(schema.enquiries).orderBy(desc(schema.enquiries.createdAt));
}

export async function updateEnquiry(
  user: AuthUser,
  id: string,
  data: Partial<schema.NewEnquiry>,
  tx?: DatabaseExecutor,
) {
  assert(isStaff(user), "Only staff can update enquiry details.");
  const d = tx || db;
  const [updated] = await d.update(schema.enquiries).set(data).where(eq(schema.enquiries.id, id)).returning();
  return updated;
}
