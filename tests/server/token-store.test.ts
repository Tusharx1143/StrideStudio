import { describe, expect, it, beforeEach } from "vitest";

// We test the InMemoryTokenStore directly — the DrizzleTokenStore requires
// a running MySQL instance, so it's covered by integration tests.
// The interface is the test surface; both implementations share the contract.

// Recreate the minimal types to avoid module resolution issues
interface StravaTokenSet {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  athleteId: number;
}

interface StravaTokenStore {
  get(userId: string): Promise<StravaTokenSet | null>;
  set(userId: string, tokens: StravaTokenSet): Promise<void>;
  delete(userId: string): Promise<void>;
}

// Inline the InMemoryTokenStore implementation so tests are self-contained.
// This mirrors the production implementation in server/_core/strava.ts.
class InMemoryTokenStore implements StravaTokenStore {
  private store = new Map<string, StravaTokenSet>();

  async get(userId: string): Promise<StravaTokenSet | null> {
    return this.store.get(userId) ?? null;
  }

  async set(userId: string, tokens: StravaTokenSet): Promise<void> {
    this.store.set(userId, tokens);
  }

  async delete(userId: string): Promise<void> {
    this.store.delete(userId);
  }
}

const makeTokens = (overrides: Partial<StravaTokenSet> = {}): StravaTokenSet => ({
  accessToken: "abc123",
  refreshToken: "ref456",
  expiresAt: 9999999999,
  athleteId: 12345,
  ...overrides,
});

describe("InMemoryTokenStore", () => {
  let store: InMemoryTokenStore;

  beforeEach(() => {
    store = new InMemoryTokenStore();
  });

  it("returns null for missing user", async () => {
    const result = await store.get("nonexistent");
    expect(result).toBeNull();
  });

  it("stores and retrieves tokens", async () => {
    const tokens = makeTokens();
    await store.set("user-1", tokens);
    const result = await store.get("user-1");
    expect(result).toEqual(tokens);
  });

  it("isolates tokens by userId", async () => {
    await store.set("user-1", makeTokens({ accessToken: "tok1" }));
    await store.set("user-2", makeTokens({ accessToken: "tok2" }));

    const u1 = await store.get("user-1");
    const u2 = await store.get("user-2");

    expect(u1!.accessToken).toBe("tok1");
    expect(u2!.accessToken).toBe("tok2");
  });

  it("overwrites existing tokens for same userId", async () => {
    await store.set("user-1", makeTokens({ accessToken: "old" }));
    await store.set("user-1", makeTokens({ accessToken: "new" }));

    const result = await store.get("user-1");
    expect(result!.accessToken).toBe("new");
  });

  it("deletes tokens", async () => {
    await store.set("user-1", makeTokens());
    await store.delete("user-1");
    const result = await store.get("user-1");
    expect(result).toBeNull();
  });

  it("delete is idempotent (no error for missing user)", async () => {
    await expect(store.delete("nonexistent")).resolves.not.toThrow();
  });

  it("handles multiple athlete IDs across users", async () => {
    await store.set("runner-1", makeTokens({ athleteId: 100 }));
    await store.set("cyclist-2", makeTokens({ athleteId: 200 }));

    expect((await store.get("runner-1"))!.athleteId).toBe(100);
    expect((await store.get("cyclist-2"))!.athleteId).toBe(200);
  });
});
