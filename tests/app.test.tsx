import React from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../src/App";
import { FuelUpProvider } from "../src/state/FuelUpProvider";
import { createSeed } from "../src/data/seed";
afterEach(cleanup);
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
});
describe("dashboard integration", () => {
  it("switches to cooking, completes the meal, and persists inventory", async () => {
    const user = userEvent.setup(),
      save = vi.fn(async () => {});
    render(
      <FuelUpProvider repository={{ load: async () => createSeed(), save }}>
        <App />
      </FuelUpProvider>,
    );
    await screen.findByText("Food near you");
    await user.selectOptions(screen.getByLabelText("Current location"), "dorm");
    await screen.findByText("Egg & greens rice bowl");
    await user.click(screen.getByRole("button", { name: "Let’s make this" }));
    await user.click(
      screen.getByRole("button", { name: "I’ve eaten · log this meal" }),
    );
    await screen.findByText("Meal logged. One less thing on your plate.");
    await waitFor(() =>
      expect(save.mock.calls.at(-1)?.[0].meals).toHaveLength(1),
    );
    expect(
      save.mock.calls
        .at(-1)?.[0]
        .fridge.find((i: { name: string }) => i.name === "eggs").quantity,
    ).toBe(1);
  });
  it("uses real-place lookup instead of fictional campus dining", async () => {
    const user = userEvent.setup();
    render(
      <FuelUpProvider
        repository={{ load: async () => createSeed(), save: async () => {} }}
      >
        <App />
      </FuelUpProvider>,
    );
    expect(await screen.findByRole("button", { name: "Use my current location" })).toBeTruthy();
    expect(screen.queryByText("The Green Canteen")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Area & food preferences" }));
    await user.selectOptions(screen.getByLabelText("Food preference"), "halal");
    expect(screen.getByRole("link", { name: "Search Google Maps" }).getAttribute("href")).toContain("halal");
  });
  it("surfaces a persistence failure without losing the UI", async () => {
    render(
      <FuelUpProvider
        repository={{
          load: async () => createSeed(),
          save: async () => {
            throw new Error("Storage unavailable");
          },
        }}
      >
        <App />
      </FuelUpProvider>,
    );
    expect(await screen.findByRole("alert")).toBeTruthy();
  });
});
