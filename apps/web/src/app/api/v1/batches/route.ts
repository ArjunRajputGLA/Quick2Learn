import { NextRequest } from "next/server";
import {
  apiResponse,
  handleApiError,
} from "../utils";
import {
  db,
  schema,
  eq,
  ne,
  and,
  asc,
} from "@quick2learn/db";

/**
 * GET /api/v1/batches
 * Public / Student endpoint to list all available institute batches from the database.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const classLevelParam = searchParams.get("class");
    const classLevel = classLevelParam ? parseInt(classLevelParam, 10) : undefined;

    const rows = await db
      .select({
        id: schema.batches.id,
        title: schema.batches.title,
        subtitle: schema.batches.subtitle,
        description: schema.batches.description,
        classLevel: schema.batches.classLevel,
        board: schema.batches.board,
        mode: schema.batches.mode,
        status: schema.batches.status,
        joinCode: schema.batches.joinCode,
        scheduleText: schema.batches.scheduleText,
        locationText: schema.batches.locationText,
        facultyName: schema.faculty.name,
        subjectName: schema.subjects.name,
        seatsTotal: schema.batches.seatsTotal,
      })
      .from(schema.batches)
      .leftJoin(schema.faculty, eq(schema.batches.facultyId, schema.faculty.id))
      .leftJoin(schema.subjects, eq(schema.batches.subjectId, schema.subjects.id))
      .where(
        classLevel
          ? and(ne(schema.batches.status, "draft"), eq(schema.batches.classLevel, classLevel))
          : ne(schema.batches.status, "draft")
      )
      .orderBy(asc(schema.batches.classLevel), schema.batches.title);

    const formattedBatches = rows.map((b) => ({
      id: b.id,
      title: b.title,
      subtitle: b.subtitle || undefined,
      description: b.description || undefined,
      classLevel: b.classLevel,
      board: b.board,
      mode: b.mode,
      status: b.status,
      joinCode: b.joinCode,
      faculty: b.facultyName || "Dinesh Singh Rajput",
      subject: b.subjectName || "Mathematics",
      room: b.locationText || (b.mode === "online" ? "Live Digital Classroom" : "Quick2Learn Centre • Room 101"),
      scheduleText: b.scheduleText || "Regular Schedule",
      seatsTotal: b.seatsTotal || 50,
    }));

    return apiResponse.success({ batches: formattedBatches });
  } catch (err) {
    return handleApiError(err);
  }
}
