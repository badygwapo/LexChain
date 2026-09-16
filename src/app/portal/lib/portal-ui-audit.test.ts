// @vitest-environment jsdom
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { createElement } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from "vitest";
import ProfilePage from '@/features/account/pages/profile-page';
import PortalChatbot from '@/features/portal/components/portal-chatbot';

const profile = vi.hoisted(() => ({ role: 'document_issuer' }));

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: { f_name: 'Ada', l_name: 'Lovelace', email: 'ada@example.com', role: profile.role }, isLoading: false }),
}));

vi.mock('next/link', () => ({ default: ({ href, children, ...props }: React.ComponentProps<'a'>) => createElement('a', { href, ...props }, children) }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

afterEach(() => {
  profile.role = 'document_issuer';
  cleanup();
});

const appDirectory = path.resolve(process.cwd(), "src", "app");
const featuresDirectory = path.resolve(process.cwd(), "src", "features");

async function sourceFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(entryPath);
    return entry.name.endsWith(".ts") || entry.name.endsWith(".tsx") ? [entryPath] : [];
  }));

  return nested.flat();
}

describe("portal UI source audit", () => {
  it("keeps rendered admin product copy neutral", async () => {
    const adminSources = await Promise.all((await sourceFiles(path.join(appDirectory, "admin"))).map((file) => readFile(file, "utf8")));

    expect(adminSources.join("\n")).not.toMatch(/super admin|developer dashboard|platform administration/i);
  });

  it("names the notification and uploaded-file removal controls", async () => {
    const [topbar, upload] = await Promise.all([
      readFile(path.join(featuresDirectory, "portal/components/portal-topbar.tsx"), "utf8"),
      readFile(path.join(featuresDirectory, "documents/pages/upload-page.tsx"), "utf8"),
    ]);

    expect(topbar).toContain('aria-label="View notifications"');
    expect(upload).toContain('aria-label="Remove uploaded file"');
  });

  it("provides a keyboard-reachable PDF chooser", async () => {
    const upload = await readFile(path.join(featuresDirectory, "documents/pages/upload-page.tsx"), "utf8");

    const chooser = upload.match(/<button[\s\S]*?Choose a PDF[\s\S]*?<\/button>/)?.[0];

    expect(chooser).toContain('type="button"');
    expect(chooser).toContain('onClick={() => inputRef.current?.click()}');
  });

  it('links profile support to the support mailbox', () => {
    render(createElement(ProfilePage));

    expect(screen.getByRole('link', { name: /help and support/i }).getAttribute('href')).toBe('mailto:support@lexchain.app');
  });

  it('uses Lawyer terminology in participant request guidance', () => {
    profile.role = 'document_participant';
    render(createElement(ProfilePage));

    expect(screen.getByText('Track requests sent to your Lawyer')).toBeTruthy();
  });

  it('offers safe document-assistant guidance', () => {
    render(createElement(PortalChatbot));
    fireEvent.click(screen.getByRole('button', { name: 'Open document assistant' }));

    expect(screen.getByText('Suggested questions')).toBeTruthy();
    expect(screen.getByText('AI-generated assistance. Review the original PDF before relying on an answer.')).toBeTruthy();
  });
});
