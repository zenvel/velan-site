export const locales = ['en', 'zh', 'es'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'zh';
export const defaultTimeZone = 'Asia/Shanghai'; 