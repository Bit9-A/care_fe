export type TokenPrintFormat = "normal" | "thermal-58" | "thermal-80";

const STORAGE_KEY = "care_token_print_format";

interface TokenPrintFormatOption {
  value: TokenPrintFormat;
  labelKey: string;
  /** CSS `@page` size used while printing this format. */
  pageSize: string;
}

export const TOKEN_PRINT_FORMATS: TokenPrintFormatOption[] = [
  { value: "normal", labelKey: "print_token_normal", pageSize: "A4" },
  {
    value: "thermal-58",
    labelKey: "print_token_thermal_58",
    // Two lengths on purpose: `size: 58mm auto` is invalid CSS and Chrome
    // silently falls back to Letter, which is why nothing came out before.
    pageSize: "58mm 90mm",
  },
  {
    value: "thermal-80",
    labelKey: "print_token_thermal_80",
    pageSize: "80mm 110mm",
  },
];

export const getSavedTokenPrintFormat = (): TokenPrintFormat => {
  const saved = localStorage.getItem(STORAGE_KEY);
  return TOKEN_PRINT_FORMATS.some((format) => format.value === saved)
    ? (saved as TokenPrintFormat)
    : "normal";
};

/**
 * Prints a single token sheet.
 *
 * The sheet lives in a portal outside `#root`, so printing hides the whole app
 * instead of trying to isolate one card with `visibility`. The `@page` size has
 * to be injected as a stylesheet, because `@page` cannot be scoped by a selector
 * or by an attribute: the printer takes the paper width from it, which is what
 * makes a 58 mm or 80 mm roll come out at the right size.
 */
export const printTokenSheet = (tokenId: string, format: TokenPrintFormat) => {
  const sheet = document.getElementById(`token-print-${tokenId}`);
  if (!sheet) {
    return;
  }

  localStorage.setItem(STORAGE_KEY, format);

  const pageSize =
    TOKEN_PRINT_FORMATS.find((option) => option.value === format)?.pageSize ??
    "A4";

  sheet.dataset.format = format;
  sheet.classList.add("is-printing");
  document.body.classList.add("token-printing");

  const pageStyle = document.createElement("style");
  pageStyle.textContent = `@page { size: ${pageSize}; margin: 0; }`;
  document.head.appendChild(pageStyle);

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) {
      return;
    }
    cleaned = true;
    sheet.classList.remove("is-printing");
    document.body.classList.remove("token-printing");
    pageStyle.remove();
    window.removeEventListener("afterprint", cleanup);
    window.clearTimeout(fallbackTimer);
  };

  window.addEventListener("afterprint", cleanup);
  // If a browser never fires `afterprint`, the class and the injected `@page`
  // would leak into the next print. The cleanup is scoped to `@media print`,
  // so the screen is unaffected while the timer waits.
  const fallbackTimer = window.setTimeout(cleanup, 60_000);

  window.print();
};
