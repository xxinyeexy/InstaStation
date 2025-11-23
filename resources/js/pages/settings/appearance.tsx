import { Head } from '@inertiajs/react';
import { Globe } from 'lucide-react';

import AppearanceTabs from '@/components/appearance-tabs';
import HeadingSmall from '@/components/heading-small';
import { type BreadcrumbItem } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Appearance settings',
        href: '/settings/appearance',
    },
];

const languages = [
    { code: 'en' as const, name: 'English', flag: '🇬🇧' },
    { code: 'ms' as const, name: 'Bahasa Melayu', flag: '🇲🇾' },
    { code: 'zh' as const, name: '中文', flag: '🇨🇳' },
];

export default function Appearance() {
    const { language, setLanguage, t } = useLanguage();

    const handleLanguageChange = (code: 'en' | 'ms' | 'zh') => {
        setLanguage(code);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('appearanceSettings')} />

            <SettingsLayout>
                <div className="space-y-8">
                    {/* Theme Settings */}
                    <div className="space-y-4">
                        <HeadingSmall title={t('theme')} description={t('themeDescription')} />
                        <AppearanceTabs />
                    </div>

                    {/* Language Settings */}
                    <div className="space-y-4">
                        <HeadingSmall title={t('language')} description={t('languageDescription')} />
                        
                        <div className="rounded-lg border bg-card p-6">
                            <div className="mb-4 flex items-center gap-2">
                                <Globe className="h-5 w-5 text-muted-foreground" />
                                <h3 className="text-base font-semibold">{t('languageSelection')}</h3>
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                {languages.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => handleLanguageChange(lang.code)}
                                        className={`flex items-center gap-3 rounded-lg border-2 p-4 transition-all duration-200 ${
                                            language === lang.code
                                                ? 'border-primary bg-primary/5 shadow-sm ring-2 ring-primary/20'
                                                : 'border-border hover:border-primary/50 hover:bg-muted/50'
                                        }`}
                                    >
                                        <span className="text-3xl">{lang.flag}</span>
                                        <div className="flex-1 text-left">
                                            <div className="font-medium">{lang.name}</div>
                                            <div className="text-xs text-muted-foreground">{lang.code.toUpperCase()}</div>
                                        </div>
                                        {language === lang.code && (
                                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                                                <svg
                                                    className="h-3 w-3 text-primary-foreground"
                                                    fill="none"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path d="M5 13l4 4L19 7"></path>
                                                </svg>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
