import type { NormalizationForm } from '$lib/normforms';
import { NORMALIZATION_FORMS } from '$lib/normforms';

export class UnicodeXRayUrl {
  text: string;
  normalizationForm: NormalizationForm | undefined;

  static TEXT_URL_PARAM_KEY = 't';
  static NORMALIZATION_FORM_URL_PARAM_KEY = 'n';

  constructor(text: string, normalizationForm: NormalizationForm | undefined) {
    this.text = text;
    this.normalizationForm = normalizationForm;
  }

  static fromURL(url: URL) {
    const text = url.searchParams.get(UnicodeXRayUrl.TEXT_URL_PARAM_KEY) || '';

    const normalizationFormParam = url.searchParams.get(
      UnicodeXRayUrl.NORMALIZATION_FORM_URL_PARAM_KEY
    );
    let normalizationForm;
    if (normalizationFormParam !== null && NORMALIZATION_FORMS.includes(normalizationFormParam as NormalizationForm)) {
      normalizationForm = normalizationFormParam as NormalizationForm;
    } else {
      normalizationForm = undefined;
    }

    return new UnicodeXRayUrl(text, normalizationForm);
  }

  toURL(base: URL) {
    const url = new URL(base)
    if (this.text.length > 0) {
      url.searchParams.set(UnicodeXRayUrl.TEXT_URL_PARAM_KEY, this.text);
    } else {
      url.searchParams.delete(UnicodeXRayUrl.TEXT_URL_PARAM_KEY);
    }
    if (this.normalizationForm !== undefined) {
      url.searchParams.set(UnicodeXRayUrl.NORMALIZATION_FORM_URL_PARAM_KEY, this.normalizationForm);
    } else {
      url.searchParams.delete(UnicodeXRayUrl.NORMALIZATION_FORM_URL_PARAM_KEY);
    }
    return url;
  }
}
