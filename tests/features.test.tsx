import React from "react";
import { afterEach, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../src/App";
import { FuelUpProvider } from "../src/state/FuelUpProvider";
import { createSeed } from "../src/data/seed";
HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
afterEach(cleanup);
it("opens recipes and kitchen setup on demand in My fridge", async () => {
  const user = userEvent.setup();
  render(
    <FuelUpProvider
      repository={{ load: async () => createSeed(), save: async () => {} }}
    >
      <App />
    </FuelUpProvider>,
  );
  await user.click(
    await screen.findByRole("button", { name: "Recipes & kitchen setup" }),
  );
  await user.click(screen.getByRole("button", { name: "Find simple recipes" }));
  expect(screen.getByText("Microwave scrambled egg")).toBeTruthy();
  expect(screen.queryByRole("checkbox", { name: "Microwave", exact: true })).toBeNull();
  await user.click(screen.getByRole("button", { name: /Kitchen setup/ }));
  await user.click(screen.getByLabelText("Microwave", { exact: true }));
  await user.click(screen.getByLabelText("Hot Plate", { exact: true }));
  expect(screen.getByText("Soft scrambled egg")).toBeTruthy();
  expect(screen.queryByText("Microwave scrambled egg")).toBeNull();
});
it("keeps the fridge inventory and entry form behind buttons without losing a draft", async () => {
  const user = userEvent.setup();
  render(<FuelUpProvider repository={{ load: async () => createSeed(), save: async () => {} }}><App /></FuelUpProvider>);
  await user.click(await screen.findByRole("button", { name: "Recipes & kitchen setup" }));
  const inventory = screen.getByRole("button", { name: /View ingredients/ });
  expect(inventory.getAttribute("aria-expanded")).toBe("false");
  expect(screen.queryByRole("button", { name: "Remove eggs" })).toBeNull();
  await user.click(inventory);
  expect(screen.getByRole("button", { name: "Remove eggs" })).toBeTruthy();
  await user.click(inventory);
  expect(screen.queryByRole("button", { name: "Remove eggs" })).toBeNull();
  const add = screen.getByRole("button", { name: "Add ingredients" });
  expect(screen.queryByRole("combobox", { name: "Ingredient", exact: true })).toBeNull();
  await user.click(add);
  await user.type(screen.getByRole("combobox", { name: "Ingredient", exact: true }), "banana");
  await user.click(add);
  await user.click(add);
  expect((screen.getByRole("combobox", { name: "Ingredient", exact: true }) as HTMLInputElement).value).toBe("banana");
});
it("opens class lists with keyboard and keeps recipe instructions collapsed initially", async () => {
  const user = userEvent.setup();
  render(<FuelUpProvider repository={{ load: async () => createSeed(), save: async () => {} }}><App /></FuelUpProvider>);
  const classes = await screen.findByRole("button", { name: /View today’s classes/ });
  expect(classes.getAttribute("aria-expanded")).toBe("false");
  classes.focus();
  await user.keyboard("{Enter}");
  expect(classes.getAttribute("aria-expanded")).toBe("true");
  await user.click(screen.getByRole("button", { name: "Recipes & kitchen setup" }));
  await user.click(screen.getByRole("button", { name: "Find simple recipes" }));
  const recipe = screen.getByRole("button", { name: /Microwave scrambled egg/ });
  const content = document.getElementById(recipe.getAttribute("aria-controls")!);
  expect(content?.hidden).toBe(true);
  await user.click(recipe);
  expect(content?.hidden).toBe(false);
  expect(content?.querySelectorAll("li").length).toBeGreaterThan(0);
});
it("demonstrates a timetable reminder and removes decorative captions", async () => {
  const user = userEvent.setup();
  render(
    <FuelUpProvider
      repository={{ load: async () => createSeed(), save: async () => {} }}
    >
      <App />
    </FuelUpProvider>,
  );
  await user.click(
    await screen.findByRole("button", { name: "Try demo reminder" }),
  );
  expect(screen.getByText("Demo reminder: Time to refuel")).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Dismiss reminder" }));
  expect(screen.queryByText("Demo reminder: Time to refuel")).toBeNull();
  expect(screen.queryByText("A little fuel. A better day.")).toBeNull();
});
