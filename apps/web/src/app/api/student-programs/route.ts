import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { withApiLogging } from "@/lib/api-monitor";

export const dynamic = "force-dynamic";

async function getStudentPrograms() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json({ error: "Program options are unavailable" }, { status: 503 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
  );
  const programs = new Set<string>();
  const pageSize = 1000;
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from("students")
      .select("program")
      .not("program", "is", null)
      .order("program")
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error("Could not load student program options", error.message);
      return NextResponse.json({ error: "Program options are unavailable" }, { status: 500 });
    }

    for (const row of data ?? []) {
      const program = row.program?.trim();
      if (program) programs.add(program);
    }

    if (!data || data.length < pageSize) break;
    offset += pageSize;
  }

  return NextResponse.json({ programs: [...programs].sort((a, b) => a.localeCompare(b)) });
}

export const GET = withApiLogging(
  "GET",
  "/api/student-programs",
  getStudentPrograms,
);