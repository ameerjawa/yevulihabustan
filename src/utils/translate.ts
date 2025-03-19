import { supabase } from '../lib/supabase';

const LANGUAGES = {
  en: 'en',
  ar: 'ar'
} as const;

// Simple transliteration map for Hebrew to English
const hebrewToEnglish: Record<string, string> = {
  'א': 'a',
  'ב': 'b',
  'ג': 'g',
  'ד': 'd',
  'ה': 'h',
  'ו': 'v',
  'ז': 'z',
  'ח': 'ch',
  'ט': 't',
  'י': 'y',
  'כ': 'k',
  'ל': 'l',
  'מ': 'm',
  'נ': 'n',
  'ס': 's',
  'ע': 'a',
  'פ': 'p',
  'צ': 'ts',
  'ק': 'k',
  'ר': 'r',
  'ש': 'sh',
  'ת': 't',
  'ם': 'm',
  'ן': 'n',
  'ף': 'f',
  'ץ': 'ts',
  'ך': 'ch'
};

// Simple transliteration map for Hebrew to Arabic
const hebrewToArabic: Record<string, string> = {
  'א': 'ا',
  'ב': 'ب',
  'ג': 'ج',
  'ד': 'د',
  'ה': 'ه',
  'ו': 'و',
  'ז': 'ز',
  'ח': 'ح',
  'ט': 'ط',
  'י': 'ي',
  'כ': 'ك',
  'ל': 'ل',
  'מ': 'م',
  'נ': 'ن',
  'ס': 'س',
  'ע': 'ع',
  'פ': 'ف',
  'צ': 'ص',
  'ק': 'ق',
  'ר': 'ر',
  'ש': 'ش',
  'ת': 'ت',
  'ם': 'م',
  'ן': 'ن',
  'ף': 'ف',
  'ץ': 'ص',
  'ך': 'ك'
};

function transliterate(text: string, map: Record<string, string>): string {
  return text
    .split('')
    .map(char => map[char] || char)
    .join('');
}

export async function translateText(text: string, targetLang: keyof typeof LANGUAGES): Promise<string> {
  try {
    // For English, use transliteration
    if (targetLang === 'en') {
      return transliterate(text, hebrewToEnglish);
    }
    
    // For Arabic, use transliteration
    if (targetLang === 'ar') {
      return transliterate(text, hebrewToArabic);
    }

    // Fallback: return original text
    return text;
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
}