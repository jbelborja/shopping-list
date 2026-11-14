import React from 'react';
import { Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@/lib/i18n';

interface LanguageToggleProps {
  className?: string;
}

export function LanguageToggle({ className = '' }: LanguageToggleProps) {
  const { language, toggleLanguage } = useTranslation();

  return (
    <Pressable
      onPress={toggleLanguage}
      className={`flex-row items-center px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:bg-slate-800 active:bg-slate-700 transition-colors ${className}`}
      accessibilityLabel={`Switch language, currently ${language === 'es' ? 'Spanish' : 'English'}`}
    >
      <Ionicons name="globe-outline" size={15} color="#818CF8" />
      <Text className="text-xs font-bold text-slate-200 ml-1.5 tracking-wider">
        {language.toUpperCase()}
      </Text>
    </Pressable>
  );
}
