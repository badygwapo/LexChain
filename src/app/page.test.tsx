// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import Home from "./page";

afterEach(cleanup);

describe("Home", () => {
  it("starts in light mode and allows switching both ways", () => {
    const { container } = render(<Home />);
    const landing = container.querySelector(".landing");

    expect(landing?.getAttribute("data-theme")).toBe("light");
    fireEvent.click(screen.getByRole("button", { name: "Switch to dark mode" }));
    expect(landing?.getAttribute("data-theme")).toBe("dark");
    fireEvent.click(screen.getByRole("button", { name: "Switch to light mode" }));
    expect(landing?.getAttribute("data-theme")).toBe("light");
  });

  it("uses Sign In for the login call to action", () => {
    render(<Home />);

    expect(screen.queryByText("Admin Login")).toBeNull();
    const links = screen.getAllByRole("link", { name: "Sign In" });
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute("href")).toBe("/login");
  });

  it("makes download options and the workflow reachable", () => {
    render(<Home />);

    for (const name of ["Explore App Store download options", "Explore Google Play download options"]) {
      expect(screen.getByRole("link", { name }).getAttribute("href")).toBe("/download");
    }
    const workflowLink = screen.getByRole("link", { name: "See how it works" });
    expect(workflowLink.getAttribute("href")).toBe("#workflow");
    expect(document.getElementById("workflow")?.textContent).toContain("Upload");
    expect(screen.getByRole("link", { name: "Skip to content" }).getAttribute("href")).toBe("#main-content");
  });
});
