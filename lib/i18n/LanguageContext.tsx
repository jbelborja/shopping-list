import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { es, Translations } from './translations/es';
import { en } from './translations/en';

export type SupportedLanguage = 'es' | 'en';

const LANGUAGE_STORAGE_KEY = 'shopping_list_language';

const translationsMap: Record<SupportedLanguage, Translations> = {
  es,
  en,
};

export interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  toggleLanguage: () => Promise<void>;
  t: (path: string, params?: Record<string, string | number>) => string;
  formatDate: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'es',
  setLanguage: async () => {},
  toggleLanguage: async () => {},
  t: (path: string) => path,
  formatDate: (date) => String(date),
});

let currentLanguage: SupportedLanguage = 'es';
export const getActiveLanguage = (): SupportedLanguage => currentLanguage;

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>('es');

  useEffect(() => {
    async function loadSavedLanguage() {
      try {
        const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (saved === 'es' || saved === 'en') {
          setLanguageState(saved);
          currentLanguage = saved;
        } else {
          // Default to Spanish
          setLanguageState('es');
          currentLanguage = 'es';
        }
      } catch (err) {
        console.warn('Failed to load language preference:', err);
      }
    }
    loadSavedLanguage();
  }, []);

  const setLanguage = async (newLang: SupportedLanguage) => {
    setLanguageState(newLang);
    currentLanguage = newLang;
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
    } catch (err) {
      console.warn('Failed to persist language preference:', err);
    }
  };

  const toggleLanguage = async () => {
    const nextLang: SupportedLanguage = language === 'es' ? 'en' : 'es';
    await setLanguage(nextLang);
  };

  const t = (path: string, params?: Record<string, string | number>): string => {
    const keys = path.split('.');
    const activeDict = translationsMap[language] || translationsMap.es;

    let value: any = activeDict;
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        // Fallback to Spanish if key missing
        let fallbackValue: any = translationsMap.es;
        for (const fbKey of keys) {
          if (fallbackValue && typeof fallbackValue === 'object' && fbKey in fallbackValue) {
            fallbackValue = fallbackValue[fbKey];
          } else {
            fallbackValue = path;
            break;
          }
        }
        value = fallbackValue;
        break;
      }
    }

    if (typeof value !== 'string') {
      return path;
    }

    if (params) {
      return Object.entries(params).reduce((acc, [paramKey, paramVal]) => {
        return acc.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
      }, value);
    }

    return value;
  };

  const formatDate = (date: Date | string | number, options?: Intl.DateTimeFormatOptions): string => {
    try {
      const d = date instanceof Date ? date : new Date(date);
      const locale = language === 'es' ? 'es-ES' : 'en-US';
      return d.toLocaleDateString(locale, options || { month: 'short', day: 'numeric' });
    } catch (err) {
      console.warn('Error formatting date:', err);
      return String(date);
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
        formatDate,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => useContext(LanguageContext);
