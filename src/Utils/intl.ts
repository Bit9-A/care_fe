import i18n from "@/i18n";

/**
 * Locale-aware `toLocale*` helpers.
 *
 * The app language is chosen by the user, not by the browser, so formatting
 * must follow `i18n.language`. Passing "en-US" hard-codes English inside an
 * otherwise Spanish interface, and passing undefined silently falls back to
 * the browser locale, which is a different thing again.
 */
export const currentLocale = () => i18n.language || "es";

export const formatLocalDate = (
  date: string | number | Date,
  options?: Intl.DateTimeFormatOptions,
) => new Date(date).toLocaleDateString(currentLocale(), options);

export const formatLocalTime = (
  date: string | number | Date,
  options?: Intl.DateTimeFormatOptions,
) => new Date(date).toLocaleTimeString(currentLocale(), options);

export const formatLocalDateTime = (
  date: string | number | Date,
  options?: Intl.DateTimeFormatOptions,
) => new Date(date).toLocaleString(currentLocale(), options);
