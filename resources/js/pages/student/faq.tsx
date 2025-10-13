import AppLayout from '@/layouts/app-layout';
import { ChevronRight, Clock, HelpCircle, Mail, MapPin, Phone, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

type FaqItem = {
    faq_id: number;
    faq_question: string;
    faq_answer: string;
    category?: string | null;
    created_at?: string;
    updated_at?: string;
};

export default function StudentFaq({
    faqs,
    categories,
    filters,
}: {
    faqs: FaqItem[];
    categories: string[];
    filters?: { q?: string; category?: string };
}) {
    const [searchQuery, setSearchQuery] = useState(filters?.q || '');
    const [selectedCategory, setSelectedCategory] = useState(filters?.category || '');
    const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

    const filteredFaqs = useMemo(() => {
        const needle = searchQuery.trim().toLowerCase();
        return faqs.filter((faq) => {
            const matchSearch = !needle || faq.faq_question.toLowerCase().includes(needle) || faq.faq_answer.toLowerCase().includes(needle);
            const matchCategory = !selectedCategory || faq.category === selectedCategory;
            return matchSearch && matchCategory;
        });
    }, [faqs, searchQuery, selectedCategory]);

    const categoryClasses = (cat?: string | null) => {
        const key = (cat || 'General').toLowerCase();
        if (key.includes('general')) return 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400';
        if (key.includes('collect')) return 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400';
        if (key.includes('pay')) return 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400';
        if (key.includes('ship')) return 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400';
        if (key.includes('tech')) return 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400';
        return 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400';
    };

    const handleSearch = () => {
        const params = new URLSearchParams();
        if (searchQuery) params.set('q', searchQuery);
        if (selectedCategory) params.set('category', selectedCategory);
        window.location.href = `/student/faq?${params.toString()}`;
    };

    return (
        <AppLayout>
            <div className="min-h-screen bg-white dark:bg-background">
                <div className="mx-auto max-w-4xl px-4 py-8">
                    {/* Header */}
                    <div className="mb-8 text-center">
                        <h1 className="mb-2 text-4xl font-bold text-gray-900 dark:text-foreground">Frequently Asked Questions</h1>
                        <p className="text-lg text-gray-600 dark:text-muted-foreground">Find answers to common questions about parcel collection</p>
                    </div>

                    {/* Search Bar */}
                    <div className="mb-6">
                        <div className="relative mx-auto max-w-2xl">
                            <Search
                                className="absolute top-1/2 left-3 -translate-y-1/2 transform text-gray-400 dark:text-muted-foreground"
                                size={20}
                            />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                placeholder="Search FAQs..."
                                className="w-full rounded-lg border border-gray-300 bg-white py-3 pr-4 pl-10 text-gray-900 placeholder-gray-500 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-border dark:bg-background dark:text-foreground dark:placeholder-muted-foreground"
                            />
                        </div>
                    </div>

                    {/* Category Filters */}
                    <div className="mb-8">
                        <div className="flex flex-wrap justify-center gap-2">
                            <button
                                onClick={() => setSelectedCategory('')}
                                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                                    selectedCategory === ''
                                        ? 'bg-gray-100 text-gray-700 dark:bg-muted dark:text-muted-foreground'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-muted dark:text-muted-foreground dark:hover:bg-accent'
                                }`}
                            >
                                All Categories
                            </button>

                            {categories.map((category) => {
                                const c = (category || '').toLowerCase();
                                let selectedClasses = 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400';
                                if (c.includes('collect')) selectedClasses = 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400';
                                if (c.includes('pay'))
                                    selectedClasses = 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400';
                                return (
                                    <button
                                        key={category}
                                        onClick={() => setSelectedCategory(category)}
                                        className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                                            selectedCategory === category
                                                ? selectedClasses
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-muted dark:text-muted-foreground dark:hover:bg-accent'
                                        }`}
                                    >
                                        {category}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* FAQ List */}
                    <div className="mb-12 space-y-4">
                        {filteredFaqs.length > 0 ? (
                            filteredFaqs.map((faq) => (
                                <div
                                    key={faq.faq_id}
                                    className="cursor-pointer rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-border dark:bg-card"
                                    onClick={() => setExpandedFaq(expandedFaq === faq.faq_id ? null : faq.faq_id)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="mb-3 flex items-center gap-3">
                                                <span className={`rounded-full px-3 py-1 text-xs font-medium ${categoryClasses(faq.category)}`}>
                                                    {faq.category || 'General'}
                                                </span>
                                            </div>
                                            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-card-foreground">{faq.faq_question}</h3>
                                            {expandedFaq === faq.faq_id && (
                                                <div className="mt-4 leading-relaxed text-gray-700 dark:text-muted-foreground">{faq.faq_answer}</div>
                                            )}
                                        </div>
                                        <ChevronRight
                                            className={`text-gray-400 transition-transform dark:text-muted-foreground ${expandedFaq === faq.faq_id ? 'rotate-90' : ''}`}
                                            size={20}
                                        />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-16 text-center">
                                <HelpCircle className="mx-auto mb-4 text-gray-400 dark:text-muted-foreground" size={64} />
                                <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-foreground">No FAQs found</h3>
                                <p className="text-gray-500 dark:text-muted-foreground">
                                    {searchQuery || selectedCategory
                                        ? 'No FAQs found matching your search criteria.'
                                        : 'No FAQs are available at the moment.'}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Support Section */}
                    <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm dark:border-border dark:bg-card">
                        <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-card-foreground">Still need help?</h2>
                        <p className="mb-8 text-gray-600 dark:text-muted-foreground">
                            If you couldn't find the answer you're looking for, contact our support team.
                        </p>

                        <div className="grid gap-8 md:grid-cols-2">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Mail className="text-blue-600 dark:text-blue-400" size={20} />
                                    <div>
                                        <div className="font-semibold text-gray-900 dark:text-card-foreground">Email Support</div>
                                        <div className="text-gray-600 dark:text-muted-foreground">parcel-support@university.edu</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Clock className="text-blue-600 dark:text-blue-400" size={20} />
                                    <div>
                                        <div className="font-semibold text-gray-900 dark:text-card-foreground">Office Hours</div>
                                        <div className="text-gray-600 dark:text-muted-foreground">Monday - Friday: 9:00 AM - 5:00 PM</div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Phone className="text-blue-600 dark:text-blue-400" size={20} />
                                    <div>
                                        <div className="font-semibold text-gray-900 dark:text-card-foreground">Phone Support</div>
                                        <div className="text-gray-600 dark:text-muted-foreground">+1 (555) 123-4567</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <MapPin className="text-blue-600 dark:text-blue-400" size={20} />
                                    <div>
                                        <div className="font-semibold text-gray-900 dark:text-card-foreground">Location</div>
                                        <div className="text-gray-600 dark:text-muted-foreground">Student Services Building, Room 101</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
