export const NORMALIZATION_FORMS = ['NFC', 'NFKC', 'NFD', 'NFKD'] as const;

export type NormalizationForm = typeof NORMALIZATION_FORMS[number];
