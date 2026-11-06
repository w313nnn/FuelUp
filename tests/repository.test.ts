import { describe, expect, it } from "vitest";
import { LocalRepository } from "../src/services/repository";
import { createSeed } from "../src/data/seed";
describe("local repository adapter", () => {
  const now = new Date("2026-11-06T11:45:00");
  const memory = () => {
    const map = new Map<string, string>();
    return {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => {
        map.set(k, v);
      },
    };
  };
  it("seeds an empty device and restores user changes", async () => {
    const storage = memory(),
      repo = new LocalRepository(storage, () => now);
    const s = await repo.load();
    s.user.name = "Sam";
    await repo.save(s);
    expect((await repo.load()).user.name).toBe("Sam");
  });
  it("does not persist catalog data as user data", async () => {
    const storage = memory(),
      repo = new LocalRepository(storage, () => now);
    await repo.save(createSeed(now));
    expect(JSON.parse(storage.getItem("fuelup:v1")!)).not.toHaveProperty(
      "recipes",
    );
  });
  it("reports corrupted data without overwriting it", async () => {
    const storage = memory();
    storage.setItem("fuelup:v1", "broken");
    const repo = new LocalRepository(storage);
    await expect(repo.load()).rejects.toThrow("Saved data");
    expect(storage.getItem("fuelup:v1")).toBe("broken");
  });
  it("reports unavailable storage", async () => {
    const repo = new LocalRepository({
      getItem: () => null,
      setItem: () => {
        throw new Error("Quota exceeded");
      },
    });
    await expect(repo.save(createSeed(now))).rejects.toThrow("Could not save");
  });
  it("rejects wrong schema versions", async () => {
    const storage = memory();
    storage.setItem(
      "fuelup:v1",
      JSON.stringify({ ...createSeed(now), version: 2 }),
    );
    await expect(new LocalRepository(storage).load()).rejects.toThrow();
  });
});
