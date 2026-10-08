import { NextRequest, NextResponse } from "next/server";
import { searchCatalog } from "@/server/data/search";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get("q") ?? "";

  if (q.trim().length < 2) {
    return NextResponse.json({
      lectures: [],
      batches: [],
      chapters: [],
      query: q,
    });
  }

  try {
    const results = await searchCatalog(q);
    return NextResponse.json(results, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    console.error("Typeahead search error:", error);
    return NextResponse.json(
      {
        lectures: [],
        batches: [],
        chapters: [],
        query: q,
        error: "Failed to search catalog",
      },
      { status: 500 },
    );
  }
}
