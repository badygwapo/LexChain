'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import type { ApiSchema } from '@/shared/types/index';
import { canAccessPortalFeature, getPortalUiRole } from "@/features/access";
import { Modal } from '@/features/admin/components/modal';
import { MetricCard } from '@/features/portal/components';
import {
  createDemoCategory,
  deactivateDemoCategory,
  editDemoCategory,
  initialDemoCategories,
  type DemoCategory,
} from '@/features/office/category-management';

type UserProfile = ApiSchema<'UserProfileResponse'>;

async function fetchProfile(): Promise<UserProfile | null> {
  const response = await fetch('/api/portal/proxy?path=%2Fusers%2F', { credentials: 'same-origin' });
  if (!response.ok) return null;
  return response.json();
}

export default function CategoriesPage() {
  const profileQuery = useQuery<UserProfile | null>({ queryKey: ['portal-profile'], queryFn: fetchProfile });
  const [categories, setCategories] = useState<DemoCategory[]>(initialDemoCategories);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<DemoCategory | null>(null);
  const [categoryToDeactivate, setCategoryToDeactivate] = useState<DemoCategory | null>(null);
  const [draftName, setDraftName] = useState('');
  const categoryNameRef = useRef<HTMLInputElement>(null);
  const isIssuer = canAccessPortalFeature(getPortalUiRole(profileQuery.data?.role), 'categories');

  useEffect(() => {
    if (editorOpen) categoryNameRef.current?.focus();
  }, [editorOpen]);

  function openCreate() {
    setEditingCategory(null);
    setDraftName('');
    setEditorOpen(true);
  }

  function openEdit(category: DemoCategory) {
    setEditingCategory(category);
    setDraftName(category.name);
    setEditorOpen(true);
  }

  function closeEditor() {
    setEditorOpen(false);
    setEditingCategory(null);
    setDraftName('');
  }

  function saveCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draftName.trim()) return;

    setCategories((current) => editingCategory
      ? editDemoCategory(current, editingCategory.id, draftName)
      : [...current, createDemoCategory(current, draftName)]);
    closeEditor();
  }

  if (profileQuery.isLoading) {
    return <p className="py-10 text-sm font-semibold text-[#64748b]">Loading category access…</p>;
  }

  if (!isIssuer) {
    return (
      <section className="rounded-[18px] border border-[#E8F0F8] bg-white p-8 text-center">
        <h1 className="text-xl font-black text-[#0C2B49]">Categories are restricted</h1>
        <p className="mt-2 text-sm text-[#64748b]">Only Document Issuers can manage document categories.</p>
      </section>
    );
  }

  const isEditing = editingCategory !== null;
  const activeCount = categories.filter((category) => category.active).length;
  const inactiveCount = categories.length - activeCount;

  return (
    <div className="flex w-full flex-col gap-5 xl:h-[calc(100dvh-113px)] xl:min-h-0">
      <header className="flex shrink-0 flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#0879D8]">LexChain Operations</p>
          <h1 className="mt-1 text-3xl font-black leading-tight text-[#071B33]">Categories</h1>
          <p className="mt-1 text-sm font-semibold text-[#4B6382]">Organize the office document repository with clear category labels.</p>
        </div>
        <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-[#0985E7] px-5 py-3 text-sm font-black text-white shadow-sm shadow-[#0985E7]/25 transition hover:bg-[#0770C4]">
          <AddIcon fontSize="small" /> Create Category
        </button>
      </header>

      <section className="grid shrink-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard icon={<CategoryOutlinedIcon fontSize="small" />} label="Total Categories" value={categories.length} detail="Configured labels" color="bg-[#EAF3FF] text-[#0879D8]" />
        <MetricCard icon={<CheckCircleIcon fontSize="small" />} label="Active" value={activeCount} detail="Available for documents" color="bg-[#EAFBF1] text-[#16A34A]" />
        <MetricCard icon={<BlockOutlinedIcon fontSize="small" />} label="Inactive" value={inactiveCount} detail="Kept for existing labels" color="bg-[#FFF4DF] text-[#D97706]" />
      </section>

      <section className="grid min-h-0 gap-4 xl:flex-1">
        <article className="flex h-fit min-h-[520px] min-w-0 self-start flex-col overflow-hidden rounded-2xl border border-[#E4EEF9] bg-white shadow-sm shadow-[#DDEAF7]/35 xl:h-full xl:min-h-0">
          <div className="shrink-0 border-b border-[#E4EEF9] p-5">
            <h2 className="text-lg font-black text-[#071B33]">Category Directory</h2>
            <p className="mt-1 text-sm font-semibold text-[#5B6F8A]">Manage the labels available to your office documents.</p>
          </div>
          <div className="admin-table-scroll min-h-0 flex-1 overflow-auto">
            <ul className="divide-y divide-[#EEF4F8]">
              {categories.map((category) => (
                <li key={category.id} className="flex min-h-[68px] flex-wrap items-center justify-between gap-3 px-5 py-3 transition hover:bg-[#F8FBFF]">
                  <div className="min-w-0">
                    <p className="truncate font-black text-[#071B33]">{category.name}</p>
                    <span className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-black ${category.active ? 'bg-[#EAF8F0] text-[#12A150]' : 'bg-[#F1F5F9] text-[#64748b]'}`}>
                      <span aria-hidden="true" className={`size-1.5 rounded-full ${category.active ? 'bg-[#12A150]' : 'bg-[#94A3B8]'}`} />
                      {category.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => openEdit(category)} aria-label={`Edit ${category.name}`} className="rounded-lg p-1.5 text-[#4B6382] transition hover:bg-[#EEF4FB] hover:text-[#0985E7]"><EditOutlinedIcon sx={{ fontSize: 18 }} /></button>
                    {category.active && <button type="button" onClick={() => setCategoryToDeactivate(category)} aria-label={`Deactivate ${category.name}`} className="rounded-lg p-1.5 text-[#4B6382] transition hover:bg-[#FFF4DF] hover:text-[#B45309]"><BlockOutlinedIcon sx={{ fontSize: 18 }} /></button>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </article>

      </section>
      <Modal open={editorOpen} onClose={closeEditor} title={isEditing ? 'Edit Category' : 'Create Category'}>
        <p className="text-sm font-semibold text-[#5B6F8A]">{isEditing ? 'Update an existing category.' : 'Add a label for future documents.'}</p>
        <form onSubmit={saveCategory} className="mt-5">
          <label className="grid gap-1.5 text-sm font-black text-[#0C2B49]" htmlFor="category-name">
            Category name
            <input ref={categoryNameRef} id="category-name" value={draftName} onChange={(event) => setDraftName(event.target.value)} placeholder="e.g. Affidavits" className="min-w-0 w-full rounded-xl border border-[#D9E5F0] px-3 py-2.5 text-sm font-semibold text-[#0C2B49] outline-none focus:border-[#0985E7] focus:ring-2 focus:ring-[#0985E7]/20" />
          </label>
          <div className="mt-3 flex flex-wrap justify-end gap-2">
            <button type="button" onClick={closeEditor} className="rounded-xl border border-[#D9E5F0] px-4 py-2.5 text-sm font-black text-[#0C2B49] transition hover:border-[#0985E7]">Cancel</button>
            <button type="submit" disabled={!draftName.trim()} className="rounded-xl bg-[#0985E7] px-4 py-2.5 text-sm font-black text-white transition hover:bg-[#0770C4] disabled:cursor-not-allowed disabled:opacity-50">{isEditing ? 'Save Changes' : 'Add Category'}</button>
          </div>
        </form>
        <p role="status" className="mt-5 rounded-xl border border-[#CFE7FC] bg-[#F1F8FF] px-4 py-3 text-sm font-semibold text-[#0C5B9C]">Demo data — changes reset when this page is refreshed.</p>
      </Modal>
      {categoryToDeactivate && (
        <dialog open aria-modal="true" aria-label={`Deactivate ${categoryToDeactivate.name} category`} className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-[#E4EEF9] bg-white p-5 shadow-xl shadow-[#183B6B]/10">
          <p className="font-black text-[#0C2B49]">Deactivate {categoryToDeactivate.name}?</p>
          <p className="mt-2 text-sm text-[#64748b]">Documents already using this category keep their existing label.</p>
          <div className="mt-5 flex justify-end gap-3">
            <button type="button" onClick={() => setCategoryToDeactivate(null)} className="rounded-xl border border-[#D9E5F0] px-4 py-2 text-sm font-black text-[#0C2B49]">Cancel</button>
            <button type="button" onClick={() => { setCategories((current) => deactivateDemoCategory(current, categoryToDeactivate.id)); setCategoryToDeactivate(null); }} className="rounded-xl bg-[#B45309] px-4 py-2 text-sm font-black text-white">Deactivate category</button>
          </div>
        </dialog>
      )}
    </div>
  );
}
