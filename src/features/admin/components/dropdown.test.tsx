// @vitest-environment jsdom
import { expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Dropdown } from "./dropdown";

it("opens page-size options above the trigger and closes after selection", () => {
  const onChange = vi.fn();
  const view = render(<Dropdown openUp value="5" onChange={onChange} options={[{ label: "5 / page", value: "5" }, { label: "10 / page", value: "10" }]} />);
  fireEvent.click(screen.getByRole("button", { name: "5 / page" }));
  const option = screen.getByRole("button", { name: "10 / page" });
  expect(option.parentElement?.className).toContain("bottom-full");
  fireEvent.click(option);
  expect(onChange).toHaveBeenCalledWith("10");
  expect(screen.queryByRole("button", { name: "10 / page" })).toBeNull();
  view.unmount();
});
