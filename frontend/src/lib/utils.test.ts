import { describe, expect, it } from "vitest";
import { cn, killWordBackward } from "./utils";

describe("killWordBackward", () => {
  it("deletes the word before the cursor", () => {
    expect(killWordBackward("hello world", 11)).toEqual(["hello ", 6]);
  });

  it("skips whitespace before deleting the word", () => {
    expect(killWordBackward("hello   world", 14)).toEqual(["hello   ", 8]);
  });

  it("handles cursor at the start", () => {
    expect(killWordBackward("hello world", 0)).toEqual(["hello world", 0]);
  });

  it("deletes a single word when the cursor is inside it", () => {
    expect(killWordBackward("hello world", 9)).toEqual(["hello ld", 6]);
  });

  it("deletes a trailing word and keeps the cursor position", () => {
    expect(killWordBackward("hello ", 6)).toEqual(["", 0]);
  });
});

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("drops falsy values", () => {
    expect(cn("a", false, undefined, null, "b")).toBe("a b");
  });

  it("dedupes conflicting tailwind classes", () => {
    expect(cn("px-2 px-4", "text-sm text-lg")).toBe("px-4 text-lg");
  });

  it("handles conditional objects", () => {
    expect(cn({ a: true, b: false }, "c")).toBe("a c");
  });
});
