import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

const read = (path) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), "utf8");

test("registration program dropdown includes ID data, registered programs, and new programs", () => {
  const page = read("../src/app/student/register/page.tsx");
  const route = read("../src/app/api/student-programs/route.ts");

  assert.match(page, /program: parsed\.program \?\? ""/);
  assert.match(page, /fetch\("\/api\/student-programs"/);
  assert.match(page, /availablePrograms\.map/);
  assert.match(page, /Add a new course\/program/);
  assert.match(route, /select\("program"\)/);
  assert.match(route, /range\(offset, offset \+ pageSize - 1\)/);
  assert.match(route, /new Set<string>\(\)/);
});