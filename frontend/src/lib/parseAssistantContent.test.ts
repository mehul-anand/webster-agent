import { describe, expect, it } from "vitest";
import { parseAssistantContent } from "./parseAssistantContent";

describe("parseAssistantContent", () => {
  it("extracts answer, sources, and follow-ups and strips all tags", () => {
    const raw = `<ANSWER>This is the answer.</ANSWER>\n<SOURCES>\n[{"url":"https://a.com"},{"url":"https://b.com"}]\n</SOURCES>\n<FOLLOW_UPS>\n<question>Q1?</question>\n<question>Q2?</question>\n</FOLLOW_UPS>`;
    const result = parseAssistantContent(raw);
    expect(result.answer).toBe("This is the answer.");
    expect(result.sources).toEqual(["https://a.com", "https://b.com"]);
    expect(result.followUps).toEqual(["Q1?", "Q2?"]);
  });

  it("handles sources as a mix of strings and objects", () => {
    const raw = `<ANSWER>a</ANSWER>\n<SOURCES>["https://s.com",{"url":"https://o.com"}]</SOURCES>`;
    const result = parseAssistantContent(raw);
    expect(result.sources).toEqual(["https://s.com", "https://o.com"]);
  });

  it("ignores sources without a url", () => {
    const raw = `<SOURCES>[{"title":"x"},{"url":"https://o.com"}]</SOURCES><ANSWER>a</ANSWER>`;
    const result = parseAssistantContent(raw);
    expect(result.sources).toEqual(["https://o.com"]);
  });

  it("ignores malformed SOURCES JSON and leaves sources empty", () => {
    const raw = `<ANSWER>a</ANSWER>\n<SOURCES>\nnot json\n</SOURCES>`;
    const result = parseAssistantContent(raw);
    expect(result.sources).toEqual([]);
    expect(result.answer).toBe("a");
  });

  it("returns empty defaults when tags are missing", () => {
    const result = parseAssistantContent("plain text");
    expect(result.answer).toBe("plain text");
    expect(result.sources).toEqual([]);
    expect(result.followUps).toEqual([]);
  });

  it("falls back to the whole trimmed content when ANSWER is missing", () => {
    const raw = `Some answer without tags.\n<SOURCES>["https://s.com"]</SOURCES>`;
    const result = parseAssistantContent(raw);
    expect(result.answer).toBe("Some answer without tags.");
    expect(result.sources).toEqual(["https://s.com"]);
  });

  it("parses follow-ups without question tags", () => {
    const raw = `<ANSWER>a</ANSWER>\n<FOLLOW_UPS>\nQ1?\nQ2?\n</FOLLOW_UPS>`;
    const result = parseAssistantContent(raw);
    expect(result.followUps).toEqual(["Q1?", "Q2?"]);
  });
});
