import AppLayout from '@/layouts/app-layout';
import { Edit2, Plus, Search, Trash2, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

type FaqRow = {
    faq_id: number;
    faq_question: string;
    faq_answer: string;
    category?: string | null;
    faq_status: 'Active' | 'Inactive';
    views?: number;
    created_at?: string;
    updated_at?: string;
};

export default function ManageFaq({
    rows,
    summary,
    categories,
    filters,
}: {
    rows: FaqRow[];
    summary: any;
    categories: string[];
    filters?: { q?: string; category?: string };
}) {
    const [list, setList] = useState<FaqRow[]>(rows);
    const [q, setQ] = useState(filters?.q || '');
    const [category, setCategory] = useState(filters?.category || '');
    const searchRef = useRef<HTMLInputElement | null>(null);
    const [editing, setEditing] = useState<FaqRow | null>(null);
    const [editQuestion, setEditQuestion] = useState('');
    const [editAnswer, setEditAnswer] = useState('');
    const [editCategory, setEditCategory] = useState('');
    const [editStatus, setEditStatus] = useState<'Active' | 'Inactive'>('Inactive');

    // Add modal state
    const [adding, setAdding] = useState(false);
    const [addQuestion, setAddQuestion] = useState('');
    const [addAnswer, setAddAnswer] = useState('');
    const [addCategory, setAddCategory] = useState('');
    const [addStatus, setAddStatus] = useState<'Active' | 'Inactive'>('Active');

    const filtered = useMemo(() => {
        const needle = q.trim().toLowerCase();
        return list.filter((f) => {
            const matchQ = !needle || f.faq_question.toLowerCase().includes(needle) || f.faq_answer.toLowerCase().includes(needle);
            const matchC = !category || (f.category || '') === category;
            return matchQ && matchC;
        });
    }, [list, q, category]);

    const refreshFromServer = () => {
        // Simple client-side filter reflects UI immediately; full refresh on navigation
        window.location.href = `/staff/manage-faq?` + new URLSearchParams({ q, category }).toString();
    };

    const csrf = (typeof document !== 'undefined' ? document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') : '') || '';

    const publish = async (faq_id: number, to: 'publish' | 'unpublish') => {
        await fetch(`/staff/faq/${faq_id}/${to}`, {
            method: 'POST',
            headers: { 'X-Requested-With': 'XMLHttpRequest', 'X-CSRF-TOKEN': csrf },
        });
        setList((prev) => prev.map((r) => (r.faq_id === faq_id ? { ...r, faq_status: to === 'publish' ? 'Active' : 'Inactive', updated_at: new Date().toISOString() } : r)));
    };
    const remove = async (faq_id: number) => {
        await fetch(`/staff/faq/${faq_id}`, { method: 'DELETE', headers: { 'X-Requested-With': 'XMLHttpRequest', 'X-CSRF-TOKEN': csrf } });
        setList((prev) => prev.filter((r) => r.faq_id !== faq_id));
    };

    const categoryClasses = (cat?: string | null) => {
        const key = (cat || 'General').toLowerCase();
        // General: purple; Collection: blue; Payment: green
        if (key.includes('general')) return 'bg-purple-100 text-purple-700';
        if (key.includes('collect')) return 'bg-blue-100 text-blue-700';
        if (key.includes('pay')) return 'bg-emerald-100 text-emerald-700';
        return 'bg-gray-100 text-gray-700';
    };

    return (
        <AppLayout>
            <div className="space-y-6 p-6">
                <div>
                    <h1 className="text-2xl font-bold">FAQs</h1>
                    <p className="text-sm text-gray-500">Manage frequently asked questions for students</p>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl border bg-white p-4">
                        <div className="text-sm text-gray-600">Total FAQs</div>
                        <div className="text-2xl font-bold">{list.length}</div>
                        <div className="text-xs text-gray-500">All questions</div>
                    </div>
                    <div className="rounded-xl border bg-white p-4">
                        <div className="text-sm text-gray-600">Published</div>
                        <div className="text-2xl font-bold">{list.filter((r) => r.faq_status === 'Active').length}</div>
                        <div className="text-xs text-gray-500">Visible to students</div>
                    </div>
                </div>

                {/* Search and filter */}
                <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute top-1/2 left-2 -translate-y-1/2 text-gray-400" />
                        <input
                            ref={searchRef}
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Search FAQs..."
                            className="w-full rounded-md border px-7 py-2 text-sm"
                            onKeyDown={(e) => e.key === 'Enter' && refreshFromServer()}
                        />
                    </div>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-md border px-3 py-2 text-sm">
                        <option value="">All Categories</option>
                        {categories
                            .filter((c, index, arr) => arr.indexOf(c) === index)
                            .filter((c) => c && c.trim() !== '')
                            .map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                    </select>
                    <button
                        onClick={() => setAdding(true)}
                        className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-3 py-2 text-sm text-white"
                    >
                        <Plus size={16} /> Add FAQ
                    </button>
                </div>

                {/* List */}
                <div className="space-y-4">
                    {filtered.map((f) => (
                        <div key={f.faq_id} className="rounded-xl border bg-white">
                            <div className="flex items-start justify-between p-4">
                                <div className="pr-4">
                                    <div className="mb-2 flex items-center gap-2 text-xs">
                                        <span className={`rounded-full px-2 py-0.5 ${categoryClasses(f.category)}`}>{f.category || 'General'}</span>
                                        {f.faq_status === 'Inactive' && (
                                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">Draft</span>
                                        )}
                                    </div>
                                    <div className="text-lg font-semibold">{f.faq_question}</div>
                                    <div className="mt-2 text-sm text-gray-600">{f.faq_answer}</div>
                                    <div className="mt-3 text-xs text-gray-400">
                                        Created: {f.created_at ? new Date(f.created_at).toLocaleDateString() : 'N/A'}
                                    </div>
                                </div>
                                <div className="flex shrink-0 items-center gap-3">
                                    {f.faq_status === 'Active' ? (
                                        <button
                                            onClick={() => publish(f.faq_id, 'unpublish')}
                                            className="text-sm text-black hover:bg-gray-200 hover:ring-gray-200 focus-visible:outline-none active:bg-gray-200"
                                        >
                                            Unpublish
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => publish(f.faq_id, 'publish')}
                                            className="rounded-full border bg-gray-100 px-3 py-1 text-xs text-gray-600 opacity-80 hover:opacity-100"
                                        >
                                            Publish
                                        </button>
                                    )}
                                    <button
                                        onClick={() => {
                                            setEditing(f);
                                            setEditQuestion(f.faq_question);
                                            setEditAnswer(f.faq_answer);
                                            setEditCategory(f.category || '');
                                            setEditStatus(f.faq_status);
                                        }}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button onClick={() => remove(f.faq_id)} className="text-red-600 hover:text-red-700">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center justify-end pr-4 pb-3 text-xs text-gray-400">
                                Updated: {f.updated_at ? new Date(f.updated_at).toLocaleDateString() : 'N/A'}
                            </div>
                        </div>
                    ))}
                    {filtered.length === 0 && <div className="py-16 text-center text-gray-400">No results.</div>}
                </div>
            </div>

            {editing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/30" onClick={() => setEditing(null)} />
                    <div className="relative z-10 w-full max-w-xl rounded-xl bg-white p-6 shadow-xl">
                        <div className="mb-4 flex items-start justify-between">
                            <div>
                                <div className="text-lg font-semibold">Edit FAQ</div>
                                <div className="text-xs text-gray-500">Update the FAQ information</div>
                            </div>
                            <button className="text-gray-500 hover:text-gray-700" onClick={() => setEditing(null)}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <div className="mb-1 text-sm font-medium">Question</div>
                                <input
                                    value={editQuestion}
                                    onChange={(e) => setEditQuestion(e.target.value)}
                                    className="w-full rounded-md border px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <div className="mb-1 text-sm font-medium">Answer</div>
                                <textarea
                                    value={editAnswer}
                                    onChange={(e) => setEditAnswer(e.target.value)}
                                    className="h-28 w-full rounded-md border px-3 py-2 text-sm"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="mb-1 text-sm font-medium">Category</div>
                                    <select
                                        value={editCategory}
                                        onChange={(e) => setEditCategory(e.target.value)}
                                        className="w-full rounded-md border px-3 py-2 text-sm"
                                    >
                                        <option value="">General</option>
                                        {categories
                                            .filter((c, index, arr) => arr.indexOf(c) === index)
                                            .filter((c) => c && c.trim() !== '')
                                            .map((c) => (
                                                <option key={c} value={c}>
                                                    {c}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                                <div>
                                    <div className="mb-1 text-sm font-medium">Status</div>
                                    <select
                                        value={editStatus}
                                        onChange={(e) => setEditStatus(e.target.value as 'Active' | 'Inactive')}
                                        className="w-full rounded-md border px-3 py-2 text-sm"
                                    >
                                        <option value="Inactive">Draft</option>
                                        <option value="Active">Published</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button className="rounded-md border px-3 py-2 text-sm" onClick={() => setEditing(null)}>
                                    Cancel
                                </button>
                                <button
                                    className="rounded-md bg-gray-900 px-3 py-2 text-sm text-white"
                                    onClick={async () => {
                                        if (!editing) return;
                                        await fetch(`/staff/faq/${editing.faq_id}`, {
                                            method: 'PUT',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'X-Requested-With': 'XMLHttpRequest',
                                                'X-CSRF-TOKEN': csrf,
                                            },
                                            body: JSON.stringify({
                                                faq_question: editQuestion,
                                                faq_answer: editAnswer,
                                                category: editCategory,
                                                faq_status: editStatus,
                                            }),
                                        });
                                        setList((prev) =>
                                            prev.map((r) =>
                                                r.faq_id === editing.faq_id
                                                    ? {
                                                          ...r,
                                                          faq_question: editQuestion,
                                                          faq_answer: editAnswer,
                                                          category: editCategory,
                                                          faq_status: editStatus,
                                                      }
                                                    : r,
                                            ),
                                        );
                                        setEditing(null);
                                    }}
                                >
                                    Update FAQ
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {adding && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/30" onClick={() => setAdding(false)} />
                    <div className="relative z-10 w-full max-w-xl rounded-xl bg-white p-6 shadow-xl">
                        <div className="mb-4 flex items-start justify-between">
                            <div>
                                <div className="text-lg font-semibold">Add New FAQ</div>
                                <div className="text-xs text-gray-500">Create a new frequently asked question</div>
                            </div>
                            <button className="text-gray-500 hover:text-gray-700" onClick={() => setAdding(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <div className="mb-1 text-sm font-medium">Question</div>
                                <input
                                    value={addQuestion}
                                    onChange={(e) => setAddQuestion(e.target.value)}
                                    className="w-full rounded-md border px-3 py-2 text-sm"
                                    placeholder="Enter the question..."
                                />
                            </div>
                            <div>
                                <div className="mb-1 text-sm font-medium">Answer</div>
                                <textarea
                                    value={addAnswer}
                                    onChange={(e) => setAddAnswer(e.target.value)}
                                    className="h-28 w-full rounded-md border px-3 py-2 text-sm"
                                    placeholder="Enter the answer..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="mb-1 text-sm font-medium">Category</div>
                                    <select
                                        value={addCategory}
                                        onChange={(e) => setAddCategory(e.target.value)}
                                        className="w-full rounded-md border px-3 py-2 text-sm"
                                    >
                                        <option value="">Choose category</option>
                                        {categories
                                            .filter((c, index, arr) => arr.indexOf(c) === index)
                                            .filter((c) => c && c.trim() !== '')
                                            .map((c) => (
                                                <option key={c} value={c}>
                                                    {c}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                                <div>
                                    <div className="mb-1 text-sm font-medium">Status</div>
                                    <select
                                        value={addStatus}
                                        onChange={(e) => setAddStatus(e.target.value as 'Active' | 'Inactive')}
                                        className="w-full rounded-md border px-3 py-2 text-sm"
                                    >
                                        <option value="Active">Published</option>
                                        <option value="Inactive">Draft</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button className="rounded-md border px-3 py-2 text-sm" onClick={() => setAdding(false)}>
                                    Cancel
                                </button>
                                <button
                                    className="rounded-md bg-gray-900 px-3 py-2 text-sm text-white disabled:opacity-50"
                                    onClick={async () => {
                                        if (!addQuestion.trim() || !addAnswer.trim()) return;
                                        const res = await fetch('/staff/faq', {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'X-Requested-With': 'XMLHttpRequest',
                                                'X-CSRF-TOKEN': csrf,
                                            },
                                            body: JSON.stringify({
                                                faq_question: addQuestion,
                                                faq_answer: addAnswer,
                                                category: addCategory,
                                                faq_status: addStatus,
                                            }),
                                        });
                                        const json = await res.json();
                                        if (json.success) {
                                            setList((prev) => [json.faq, ...prev]);
                                            setAdding(false);
                                            setAddQuestion('');
                                            setAddAnswer('');
                                            setAddCategory('');
                                            setAddStatus('Active');
                                        } else {
                                            alert('Failed to add FAQ. Please ensure all fields are valid.');
                                        }
                                    }}
                                >
                                    Add FAQ
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
