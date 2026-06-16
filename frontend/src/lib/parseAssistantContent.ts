export function parseAssistantContent(raw: string) {
  let content = raw;
  const sources: string[] = [];
  const followUps: string[] = [];

  const sourcesMatch = content.match(/<SOURCES>([\s\S]*?)<\/SOURCES>/);
  if (sourcesMatch) {
    try {
      const parsed = JSON.parse(sourcesMatch[1].trim());
      if (Array.isArray(parsed)) {
        parsed.forEach((s: { url?: string } | string) => {
          const url = typeof s === "string" ? s : s?.url;
          if (url) sources.push(url);
        });
      }
    } catch {}
    content = content.replace(sourcesMatch[0], "").trim();
  }

  const fuMatch = content.match(/<FOLLOW_UPS>([\s\S]*?)<\/FOLLOW_UPS>/);
  if (fuMatch) {
    const questions = fuMatch[1]
      .replace(/<\/?question>/g, "\n")
      .split("\n")
      .map((q) => q.trim())
      .filter(Boolean);
    followUps.push(...questions);
    content = content.replace(fuMatch[0], "").trim();
  }

  const answerMatch = content.match(/<ANSWER>([\s\S]*?)<\/ANSWER>/);
  const answer = answerMatch ? answerMatch[1].trim() : content.trim();
  return { answer, followUps, sources };
}
