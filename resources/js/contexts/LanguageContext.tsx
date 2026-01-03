import React, { createContext, useContext, useEffect, useState } from 'react';
import { en } from '@/translations/en';
import { ms } from '@/translations/ms';
import { zh } from '@/translations/zh';

type Language = 'en' | 'ms' | 'zh';

interface Translations {
    [key: string]: string;
}

const translations: Record<Language, Translations> = {
    en,
    ms,
    zh,
};

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguageState] = useState<Language>('en');

    useEffect(() => {
        // Load language from localStorage on mount
        const saved = localStorage.getItem('app_language') as Language;
        if (saved && translations[saved]) {
            setLanguageState(saved);
        }
    }, []);

    useEffect(() => {
        // Listen for language change events
        const handleLanguageChange = (e: CustomEvent) => {
            const newLang = e.detail as Language;
            if (translations[newLang]) {
                setLanguageState(newLang);
            }
        };

        window.addEventListener('languageChanged', handleLanguageChange as EventListener);
        return () => {
            window.removeEventListener('languageChanged', handleLanguageChange as EventListener);
        };
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('app_language', lang);
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: lang }));
    };

    const t = (key: string, params?: Record<string, string | number>): string => {
        let translation = translations[language][key] || key;
        if (params) {
            Object.entries(params).forEach(([k, v]) => {
                translation = translation.replace(`{${k}}`, String(v));
            });
        }
        return translation;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
