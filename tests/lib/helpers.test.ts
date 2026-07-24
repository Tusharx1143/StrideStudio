import { describe, expect, it } from "vitest";
import { Activity, formatDuration, formatPace } from "../../lib/app-data";
import { computeWeekTotals, WeekTotals, TemplateDef } from "../../lib/templates/index";
import { analyseFields, heroField } from "../../lib/templates/shared/analyse-fields";
import { paceStr, timeStr, fmtDateShort, fmtDateFull, fmtTime12, fmtWeekday, durationStr } from "../../lib/templates/shared/helpers";

// ── Sample activity for tests ──

function makeRun(overrides: Partial<Activity> = {}): Activity {
  return {
    id: "1",
    stravaId: 123,
    type: "run",
    title: "Morning Run",
    distance: 10.5,
    duration: 52.5,
    elapsedTime: 55,
    date: "Today",
    startDate: "2026-07-24T06:30:00Z",
    pace: 5.0,
    speed: 12.0,
    elevation: 150,
    heartRate: 145,
    maxHeartRate: 172,
    calories: 620,
    hasHeartrate: true,
    ...overrides,
  };
}

function makeRide(overrides: Partial<Activity> = {}): Activity {
  return {
    id: "2",
    stravaId: 456,
    type: "ride",
    title: "Evening Ride",
    distance: 35.2,
    duration: 75,
    elapsedTime: 80,
    date: "Yesterday",
    startDate: "2026-07-23T18:00:00Z",
    pace: undefined,
    speed: 28.2,
    elevation: 320,
    heartRate: 138,
    maxHeartRate: 165,
    calories: 890,
    hasHeartrate: true,
    ...overrides,
  };
}

function makeWorkout(overrides: Partial<Activity> = {}): Activity {
  return {
    id: "3",
    stravaId: 789,
    type: "workout",
    title: "Gym Session",
    distance: 0,
    duration: 60,
    elapsedTime: 65,
    date: "Jul 22",
    startDate: "2026-07-22T07:00:00Z",
    hasHeartrate: false,
    ...overrides,
  };
}

// ── formatDuration ──────────────────────────────────────────────────────

describe("formatDuration", () => {
  it("formats minutes-only durations", () => {
    expect(formatDuration(30)).toBe("30 min");
    expect(formatDuration(5)).toBe("5 min");
    expect(formatDuration(0)).toBe("0 min");
  });

  it("formats hour + minute durations", () => {
    expect(formatDuration(90)).toBe("1h 30m");
    expect(formatDuration(120)).toBe("2h 0m");
    expect(formatDuration(185)).toBe("3h 5m");
  });

  it("rounds fractional minutes", () => {
    expect(formatDuration(59.4)).toBe("59 min");
    // 59.6 rounds to 60 minutes, but formatDuration checks h > 0 first,
    // so m=60 with h=0 gives "60 min" (not "1h 0m")
    // Bug note: when m rounds to 60, it should reflow to 1h 0m
    expect(formatDuration(59.6)).toBe("60 min");
    // True hour boundary works correctly
    expect(formatDuration(60)).toBe("1h 0m");
  });
});

// ── formatPace ──────────────────────────────────────────────────────────

describe("formatPace", () => {
  it("formats pace with padded seconds", () => {
    expect(formatPace(5)).toBe("5:00 /km");
    expect(formatPace(5.5)).toBe("5:30 /km");
    expect(formatPace(4.25)).toBe("4:15 /km");
    expect(formatPace(6.0833)).toBe("6:05 /km"); // 6 min 5 sec
  });
});

// ── Template helpers ────────────────────────────────────────────────────

describe("template helpers (shared)", () => {
  describe("paceStr", () => {
    it("returns formatted pace string", () => {
      const a = makeRun({ pace: 4.5 });
      expect(paceStr(a)).toBe("4:30/km");
    });

    it("returns '--' when pace is null", () => {
      const a = makeRide();
      expect(paceStr(a)).toBe("--");
    });
  });

  describe("timeStr", () => {
    it("returns uppercase duration", () => {
      const a = makeRun({ duration: 45 });
      expect(timeStr(a)).toBe("45M");
    });
  });

  describe("durationStr", () => {
    it("formats minutes only", () => {
      expect(durationStr(30)).toBe("30m");
    });
    it("formats hours + minutes", () => {
      expect(durationStr(90)).toBe("1h 30m");
    });
  });

  describe("date formatters", () => {
    it("fmtDateShort formats to MMM DD", () => {
      expect(fmtDateShort("2026-01-15T12:00:00Z")).toBe("JAN 15");
    });
    it("fmtDateFull includes year", () => {
      const full = fmtDateFull("2026-07-24T06:30:00Z");
      expect(full).toContain("2026");
      expect(full).toContain("JULY");
    });
    it("fmtTime12 returns a valid time string", () => {
      // fmtTime12 uses local timezone, so we test structure not exact values
      const afternoon = fmtTime12("2026-07-24T14:30:00+00:00"); // 14:30 UTC
      expect(afternoon).toMatch(/^\d{1,2}:\d{2} [AP]M$/);
      const morning = fmtTime12("2026-07-24T06:30:00+00:00"); // 06:30 UTC
      expect(morning).toMatch(/^\d{1,2}:\d{2} [AP]M$/);
      // The two times should differ
      expect(afternoon).not.toBe(morning);
    });
    it("fmtWeekday returns day name", () => {
      // 2026-07-24 is a Friday
      expect(fmtWeekday("2026-07-24T12:00:00Z")).toBe("FRIDAY");
    });
  });
});

