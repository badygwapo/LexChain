export type DemoCategory = {
  id: string;
  name: string;
  active: boolean;
};

export const initialDemoCategories: DemoCategory[] = [
  { id: "demo-category-contracts", name: "Contracts", active: true },
  { id: "demo-category-certificates", name: "Certificates", active: true },
  { id: "demo-category-corporate", name: "Corporate Records", active: true },
];

export function createDemoCategory(categories: DemoCategory[], name: string): DemoCategory {
  const normalizedName = name.trim();
  const baseId = `demo-category-${normalizedName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
  const categoryIds = new Set(categories.map((category) => category.id));
  let id = baseId;
  let duplicateNumber = 2;

  while (categoryIds.has(id)) {
    id = `${baseId}-${duplicateNumber}`;
    duplicateNumber += 1;
  }

  return {
    id,
    name: normalizedName,
    active: true,
  };
}

export function editDemoCategory(categories: DemoCategory[], id: string, name: string): DemoCategory[] {
  const normalizedName = name.trim();
  return categories.map((category) => category.id === id ? { ...category, name: normalizedName } : category);
}

export function deactivateDemoCategory(categories: DemoCategory[], id: string): DemoCategory[] {
  return categories.map((category) => category.id === id ? { ...category, active: false } : category);
}
