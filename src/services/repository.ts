import type { AppState } from "../domain/models";
import { createSeed } from "../data/seed";
import { savedSchema } from "../domain/validation";
export interface FuelUpRepository {
  load(): Promise<AppState>;
  save(state: AppState): Promise<void>;
}
export class LocalRepository implements FuelUpRepository {
  constructor(
    private storage: Pick<Storage, "getItem" | "setItem">,
    private now = () => new Date(),
  ) {}
  async load() {
    const seed = createSeed(this.now());
    const raw = this.storage.getItem("fuelup:v1");
    if (!raw) return seed;
    try {
      return { ...seed, ...savedSchema.parse(JSON.parse(raw)) };
    } catch {
      throw new Error(
        "Saved data could not be read. Reload to retry, or reset your local demo.",
      );
    }
  }
  async save(state: AppState) {
    try {
      this.storage.setItem(
        "fuelup:v1",
        JSON.stringify(savedSchema.parse(state)),
      );
    } catch {
      throw new Error(
        "Could not save on this device. Your changes are still here until you leave this page.",
      );
    }
  }
}
