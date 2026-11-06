import React from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Root from "../src/Root";
import Welcome from "../src/components/Welcome";
beforeEach(()=>{window.scrollTo=vi.fn();});
vi.mock("../src/components/ScrollVelocity/ScrollVelocity", () => ({
  default: ({ texts, paused }: { texts: string[]; paused: boolean }) => (
    <div data-testid="scroll-animation" data-paused={String(paused)}>
      {texts.join(" ")}
    </div>
  ),
}));
vi.mock("../src/App", () => ({
  default: () => <div>Dashboard functions</div>,
}));
afterEach(() => {
  cleanup();
  window.history.replaceState(null, "", "/");
});
it("opens on the welcome page and enters the existing app", async () => {
  const user = userEvent.setup();
  render(<Root />);
  expect(screen.getByRole("heading", { name: /your next meal/i })).toBeTruthy();
  expect(screen.queryByText("Dashboard functions")).toBeNull();
  await user.click(screen.getByRole("link", { name: "Get started" }));
  expect(await screen.findByText("Dashboard functions")).toBeTruthy();
  expect(window.location.hash).toBe("#app");
});
it("supports refreshing a direct app link", () => {
  window.history.replaceState(null, "", "/#app");
  render(<Root />);
  expect(screen.getByText("Dashboard functions")).toBeTruthy();
});
it("provides an explicit pause control for the requested animation", async () => {
  const user = userEvent.setup();
  render(<Welcome />);
  await user.click(screen.getByRole("button", { name: "Pause animation" }));
  expect(
    screen.getByTestId("scroll-animation").getAttribute("data-paused"),
  ).toBe("true");
  await user.click(screen.getByRole("button", { name: "Play animation" }));
  expect(
    screen.getByTestId("scroll-animation").getAttribute("data-paused"),
  ).toBe("false");
});
