import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

type Language = 'es' | 'en'

type LanguageContextType = {
    language: Language
    setLanguage: (lang: Language) => void
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguage] = useState<Language>('es')

    useEffect(() => {
        // Detectar idioma desde la URL
        const path = window.location.pathname
        if (path.startsWith('/en')) {
            setLanguage('en')
        } else {
            setLanguage('es')
        }
    }, [])

    return (
        <LanguageContext.Provider value={{ language, setLanguage }}>
            {children}
        </LanguageContext.Provider>
    )
}

export function useLanguage() {
    const context = useContext(LanguageContext)
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider')
    }
    return context
}
