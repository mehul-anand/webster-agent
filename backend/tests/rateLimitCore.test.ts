import { describe, expect, it } from "vitest";
import {
  evolveCounters,
  isOverLimit,
  startOfDay,
  startOfMinute,
} from "../rateLimitCore";

describe("startOfDay", () => {
  it("resets to UTC midnight", () => {
    const d = new Date("2026-08-05T14:37:42.123Z");
    expect(startOfDay(d).toISOString()).toBe("2026-08-05T00:00:00.000Z");
  });

  it("returns midnight unchanged for a midnight input", () => {
    const d = new Date("2026-08-05T00:00:00.000Z");
    expect(startOfDay(d).toISOString()).toBe("2026-08-05T00:00:00.000Z");
  });
});

describe("startOfMinute", () => {
  it("zeroes seconds and milliseconds", () => {
    const d = new Date("2026-08-05T14:37:42.123Z");
    expect(startOfMinute(d).toISOString()).toBe("2026-08-05T14:37:00.000Z");
  });

  it("returns the exact minute unchanged for an aligned input", () => {
    const d = new Date("2026-08-05T14:37:00.000Z");
    expect(startOfMinute(d).toISOString()).toBe("2026-08-05T14:37:00.000Z");
  });
});

describe("evolveCounters", () => {
  const base = {
    dailyCount: 5,
    dailyReset: new Date("2026-08-05T00:00:00.000Z"),
    burstCount: 3,
    burstReset: new Date("2026-08-05T14:37:00.000Z"),
  };

  it("increments both counters while inside the windows", () => {
    const next = evolveCounters(
      base,
      new Date("2026-08-05T00:00:00.000Z"),
      new Date("2026-08-05T14:37:00.000Z"),
    );
    expect(next.dailyCount).toBe(6);
    expect(next.burstCount).toBe(4);
    expect(next.dailyReset).toBe(base.dailyReset);
    expect(next.burstReset).toBe(base.burstReset);
  });

  it("treats equality with the window as inside the window", () => {
    const next = evolveCounters(
      { ...base, dailyCount: 49 },
      new Date("2026-08-05T00:00:00.000Z"),
      new Date("2026-08-05T14:37:00.000Z"),
    );
    expect(next.dailyCount).toBe(50);
  });

  it("resets the daily counter when the day window is stale", () => {
    const next = evolveCounters(
      base,
      new Date("2026-08-06T00:00:00.000Z"),
      new Date("2026-08-05T14:37:00.000Z"),
    );
    expect(next.dailyCount).toBe(1);
    expect(next.dailyReset.toISOString()).toBe("2026-08-06T00:00:00.000Z");
    expect(next.burstCount).toBe(4);
  });

  it("resets the burst counter when the burst window is stale", () => {
    const next = evolveCounters(
      base,
      new Date("2026-08-05T00:00:00.000Z"),
      new Date("2026-08-05T14:38:00.000Z"),
    );
    expect(next.burstCount).toBe(1);
    expect(next.burstReset.toISOString()).toBe("2026-08-05T14:38:00.000Z");
    expect(next.dailyCount).toBe(6);
  });

  it("resets both counters when both windows are stale", () => {
    const next = evolveCounters(
      base,
      new Date("2026-08-06T00:00:00.000Z"),
      new Date("2026-08-05T15:00:00.000Z"),
    );
    expect(next.dailyCount).toBe(1);
    expect(next.burstCount).toBe(1);
    expect(next.dailyReset.toISOString()).toBe("2026-08-06T00:00:00.000Z");
    expect(next.burstReset.toISOString()).toBe("2026-08-05T15:00:00.000Z");
  });
});

describe("isOverLimit", () => {
  it("allows exactly at the limit", () => {
    expect(isOverLimit(50, 10, 50, 10)).toBe(false);
  });

  it("allows far below the limits", () => {
    expect(isOverLimit(1, 1, 50, 10)).toBe(false);
  });

  it("blocks one past the daily limit", () => {
    expect(isOverLimit(51, 3, 50, 10)).toBe(true);
  });

  it("blocks one past the burst limit", () => {
    expect(isOverLimit(5, 11, 50, 10)).toBe(true);
  });

  it("blocks when both are over", () => {
    expect(isOverLimit(51, 11, 50, 10)).toBe(true);
  });
});

describe("sequential calls within one minute", () => {
  it("increments counters across calls and blocks once over the burst limit", () => {
    const dayWindow = new Date("2026-08-05T00:00:00.000Z");
    const burstWindow = new Date("2026-08-05T14:37:00.000Z");
    let state = {
      dailyCount: 0,
      dailyReset: dayWindow,
      burstCount: 0,
      burstReset: burstWindow,
    };

    for (let i = 0; i < 10; i++) {
      state = evolveCounters(state, dayWindow, burstWindow);
    }
    expect(state.dailyCount).toBe(10);
    expect(state.burstCount).toBe(10);
    expect(isOverLimit(state.dailyCount, state.burstCount, 50, 10)).toBe(false);

    state = evolveCounters(state, dayWindow, burstWindow);
    expect(isOverLimit(state.dailyCount, state.burstCount, 50, 10)).toBe(true);
  });
});
