'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DescriptionIcon from '@mui/icons-material/Description';

export default function PdfViewerPage() {
  const { id } = useParams();
  const [version, setVersion] = useState('1');

  return (
    <div className="space-y-5">
      <Link href={`/portal/documents/${id}`} className="flex items-center gap-2 text-sm font-bold text-[var(--portal-primary)]">
        <ArrowBackIcon fontSize="small" /> Back to Document
      </Link>

      <h1 className="text-lg font-extrabold text-[var(--portal-navy)]">PDF Viewer</h1>

      <div className="flex items-center gap-3">
        <select
          value={version}
          onChange={(e) => setVersion(e.target.value)}
          className="px-3 py-2 rounded-xl border border-[var(--portal-border-soft)] text-sm text-[var(--portal-navy)]"
        >
          <option value="1">Version 1 (Latest)</option>
          <option value="0">Version 0 (Original)</option>
        </select>
        <button className="px-4 py-2.5 rounded-xl bg-[var(--portal-primary)] text-white font-semibold text-sm">
          Download
        </button>
      </div>

      <div className="bg-white rounded-[18px] border border-[var(--portal-border-soft)] shadow-[0_4px_12px_rgba(19,59,115,0.05)] p-10 flex flex-col items-center justify-center min-h-[400px] text-center">
        <DescriptionIcon style={{ fontSize: 64 }} className="text-[var(--portal-primary)] opacity-30 mb-4" />
        <p className="text-sm font-semibold text-[var(--portal-navy)]">PDF Viewer — Document: {id}</p>
        <p className="text-xs text-muted mt-1">Version {version}</p>
      </div>
    </div>
  );
}
