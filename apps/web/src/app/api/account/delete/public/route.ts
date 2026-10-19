import {
  requestPublicAccountDeletion,
  confirmAccountDeletion,
} from "@/server/data/account-deletion";
import {
  publicDeleteAccountRequestSchema,
  publicConfirmDeleteAccountSchema,
} from "@quick2learn/shared";
import { apiResponse, checkApiRateLimits, handleApiError } from "@/app/api/v1/utils";
import { db, schema, eq, sql } from "@quick2learn/db";

export async function POST(req: Request) {
  try {
    const rateLimitError = await checkApiRateLimits(req);
    if (rateLimitError) return rateLimitError;

    const body = await req.json();

    if (body.action === "request") {
      const validated = publicDeleteAccountRequestSchema.parse(body);
      const result = await requestPublicAccountDeletion(validated.identifier);
      return apiResponse.success(result);
    }

    if (body.action === "confirm") {
      const validated = publicConfirmDeleteAccountSchema.parse(body);
      const cleanInput = validated.identifier.trim().toLowerCase();

      // Find user
      let userRow = await db.query.user.findFirst({
        where: eq(schema.user.email, cleanInput),
      });

      if (!userRow) {
        const cleanedPhone = cleanInput.replace(/\D/g, "").slice(-10);
        if (cleanedPhone.length === 10) {
          userRow = await db.query.user.findFirst({
            where: sql`RIGHT(REGEXP_REPLACE(${schema.user.phoneNumber}, '\\D', '', 'g'), 10) = ${cleanedPhone}`,
          });

          if (!userRow) {
            const prof = await db.query.profiles.findFirst({
              where: sql`RIGHT(REGEXP_REPLACE(${schema.profiles.phone}, '\\D', '', 'g'), 10) = ${cleanedPhone}`,
            });
            if (prof?.userId) {
              userRow = await db.query.user.findFirst({
                where: eq(schema.user.id, prof.userId),
              });
            }
          }
        }
      }

      if (!userRow) {
        return apiResponse.notFound("No account found matching this identifier.");
      }

      const result = await confirmAccountDeletion(userRow.id, validated.code);
      return apiResponse.success(result);
    }

    return apiResponse.badRequest("Invalid action. Must be 'request' or 'confirm'.");
  } catch (err) {
    return handleApiError(err);
  }
}
