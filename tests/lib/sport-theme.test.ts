import { describe, expect, it } from "vitest";
import {
  getSportConfig,
  getSportColor,
  relativeTime,
  computeAchievements,
  computeWeekStats,
  type Achievement,
} from "../../lib/sport-theme";
import type { Activity } from "../../lib/app-data";

// ── Sample data ──────────────────────────────────────────────────────────

function makeActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: "t1",
    stravaId: 100,
    type: "run",
    title: "Test Run",
    distance: 8,
    duration: 40,
    elapsedTime: 42,
    date: "Today",
    startDate: new Date().toISOString(),
    pace: 5.0,
    elevation: 100,
    heartRate: 150,
    hasHeartrate: true,
    calories: 400,
    ...overrides,
  };
}

// ── getSportConfig ───────────────────────────────────────────────────────

describe("getSportConfig", () => {
  it("returns run config with orange color", () => {
    const cfg = getSportConfig("run");
    expect(cfg.label).toBe("Run");
    expect(cfg.color).toBe("#FF6B35");
    expect(cfg.emoji).toBe("🏃");
  });

  it("returns ride config with blue color", () => {
    const cfg = getSportConfig("ride");
    expect(cfg.label).toBe("Ride");
    expect(cfg.color).toBe("#0A84FF");
    expect(cfg.emoji).toBe("🚴");
  });

  it("returns workout config with green color", () => {
    const cfg = getSportConfig("workout");
    expect(cfg.label).toBe("Workout");
    expect(cfg.color).toBe("#34C759");
    expect(cfg.emoji).toBe("💪");
  });
});

describe("getSportColor", () => {
  it("returns correct colors by type", () => {
    expect(getSportColor("run")).toBe("#FF6B35");
    expect(getSportColor("ride")).toBe("#0A84FF");
    expect(getSportColor("workout")).toBe("#34C759");
  });
});

// ── relativeTime ────────────────────────────────────────────────────────

describe("relativeTime", () => {
  it('returns "Just now" for recent timestamps', () => {
    const now = new Date();
    expect(relativeTime(now.toISOString())).toBe("Just now");
  });

  it("returns minutes ago format", () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(relativeTime(fiveMinAgo)).toBe("5m ago");
  });

  it("returns hours ago format", () => {
    const threeHrAgo = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
    expect(relativeTime(threeHrAgo)).toBe("3h ago");
  });

  it('returns "Yesterday" for 1 day ago', () => {
    const yesterday = new Date(Date.now() - 86400 * 1000).toISOString();
    expect(relativeTime(yesterday)).toBe("Yesterday");
  });

  it("returns days ago for 2-6 days", () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86400 * 1000).toISOString();
    expect(relativeTime(threeDaysAgo)).toBe("3d ago");
  });

  it("returns month+day for older dates", () => {
    const oldDate = "2026-01-15T12:00:00Z";
    expect(relativeTime(oldDate)).toBe("Jan 15");
  });
});

// ── computeWeekStats ────────────────────────────────────────────────────

describe("computeWeekStats", () => {
  it("returns zeros for empty list", () => {
    const stats = computeWeekStats([]);
    expect(stats.totalKm).toBe(0);
    expect(stats.totalMinutes).toBe(0);
    expect(stats.activitiesCount).toBe(0);
  });

  it("computes totals for activities this week", () => {
    const today = new Date();
    const activities = [
      makeActivity({ type: "run", distance: 5, duration: 25 }),
      makeActivity({ type: "run", distance: 3, duration: 15, id: "t2", stravaId: 101 }),
      makeActivity({ type: "ride", distance: 20, duration: 50, id: "t3", stravaId: 102 }),
    ];
    const stats = computeWeekStats(activities);
    expect(stats.totalKm).toBeCloseTo(28, 0);
    expect(stats.runKm).toBeCloseTo(8, 0);
    expect(stats.rideKm).toBeCloseTo(20, 0);
    expect(stats.activitiesCount).toBe(3);
    expect(stats.workoutCount).toBe(0);
  });

  it("counts workouts separately", () => {
    const today = new Date();
    const activities = [
      makeActivity({ type: "workout", distance: 0, duration: 60, id: "w1", stravaId: 200 }),
    ];
    const stats = computeWeekStats(activities);
    expect(stats.workoutCount).toBe(1);
    expect(stats.totalKm).toBe(0);
  });

  it("excludes activities from previous weeks", () => {
    const lastWeek = new Date(Date.now() - 8 * 86400 * 1000).toISOString();
    const activities = [makeActivity({ startDate: lastWeek })];
    const stats = computeWeekStats(activities);
    expect(stats.activitiesCount).toBe(0);
  });
});

// ── computeAchievements ──────────────────────────────────────────────────

describe("computeAchievements", () => {
  it("returns empty for no activities", () => {
    const achievements = computeAchievements([]);
    expect(achievements).toHaveLength(0);
  });

  it("finds longest run", () => {
    const activities = [
      makeActivity({ type: "run", distance: 5 }),
      makeActivity({ type: "run", distance: 15, id: "lr", stravaId: 300 }),
      makeActivity({ type: "run", distance: 8, id: "r3", stravaId: 301 }),
    ];
    const achievements = computeAchievements(activities);
    const longest = achievements.find((a) => a.id === "longest-run");
    expect(longest).toBeDefined();
    expect(longest!.value).toContain("15");
  });

  it("finds fastest pace", () => {
    const activities = [
      makeActivity({ type: "run", pace: 6.0, id: "slow", stravaId: 400 }),
      makeActivity({ type: "run", pace: 4.5, id: "fast", stravaId: 401 }),
    ];
    const achievements = computeAchievements(activities);
    const fastest = achievements.find((a) => a.id === "fastest-pace");
    expect(fastest).toBeDefined();
    // 4.5 pace = 4:30/km
    expect(fastest!.value).toBe("4:30/km");
  });

  it("finds highest elevation", () => {
    const activities = [
      makeActivity({ elevation: 100, id: "low", stravaId: 500 }),
      makeActivity({ elevation: 800, id: "high", stravaId: 501 }),
    ];
    const achievements = computeAchievements(activities);
    const elev = achievements.find((a) => a.id === "highest-elevation");
    expect(elev).toBeDefined();
    expect(elev!.value).toBe("800m");
  });

  it("includes calorie badge when data available", () => {
    const activities = [
      makeActivity({ calories: 350, id: "c1", stravaId: 600 }),
      makeActivity({ calories: 720, id: "c2", stravaId: 601 }),
    ];
    const achievements = computeAchievements(activities);
    const cal = achievements.find((a) => a.id === "most-calories");
    expect(cal).toBeDefined();
    expect(cal!.value).toBe("720 cal");
  });

  it("skips pace achievement for rides (no pace data)", () => {
    const activities = [
      makeActivity({ type: "ride", pace: undefined, speed: 25, id: "ride1", stravaId: 700 }),
    ];
    const achievements = computeAchievements(activities);
    const pace = achievements.find((a) => a.id === "fastest-pace");
    expect(pace).toBeUndefined();
  });
});
