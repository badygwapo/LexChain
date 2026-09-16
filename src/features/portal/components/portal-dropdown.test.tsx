// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PortalDropdown } from '@/features/portal/components/portal-dropdown';

const options = [
  { label: 'Document reports', value: 'document' },
  { label: 'System reports', value: 'system' },
];

afterEach(cleanup);

describe('PortalDropdown', () => {
  it('selects an option, closes, and returns focus to its trigger', () => {
    const onChange = vi.fn();
    render(<PortalDropdown ariaLabel="Report scope" options={options} value="document" onChange={onChange} />);

    const trigger = screen.getByRole('button', { name: 'Report scope' });
    fireEvent.click(trigger);
    expect(screen.getByRole('listbox', { name: 'Report scope' })).toBeTruthy();
    expect(screen.getByRole('option', { name: 'Document reports' }).getAttribute('aria-selected')).toBe('true');

    fireEvent.click(screen.getByRole('option', { name: 'System reports' }));
    expect(onChange).toHaveBeenCalledWith('system');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('selects the next option with ArrowDown and Enter', () => {
    const onChange = vi.fn();
    render(<PortalDropdown ariaLabel="Report scope" options={options} value="document" onChange={onChange} />);

    const trigger = screen.getByRole('button', { name: 'Report scope' });
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    fireEvent.keyDown(trigger, { key: 'Enter' });

    expect(onChange).toHaveBeenCalledWith('system');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('closes on Escape and outside clicks without changing the selection', () => {
    const onChange = vi.fn();
    render(<PortalDropdown ariaLabel="Report scope" options={options} value="document" onChange={onChange} />);

    const trigger = screen.getByRole('button', { name: 'Report scope' });
    fireEvent.click(trigger);
    fireEvent.keyDown(trigger, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).toBeNull();

    fireEvent.click(trigger);
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });
});