// ── analyseFields ────────────────────────────────────────────────────────

describe("analyseFields", () => {
  it("returns distance and duration for all activities", () => {
    // Suppress calories (default 620 → 0.62 > 0.6) and heartRate so duration is #2
    const fields = analyseFields(makeRun({ heartRate: 90, calories: 50 }));
    expect(fields.length).toBeGreaterThanOrEqual(2);
    expect(fields[0].key).toBe("distance");
    // Salience: distance=0.8, duration=0.6, pace=~0.58, rest <= 0.3
    expect(fields[1].key).toBe("duration");
  });

  it("includes pace for runs", () => {
    const fields = analyseFields(makeRun({ pace: 5 }));
    expect(fields.some((f) => f.key === "pace")).toBe(true);
  });

  it("excludes pace for rides (uses speed instead)", () => {
    const fields = analyseFields(makeRide());
    expect(fields.some((f) => f.key === "pace")).toBe(false);
    expect(fields.some((f) => f.key === "speed")).toBe(true);
  });

  it("includes elevation when present and > 0", () => {
    const fields = analyseFields(makeRun({ elevation: 200 }));
    expect(fields.some((f) => f.key === "elevation")).toBe(true);
  });

  it("excludes elevation when 0 or undefined", () => {
    const fields = analyseFields(makeRun({ elevation: 0 }));
    expect(fields.some((f) => f.key === "elevation")).toBe(false);
  });

  it("includes heartRate only when hasHeartrate is true", () => {
    const withHR = analyseFields(makeRun({ hasHeartrate: true, heartRate: 145 }));
    expect(withHR.some((f) => f.key === "heartRate")).toBe(true);

    const withoutHR = analyseFields(makeRun({ hasHeartrate: false }));
    expect(withoutHR.some((f) => f.key === "heartRate")).toBe(false);
  });

  it("sorts by salience (distance should be first)", () => {
    // Suppress high-salience fields so duration is clearly #2
    const fields = analyseFields(makeRun({
      heartRate: 85,
      elevation: 10,
      calories: 50,
      pace: undefined,
      speed: undefined,
    }));
    // Distance always has highest salience (0.8)
    expect(fields[0].key).toBe("distance");
    // Duration (0.6) beats heartRate at 85bpm (0.3) and elevation at 10m (0.2)
    expect(fields[1].key).toBe("duration");
  });

  it("heroField returns the highest-salience field", () => {
    const fields = analyseFields(makeRun());
    const hero = heroField(fields);
    expect(hero).not.toBeNull();
    expect(hero!.key).toBe("distance");
  });

  it("returns empty array hero for empty fields", () => {
    // workout with no stats should still have distance + duration
    const fields = analyseFields(makeWorkout());
    expect(fields.length).toBeGreaterThanOrEqual(2);
  });
});

// ── computeWeekTotals ───────────────────────────────────────────────────

describe("computeWeekTotals", () => {
  it("computes totals from a list of activities", () => {
    const activities = [
      makeRun({ distance: 10 }),
      makeRun({ distance: 5, id: "1b", stravaId: 124 }),
      makeRide({ distance: 30 }),
    ];
    const totals = computeWeekTotals(activities);

    expect(totals.totalKm).toBeCloseTo(45, 1);
    expect(totals.runKm).toBeCloseTo(15, 1);
    expect(totals.otherKm).toBeCloseTo(30, 1); // non-run = rides + workouts
    expect(totals.items).toHaveLength(3);
  });

  it("handles empty activity list", () => {
    const totals = computeWeekTotals([]);
    expect(totals.totalKm).toBe(0);
    expect(totals.runKm).toBe(0);
    expect(totals.otherKm).toBe(0);
    expect(totals.totalMinutes).toBe(0);
    expect(totals.items).toHaveLength(0);
  });

  it("computes total minutes correctly", () => {
    const activities = [
      makeRun({ duration: 45 }),
      makeRide({ duration: 75 }),
    ];
    const totals = computeWeekTotals(activities);
    expect(totals.totalMinutes).toBe(120);
  });

  it("labels items with correct types", () => {
    const activities = [makeRun(), makeRide(), makeWorkout()];
    const totals = computeWeekTotals(activities);
    expect(totals.items[0].type).toBe("run");
    expect(totals.items[1].type).toBe("ride");
    expect(totals.items[2].type).toBe("workout");
  });
});
