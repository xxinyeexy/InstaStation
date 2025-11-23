import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Edit2, Plus, Search, Trash2, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

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

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'faqs',
        href: '/student/manage-faq',
    },
];

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
    const { t } = useLanguage();
    const [list, setList] = useState<FaqRow[]>(rows);
    const [q, setQ] = useState(filters?.q || '');
    const [category, setCategory] = useState(filters?.category || '');
    const searchRef = useRef<HTMLInputElement | null>(null);
    const [editing, setEditing] = useState<FaqRow | null>(null);
    const [validationError, setValidationError] = useState<string>('');
    
    const showValidationError = (message: string) => {
        setValidationError(message);
        setTimeout(() => setValidationError(''), 3000);
    };
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
    const [successMessage, setSuccessMessage] = useState<string>('');
    
    const showSuccessMessage = (message: string) => {
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    // Delete confirmation modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedDeleteId, setSelectedDeleteId] = useState<number | null>(null);
    const [selectedDeleteLabel, setSelectedDeleteLabel] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

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
        setList((prev) =>
            prev.map((r) =>
                r.faq_id === faq_id ? { ...r, faq_status: to === 'publish' ? 'Active' : 'Inactive', updated_at: new Date().toISOString() } : r,
            ),
        );
    };
    const remove = async (faq_id: number) => {
        await fetch(`/staff/faq/${faq_id}`, { method: 'DELETE', headers: { 'X-Requested-With': 'XMLHttpRequest', 'X-CSRF-TOKEN': csrf } });
        setList((prev) => prev.filter((r) => r.faq_id !== faq_id));
    };

    const handleDeleteClick = (faq_id: number, question: string) => {
        setSelectedDeleteId(faq_id);
        setSelectedDeleteLabel(question);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedDeleteId) return;
        setIsDeleting(true);
        try {
            await remove(selectedDeleteId);
            showSuccessMessage('FAQ deleted successfully!');
        } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
            setSelectedDeleteId(null);
            setSelectedDeleteLabel(null);
        }
    };

    const handleDeleteCancel = () => {
        setShowDeleteModal(false);
        setSelectedDeleteId(null);
        setSelectedDeleteLabel(null);
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
        <AppLayout breadcrumbs={breadcrumbs}>
            {validationError && (
                <div className="fixed top-4 left-1/2 z-[100] -translate-x-1/2 animate-fade-in">
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 shadow-lg">
                        <div className="flex items-center gap-3">
                            <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm font-medium text-red-800">{validationError}</span>
                        </div>
                    </div>
                </div>
            )}
            {successMessage && (
                <div className="fixed top-4 left-1/2 z-[100] -translate-x-1/2 animate-fade-in">
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 shadow-lg">
                        <div className="flex items-center gap-3">
                            <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm font-medium text-green-800">{successMessage}</span>
                        </div>
                    </div>
                </div>
            )}
            <div className="space-y-6 p-6">
                <div>
                    <h1 className="text-2xl font-bold">{t('faqs')}</h1>
                    <p className="text-sm text-gray-500">{t('manageFaqs')}</p>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl border border-border bg-white p-4">
                        <div className="text-sm text-gray-600">{t('totalFAQs')}</div>
                        <div className="text-2xl font-bold">{list.length}</div>
                        <div className="text-xs text-gray-500">{t('allQuestions')}</div>
                    </div>
                    <div className="rounded-xl border border-border bg-white p-4">
                        <div className="text-sm text-gray-600">{t('published')}</div>
                        <div className="text-2xl font-bold">{list.filter((r) => r.faq_status === 'Active').length}</div>
                        <div className="text-xs text-gray-500">{t('visibleToStudents')}</div>
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
                            placeholder={t('searchFAQs')}
                            className="w-full rounded-md border border-border bg-background px-7 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                            onKeyDown={(e) => e.key === 'Enter' && refreshFromServer()}
                        />
                    </div>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                    >
                        <option value="">{t('allCategories')}</option>
                        {categories
                            .filter((c, index, arr) => arr.indexOf(c) === index)
                            .filter((c) => c && c.trim() !== '')
                            .map((c) => (
                                <option key={c} value={c}>
                                    {t(c.toLowerCase() as any) || c}
                                </option>
                            ))}
                    </select>
                    <button
                        onClick={() => setAdding(true)}
                        className="inline-flex items-center gap-2 rounded-md bg-pink-500 px-3 py-2 text-sm text-white"
                    >
                        <Plus size={16} /> {t('addFAQ')}
                    </button>
                </div>

                {/* List */}
                <div className="space-y-4">
                    {filtered.map((f) => (
                        <div key={f.faq_id} className="rounded-xl border border-border bg-white">
                            <div className="flex items-start justify-between p-4">
                                <div className="pr-4">
                                    <div className="mb-2 flex items-center gap-2 text-xs">
                                        <span className={`rounded-full px-2 py-0.5 ${categoryClasses(f.category)}`}>{t((f.category || 'General').toLowerCase() as any)}</span>
                                        {f.faq_status === 'Inactive' && (
                                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">{t('draft')}</span>
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
                                            className="text-sm text-black hover:bg-pink-50 hover:text-pink-600 hover:shadow-lg focus-visible:outline-none active:bg-gray-200"
                                        >
                                            {t('unpublish')}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => publish(f.faq_id, 'publish')}
                                            className="rounded-full border bg-gray-100 px-3 py-1 text-xs text-gray-600 opacity-80 hover:opacity-100"
                                        >
                                            {t('publish')}
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
                                        className="rounded-2xl p-2 text-gray-400 transition-all duration-300 hover:scale-110 hover:bg-orange-50 hover:text-orange-500 hover:shadow-lg"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(f.faq_id, f.faq_question)}
                                        className="rounded-2xl p-2 text-gray-400 transition-all duration-300 hover:scale-110 hover:bg-red-50 hover:text-red-600 hover:shadow-lg"
                                    >
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
                                <div className="text-lg font-semibold">{t('editFAQ')}</div>

                                <div className="text-xs text-gray-500">{t('updateFAQInfo')}</div>
                            </div>
                            <button className="text-gray-500 hover:text-gray-700" onClick={() => setEditing(null)}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <div className="mb-1 text-sm font-medium">{t('question')}</div>
                                <input
                                    value={editQuestion}
                                    onChange={(e) => setEditQuestion(e.target.value)}
                                    className="w-full rounded-md border border-border px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <div className="mb-1 text-sm font-medium">{t('answer')}</div>
                                <textarea
                                    value={editAnswer}
                                    onChange={(e) => setEditAnswer(e.target.value)}
                                    className="h-28 w-full rounded-md border border-border px-3 py-2 text-sm"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="mb-1 text-sm font-medium">{t('category')}</div>
                                    <select
                                        value={editCategory}
                                        onChange={(e) => setEditCategory(e.target.value)}
                                        className="w-full rounded-md border border-border px-3 py-2 text-sm"
                                    >
                                        <option value="">{t('general')}</option>
                                        {categories
                                            .filter((c, index, arr) => arr.indexOf(c) === index)
                                            .filter((c) => c && c.trim() !== '')
                                            .map((c) => (
                                                <option key={c} value={c}>
                                                    {t(c.toLowerCase() as any) || c}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                                <div>
                                    <div className="mb-1 text-sm font-medium">{t('status')}</div>
                                    <select
                                        value={editStatus}
                                        onChange={(e) => setEditStatus(e.target.value as 'Active' | 'Inactive')}
                                        className="w-full rounded-md border border-border px-3 py-2 text-sm"
                                    >
                                        <option value="Inactive">{t('draft')}</option>
                                        <option value="Active">{t('published')}</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button className="rounded-md border border-border px-3 py-2 text-sm hover:bg-gray-100" onClick={() => setEditing(null)}>
                                    {t('cancel')}
                                </button>
                                <button
                                    className="rounded-md bg-pink-500 px-3 py-2 text-sm text-white hover:bg-pink-600"
                                    onClick={async () => {
                                        if (!editing) return;
                                        
                                        // Validation
                                        if (!editQuestion.trim()) {
                                            showValidationError('Please enter a question');
                                            return;
                                        }
                                        if (editQuestion.trim().length < 10) {
                                            showValidationError('Question must be at least 10 characters long');
                                            return;
                                        }
                                        if (!editAnswer.trim()) {
                                            showValidationError('Please enter an answer');
                                            return;
                                        }
                                        if (editAnswer.trim().length < 20) {
                                            showValidationError('Answer must be at least 20 characters long');
                                            return;
                                        }
                                        if (!editCategory) {
                                            showValidationError('Please select a category');
                                            return;
                                        }
                                        
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
                                        showSuccessMessage('FAQ updated successfully!');
                                    }}
                                >
                                    {t('updateFAQ')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/30" onClick={handleDeleteCancel} />
                    <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 text-center shadow-xl">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                            <Trash2 className="h-6 w-6 text-red-600" />
                        </div>
                        <h2 className="mb-2 text-lg font-semibold text-gray-900">{t('deleteFAQ')}</h2>
                        <p className="mb-1 text-left text-sm text-gray-600">
                            {t('areYouSureDeleteFAQ')}
                            {selectedDeleteLabel ? (
                                <>
                                    {' '}
                                    <span className="font-medium text-red-600">{selectedDeleteLabel}</span>
                                </>
                            ) : (
                                ` ${t('thisFAQ')}`
                            )}
                            ?
                        </p>
                         <div className="mb-6 rounded-md bg-red-50 p-3 dark:bg-red-500/10">
                                <p className="text-sm text-left text-red-800 dark:text-red-400">
                            {t('cannotBeUndoneFAQ')}
                                </p>
                            </div>
                      
                        <div className="flex justify-center gap-3">
                            <button
                                onClick={handleDeleteCancel}
                                disabled={isDeleting}
                                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {t('cancel')}
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                disabled={isDeleting}
                                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isDeleting ? t('deleting') : t('delete')}
                            </button>
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
                                <div className="text-lg font-semibold">{t('addNewFAQ')}</div>
                                <div className="text-xs text-gray-500">{t('createNewFAQ')}</div>
                            </div>
                            <button className="text-gray-500 hover:text-gray-700" onClick={() => setAdding(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <div className="mb-1 text-sm font-medium">{t('question')}</div>
                                <input
                                    value={addQuestion}
                                    onChange={(e) => setAddQuestion(e.target.value)}
                                    className="w-full rounded-md border border-border px-3 py-2 text-sm"
                                    placeholder={t('enterQuestion')}
                                />
                            </div>
                            <div>
                                <div className="mb-1 text-sm font-medium">{t('answer')}</div>
                                <textarea
                                    value={addAnswer}
                                    onChange={(e) => setAddAnswer(e.target.value)}
                                    className="h-28 w-full rounded-md border border-border px-3 py-2 text-sm"
                                    placeholder={t('enterAnswer')}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="mb-1 text-sm font-medium">{t('category')}</div>
                                    <select
                                        value={addCategory}
                                        onChange={(e) => setAddCategory(e.target.value)}
                                        className="w-full rounded-md border border-border px-3 py-2 text-sm"
                                    >
                                        <option value="">{t('chooseCategory')}</option>
                                        {categories
                                            .filter((c, index, arr) => arr.indexOf(c) === index)
                                            .filter((c) => c && c.trim() !== '')
                                            .map((c) => (
                                                <option key={c} value={c}>
                                                    {t(c.toLowerCase() as any) || c}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                                <div>
                                    <div className="mb-1 text-sm font-medium">{t('status')}</div>
                                    <select
                                        value={addStatus}
                                        onChange={(e) => setAddStatus(e.target.value as 'Active' | 'Inactive')}
                                        className="w-full rounded-md border border-border px-3 py-2 text-sm"
                                    >
                                        <option value="Active">{t('published')}</option>
                                        <option value="Inactive">{t('draft')}</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button className="rounded-md border border-border px-3 py-2 text-sm hover:bg-gray-100" onClick={() => setAdding(false)}>
                                    {t('cancel')}
                                </button>
                                <button
                                    className="rounded-md bg-pink-500 px-3 py-2 text-sm text-white hover:bg-pink-600 disabled:opacity-50"
                                    onClick={async () => {
                                        // Validation
                                        if (!addQuestion.trim()) {
                                            showValidationError('Please enter a question');
                                            return;
                                        }
                                        if (addQuestion.trim().length < 10) {
                                            showValidationError('Question must be at least 10 characters long');
                                            return;
                                        }
                                        if (!addAnswer.trim()) {
                                            showValidationError('Please enter an answer');
                                            return;
                                        }
                                        if (addAnswer.trim().length < 20) {
                                            showValidationError('Answer must be at least 20 characters long');
                                            return;
                                        }
                                        if (!addCategory) {
                                            showValidationError('Please select a category');
                                            return;
                                        }
                                        
                                        try {
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
                                            
                                            if (!res.ok) {
                                                const errorData = await res.json();
                                                console.error('Server error:', errorData);
                                                showValidationError('Failed to add FAQ. Please ensure all fields are valid.');
                                                return;
                                            }
                                            
                                            const json = await res.json();
                                            if (json.success) {
                                                const newFaq = {
                                                    faq_id: json.faq.faq_id,
                                                    faq_question: json.faq.faq_question,
                                                    faq_answer: json.faq.faq_answer,
                                                    category: json.faq.category,
                                                    faq_status: json.faq.faq_status,
                                                    created_at: json.faq.created_at,
                                                    updated_at: json.faq.updated_at,
                                                };
                                                setList((prev) => [newFaq, ...prev]);
                                                setAdding(false);
                                                setAddQuestion('');
                                                setAddAnswer('');
                                                setAddCategory('');
                                                setAddStatus('Active');
                                                showSuccessMessage('FAQ added successfully!');
                                            } else {
                                                showValidationError('Failed to add FAQ. Please try again.');
                                            }
                                        } catch (error) {
                                            console.error('Error adding FAQ:', error);
                                            showValidationError('An error occurred. Please try again.');
                                        }
                                    }}
                                >
                                    {t('addFAQ')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
