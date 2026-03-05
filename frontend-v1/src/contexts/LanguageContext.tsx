import React, { createContext, useContext, useState, type ReactNode } from 'react';

type Language = 'en' | 'de';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const translations = {
    en: {
        // Landing
        'landing.new': 'New: AI Actions & Forecasting',
        'landing.hero.title1': 'Data intelligence for the',
        'landing.hero.title2': 'modern enterprise',
        'landing.hero.subtitle': 'Stop wrestling with spreadsheets. Nalyse provides instant visualization, predictive analytics, and enterprise-grade security in a single, intuitive platform.',
        'landing.cta.start': 'Start Analyzing Free',
        'landing.cta.explore': 'Explore Forecasting',
        'landing.feature.instant.title': 'Instant Analysis',
        'landing.feature.instant.desc': 'Drag, drop, and done. Our engine processes CSVs and excels in milliseconds.',
        'landing.feature.secure.title': 'Enterprise Secure',
        'landing.feature.secure.desc': 'Bank-grade encryption, role-based access control, and full audit logs built-in.',
        'landing.feature.ai.title': 'Predictive AI',
        'landing.feature.ai.desc': 'Forecast future trends with one click using our advanced machine learning models.',

        // Navigation
        'nav.home': 'Home',
        'nav.workspace': 'Analysis',
        'nav.bi': 'BI Dashboards',
        'nav.correlation': 'Correlation',
        'nav.settings': 'Settings',

        // Header
        'header.welcome': 'Welcome back',
        'header.goodMorning': 'Good morning',
        'header.goodAfternoon': 'Good afternoon',
        'header.goodEvening': 'Good evening',
        'header.profile': 'Profile',
        'header.logout': 'Logout',
        'header.signedInAs': 'Signed in as',
        'header.settings': 'Setting',

        // Dashboard
        'dashboard.upload.title': 'Upload Data',
        'dashboard.upload.subtitle': 'Drag and drop your CSV or Excel files here',
        'dashboard.recent': 'Recent Files',
        'dashboard.actions': 'Actions',
        'dashboard.empty': 'No files uploaded yet.',
        'dashboard.delete': 'Delete',
        'dashboard.analyze': 'Analyze',

        // BI
        'bi.select.title': 'Choose Analysis Type',
        'bi.select.subtitle': 'Select a template to visualize your data',
    },
    de: {
        // Landing
        'landing.new': 'Neu: KI-Aktionen & Prognosen',
        'landing.hero.title1': 'Datenintelligenz für das',
        'landing.hero.title2': 'moderne Unternehmen',
        'landing.hero.subtitle': 'Hören Sie auf, mit Tabellenkalkulationen zu kämpfen. Nalyse bietet sofortige Visualisierung, prädiktive Analysen und Sicherheit auf Unternehmensniveau in einer einzigen, intuitiven Plattform.',
        'landing.cta.start': 'Kostenlos starten',
        'landing.cta.explore': 'Prognosen entdecken',
        'landing.feature.instant.title': 'Sofortige Analyse',
        'landing.feature.instant.desc': 'Drag & Drop, fertig. Unsere Engine verarbeitet CSVs und Excel in Millisekunden.',
        'landing.feature.secure.title': 'Unternehmenssicher',
        'landing.feature.secure.desc': 'Verschlüsselung auf Bankenniveau, rollenbasierte Zugriffskontrolle und vollständige Audit-Logs integriert.',
        'landing.feature.ai.title': 'Prädiktive KI',
        'landing.feature.ai.desc': 'Prognostizieren Sie zukünftige Trends mit einem Klick unter Verwendung unserer fortschrittlichen Machine-Learning-Modelle.',

        // Navigation
        'nav.home': 'Startseite',
        'nav.workspace': 'Analyse',
        'nav.bi': 'BI Dashboards',
        'nav.correlation': 'Korrelation',
        'nav.settings': 'Einstellungen',

        // Header
        'header.welcome': 'Willkommen zurück',
        'header.goodMorning': 'Guten Morgen',
        'header.goodAfternoon': 'Guten Tag',
        'header.goodEvening': 'Guten Abend',
        'header.profile': 'Profil',
        'header.logout': 'Abmelden',
        'header.signedInAs': 'Angemeldet als',
        'header.settings': 'Einstellung',

        // Dashboard
        'dashboard.upload.title': 'Daten hochladen',
        'dashboard.upload.subtitle': 'Ziehen Sie Ihre CSV- oder Excel-Dateien hierher',
        'dashboard.recent': 'Kürzliche Dateien',
        'dashboard.actions': 'Aktionen',
        'dashboard.empty': 'Noch keine Dateien hochgeladen.',
        'dashboard.delete': 'Löschen',
        'dashboard.analyze': 'Analysieren',

        // BI
        'bi.select.title': 'Analysetyp wählen',
        'bi.select.subtitle': 'Wählen Sie eine Vorlage zur Visualisierung Ihrer Daten',
    }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>(() => {
        return (localStorage.getItem('language') as Language) || 'en';
    });

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('language', lang);
    };

    const t = (key: string): string => {
        // @ts-ignore
        return translations[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
