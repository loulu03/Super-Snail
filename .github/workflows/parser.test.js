import test from "node:test";
import assert from "node:assert/strict";
import { parseCodeDrop, mergeCodes } from "./parser.js";

const post = `Code Drop! They expired around 12/25

COZY FALL LOOT
OCTOBER DROP INCOMING
SPOOKY BUFF ACTIVE
FALL INTO THE GRIND`;

test("parses a code drop", () => {
  const d = parseCodeDrop(post, "2026-10-21T07:46:00Z");
  assert.equal(d.postedOn, "2026-10-21");
  assert.equal(d.expiresOn, "2026-12-25");
  assert.deepEqual(d.codes, [
    "COZY FALL LOOT", "OCTOBER DROP INCOMING", "SPOOKY BUFF ACTIVE", "FALL INTO THE GRIND",
  ]);
});

test("expiry date rolls into next year", () => {
  const d = parseCodeDrop("Code Drop! Expires around 01/05\n\nA B C", "2026-12-30T10:00:00Z");
  assert.equal(d.expiresOn, "2027-01-05");
});

test("ignores unrelated messages", () => {
  assert.equal(parseCodeDrop("gg everyone", "2026-10-21T00:00:00Z"), null);
});

test("merge dedupes case-insensitively and keeps first post date", () => {
  const a = mergeCodes([], { postedOn: "2026-10-07", expiresOn: "2026-12-11", codes: ["TRICK OR LOOT"] });
  const b = mergeCodes(a, { postedOn: "2026-10-14", expiresOn: "2026-12-11", codes: ["Trick or Loot", "NEW ONE"] });
  assert.equal(b.length, 2);
  assert.equal(b.find((c) => c.code === "TRICK OR LOOT").postedOn, "2026-10-07");
});
