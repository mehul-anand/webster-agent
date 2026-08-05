export interface RateLimitCounters {
  dailyCount: number;
  dailyReset: Date;
  burstCount: number;
  burstReset: Date;
}

export function startOfDay(d: Date) {
  const copy = new Date(d);
  copy.setUTCHours(0, 0, 0, 0);
  return copy;
}

export function startOfMinute(d: Date) {
  const copy = new Date(d);
  copy.setUTCSeconds(0, 0);
  return copy;
}

export function evolveCounters(
  existing: RateLimitCounters,
  dayWindow: Date,
  burstWindow: Date,
): RateLimitCounters {
  const dayStale = existing.dailyReset < dayWindow;
  const burstStale = existing.burstReset < burstWindow;
  return {
    dailyCount: dayStale ? 1 : existing.dailyCount + 1,
    dailyReset: dayStale ? dayWindow : existing.dailyReset,
    burstCount: burstStale ? 1 : existing.burstCount + 1,
    burstReset: burstStale ? burstWindow : existing.burstReset,
  };
}

export function isOverLimit(
  dailyCount: number,
  burstCount: number,
  dailyLimit: number,
  burstLimit: number,
) {
  return dailyCount > dailyLimit || burstCount > burstLimit;
}
