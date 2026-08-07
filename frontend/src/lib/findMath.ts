function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function normalizeMathDelimiters(text: string): string {
  return text
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, body: string) => `$$\n${body}\n$$`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, body: string) => `$${body}$`);
}

const MATH_SPAN = /(\$\$[\s\S]*?\$\$|\$[^$\n]*?\$)/g;

function splitMathSpans(text: string): { spans: string[]; body: string } {
  const spans: string[] = [];
  const body = text.replace(MATH_SPAN, (m) => {
    spans.push(m);
    return `@@MATH_SPAN_${spans.length - 1}@@`;
  });
  return { spans, body };
}

function restoreMathSpans(body: string, spans: string[]): string {
  return body.replace(/@@MATH_SPAN_(\d+)@@/g, (_, i) => spans[Number(i)]);
}

export function countAnswerMatches(answer: string, term: string): number {
  const { body } = splitMathSpans(normalizeMathDelimiters(answer));
  return (body.match(new RegExp(escapeRegex(term), "gi")) || []).length;
}

export function buildHighlightedAnswer(
  answer: string,
  term: string,
  activeMatch: number | null,
): string {
  const { spans, body } = splitMathSpans(normalizeMathDelimiters(answer));
  let count = 0;
  const marked = body.replace(
    new RegExp(`(${escapeRegex(term)})`, "gi"),
    (m) => {
      const idx = count;
      const active = activeMatch === count;
      count += 1;
      return `<mark data-find-index="${idx}" style="background:var(--highlight);border-radius:2px;color:inherit${
        active ? ";box-shadow:0 0 0 1.5px var(--text-link)" : ""
      }">${m}</mark>`;
    },
  );
  return restoreMathSpans(marked, spans);
}
