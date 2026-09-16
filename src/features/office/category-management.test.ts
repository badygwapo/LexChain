// @vitest-environment jsdom
import { createElement } from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from "vitest";
import CategoriesPage from '@/features/office/pages/categories-page';
import {
  createDemoCategory,
  deactivateDemoCategory,
  editDemoCategory,
  initialDemoCategories,
} from "@/features/office/category-management";
import { canAccessPortalFeature } from "@/features/access/portal-access";

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: { role: 'document_issuer' }, isLoading: false }),
}));

afterEach(cleanup);

describe("demo category management", () => {
  it("starts with local category data and creates a new active category in page state", () => {
    const category = createDemoCategory(initialDemoCategories, "Affidavits");

    expect(category).toMatchObject({ name: "Affidavits", active: true });
    expect(category.id).toMatch(/^demo-category-/);
  });

  it("gives duplicate names distinct IDs so each category can be updated independently", () => {
    const first = createDemoCategory(initialDemoCategories, "Affidavits");
    const categories = [...initialDemoCategories, first];
    const second = createDemoCategory(categories, "Affidavits");

    expect(second.id).not.toBe(first.id);

    const edited = editDemoCategory([...categories, second], second.id, "Sworn Affidavits");
    expect(edited.find((category) => category.id === first.id)).toMatchObject({
      name: "Affidavits",
      active: true,
    });
    expect(edited.find((category) => category.id === second.id)).toMatchObject({
      name: "Sworn Affidavits",
      active: true,
    });

    const deactivated = deactivateDemoCategory(edited, second.id);
    expect(deactivated.find((category) => category.id === first.id)).toMatchObject({ active: true });
    expect(deactivated.find((category) => category.id === second.id)).toMatchObject({ active: false });
  });

  it("edits a category name without changing its active state", () => {
    const edited = editDemoCategory(initialDemoCategories, "demo-category-contracts", "Contracts and Agreements");

    expect(edited).toContainEqual({
      id: "demo-category-contracts",
      name: "Contracts and Agreements",
      active: true,
    });
  });

  it("deactivates a category instead of removing it", () => {
    const deactivated = deactivateDemoCategory(initialDemoCategories, "demo-category-certificates");

    expect(deactivated).toContainEqual({
      id: "demo-category-certificates",
      name: "Certificates",
      active: false,
    });
    expect(deactivated).toHaveLength(initialDemoCategories.length);
  });
});

describe("category access", () => {
  it('uses the portal management layout for the category directory', () => {
    render(createElement(CategoriesPage));

    const heading = screen.getByRole('heading', { name: 'Categories', level: 1 });
    const view = heading.closest('header')?.parentElement;
    const directory = screen.getByRole('heading', { name: 'Category Directory' }).closest('article');

    expect(view?.className).toContain('xl:h-[calc(100dvh-113px)]');
    expect(screen.getByRole('button', { name: 'Create Category' })).toBeTruthy();
    expect(screen.getByText('Total Categories')).toBeTruthy();
    expect(directory?.className).toContain('xl:h-full');
    expect(screen.queryByRole('heading', { name: 'Category Editor' })).toBeNull();
  });

  it("allows the document issuer and denies participants", () => {
    expect(canAccessPortalFeature("lawyer", "categories")).toBe(true);
    expect(canAccessPortalFeature("user", "categories")).toBe(false);
  });

  it('confirms category deactivation before changing local data', () => {
    render(createElement(CategoriesPage));

    fireEvent.click(screen.getAllByRole('button', { name: /^Deactivate / })[0]);

    expect(screen.getByRole('dialog', { name: 'Deactivate Contracts category' })).toBeTruthy();
  });

  it('opens the category editor in a modal for create and edit', () => {
    render(createElement(CategoriesPage));

    expect(screen.queryByRole('dialog', { name: 'Create Category' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Create Category' }));

    const createDialog = screen.getByRole('dialog', { name: 'Create Category' });
    expect(within(createDialog).getByLabelText('Category name')).toBeTruthy();
    fireEvent.click(within(createDialog).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog', { name: 'Create Category' })).toBeNull();

    fireEvent.click(screen.getAllByRole('button', { name: /^Edit / })[0]);
    expect(screen.getByRole('dialog', { name: 'Edit Category' })).toBeTruthy();
  });

  it('moves focus to the category name field for create and edit', () => {
    render(createElement(CategoriesPage));

    fireEvent.click(screen.getByRole('button', { name: 'Create Category' }));
    const nameInput = screen.getByLabelText('Category name');
    expect(document.activeElement).toBe(nameInput);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.click(screen.getAllByRole('button', { name: /^Edit / })[0]);
    expect(document.activeElement).toBe(screen.getByLabelText('Category name'));
  });
});
