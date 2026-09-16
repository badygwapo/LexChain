'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import SearchIcon from '@mui/icons-material/Search';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import type { PortalSearchHit } from "@/features/access";

async function searchDocuments(query: string): Promise<PortalSearchHit[]> {
  const res = await fetch(
    `/api/portal/proxy-post?path=${encodeURIComponent('/search')}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
      credentials: 'same-origin',
    },
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.results ?? [];
}

export function PortalSearchBar() {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [results, setResults] = useState<PortalSearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const doSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const hits = await searchDocuments(query);
      setResults(hits);
      setOpen(true);
      setSelectedIndex(-1);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const onChange = (value: string) => {
    setInput(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 300);
  };

  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navigateToSearch = (query: string) => {
    router.push(`/portal/search?q=${encodeURIComponent(query)}`);
    setOpen(false);
    setInput('');
  };

  const navigateToDocument = (hit: PortalSearchHit) => {
    router.push(`/portal/documents/${hit.document_id}`);
    setOpen(false);
    setInput('');
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) { setOpen(true); return; }
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && results[selectedIndex]) {
        navigateToDocument(results[selectedIndex]);
      } else if (input.trim()) {
        navigateToSearch(input.trim());
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative flex min-w-0 flex-1">
      <div className="flex w-full items-center gap-2 rounded-xl border border-[var(--portal-border-soft)] bg-white px-3 py-2 text-sm transition focus-within:border-[#0985E7]">
        <SearchIcon fontSize="small" sx={{ color: 'var(--portal-text-muted)' }} />
        <input
          type="text"
          value={input}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          placeholder="Search documents..."
          aria-label="Search documents"
          role="combobox"
          aria-expanded={open}
          aria-controls="search-results"
          aria-activedescendant={selectedIndex >= 0 ? `search-result-${selectedIndex}` : undefined}
          className="flex-1 bg-transparent text-[var(--portal-navy)] outline-none placeholder:text-[var(--portal-text-muted)]"
        />
        {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--portal-border-soft)] border-t-[#0985E7]" />}
      </div>

      {open && (
        <ul
          id="search-results"
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1 max-h-64 overflow-y-auto rounded-xl border border-[var(--portal-border-soft)] bg-white shadow-lg z-50"
        >
          {results.length === 0 ? (
            <li className="px-3 py-4 text-center text-sm text-[var(--portal-text-muted)]">No results found</li>
          ) : (
            results.map((hit, i) => (
              <li
                key={hit.chunk_id}
                id={`search-result-${i}`}
                role="option"
                aria-selected={i === selectedIndex}
                onMouseDown={() => navigateToDocument(hit)}
                onMouseEnter={() => setSelectedIndex(i)}
                className={`cursor-pointer px-3 py-2.5 text-sm ${i === selectedIndex ? 'bg-[#EAF4FF]' : 'hover:bg-[#F5F8FA]'}`}
              >
                <div className="flex items-center gap-2">
                  <InsertDriveFileIcon sx={{ fontSize: 16, color: '#0985E7' }} />
                  <p className="font-semibold text-[var(--portal-navy)]">
                    Document {hit.document_id.slice(0, 8)}...
                  </p>
                </div>
                {hit.text && <p className="mt-0.5 line-clamp-2 text-xs text-[var(--portal-text-muted)]">{hit.text}</p>}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
