import { QRCodeSVG } from "qrcode.react";
import { renderToStaticMarkup } from "react-dom/server";

import { FacilityRead } from "@/types/facility/facility";

/**
 * Token label printing, modelled on the SAG licence-plate labels.
 *
 * Two ideas make this work across arbitrary stock sizes:
 *
 * 1. A complete HTML document is generated and printed from a hidden iframe.
 *    Nothing from the application stylesheet can leak in, and `@page` only
 *    affects that document. Printing the live DOM instead forced us to hide
 *    the app and fight global `body * { ... }` print rules.
 *
 * 2. The design is drawn once at a base size and scaled uniformly to the
 *    physical stock with `transform: scale(min(w/baseW, h/baseH))`. A new
 *    paper size only adds an entry to the registry; nothing is redrawn.
 */

export interface TokenPrintData {
  tokenNumber: string;
  categoryName?: string;
  patientName?: string;
  resourceTypeLabel?: string;
  resourceLabel: string;
  dateLabel: string;
  qrValue: string;
  facility: FacilityRead;
}

export interface TokenLabelFormat {
  id: string;
  /** Translation key for the selector; `label` is the plain fallback. */
  labelKey: string;
  label: string;
  /** Stock width in mm; also the `@page` width. */
  widthMm: number;
  /** Stock height in mm; also the `@page` height. */
  heightMm: number;
  /** Which base design to scale: horizontal or vertical stack. */
  layout: "wide" | "roll";
}

export const TOKEN_LABEL_FORMATS: TokenLabelFormat[] = [
  {
    id: "a4",
    labelKey: "print_format_a4",
    label: "Normal (A4)",
    widthMm: 210,
    heightMm: 297,
    layout: "wide",
  },
  {
    id: "roll-58",
    labelKey: "print_format_roll_58",
    label: "Térmica 58 mm",
    widthMm: 58,
    heightMm: 90,
    layout: "roll",
  },
  {
    id: "roll-80",
    labelKey: "print_format_roll_80",
    label: "Térmica 80 mm",
    widthMm: 80,
    heightMm: 110,
    layout: "roll",
  },
  {
    id: "label-100x150",
    labelKey: "print_format_label_100x150",
    label: "Etiqueta 100 × 150 mm",
    widthMm: 100,
    heightMm: 150,
    layout: "roll",
  },
  {
    id: "label-150x100",
    labelKey: "print_format_label_150x100",
    label: "Etiqueta 150 × 100 mm (horizontal)",
    widthMm: 150,
    heightMm: 100,
    layout: "wide",
  },
];

/** Base designs, in millimetres. Everything below is drawn at this size. */
const BASE = {
  wide: { widthMm: 100, heightMm: 60 },
  roll: { widthMm: 50, heightMm: 90 },
} as const;

/** A4 sheets hold the label at its natural size instead of blowing it up. */
const SHEET_FORMAT_IDS = new Set(["a4"]);

const STORAGE_KEY = "care_token_print_format";

const scaleFor = (format: TokenLabelFormat): number => {
  if (SHEET_FORMAT_IDS.has(format.id)) {
    return 1;
  }
  const base = BASE[format.layout];
  return Math.min(
    format.widthMm / base.widthMm,
    format.heightMm / base.heightMm,
  );
};

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ] as string,
  );

const buildQrSvg = (value: string) =>
  renderToStaticMarkup(
    <QRCodeSVG value={value} size={256} level="M" marginSize={0} />,
  );

const facilityBlock = (facility: FacilityRead) => `
  <p class="facility">${escapeHtml(facility.name)}</p>
  ${facility.address ? `<p class="small">${escapeHtml(facility.address.replace(/,\s*/g, ", "))}</p>` : ""}
  ${facility.phone_number ? `<p class="small">${escapeHtml(facility.phone_number)}</p>` : ""}`;

const patientBlock = (data: TokenPrintData, label: string) =>
  data.patientName
    ? `<div class="patient">
         <p class="caption">${escapeHtml(label)}</p>
         <p class="name">${escapeHtml(data.patientName)}</p>
       </div>`
    : "";

const resourceLine = (data: TokenPrintData) => `
  <p class="small">${escapeHtml(
    data.resourceTypeLabel
      ? `${data.resourceTypeLabel}: ${data.resourceLabel}`
      : data.resourceLabel,
  )}</p>
  <p class="small">${escapeHtml(data.dateLabel)}</p>`;

/** Horizontal design: header on top, token number large, QR on the right. */
const wideDesign = (data: TokenPrintData, label: string) => `
  <div class="fit wide">
    <div class="col">
      <div>${facilityBlock(data.facility)}</div>
      <div data-token-box>
        ${data.categoryName ? `<p class="category">${escapeHtml(data.categoryName)}</p>` : ""}
        <p class="number" data-token-number data-max="64">${escapeHtml(data.tokenNumber)}</p>
      </div>
      <div>
        ${patientBlock(data, label)}
        ${resourceLine(data)}
      </div>
    </div>
    <div class="qr wide-qr">${buildQrSvg(data.qrValue)}</div>
  </div>`;

/** Vertical design for rolls and tall labels: everything stacked and centred. */
const rollDesign = (data: TokenPrintData, label: string) => `
  <div class="fit roll">
    ${facilityBlock(data.facility)}
    <div class="rule"></div>
    <div data-token-box>
      ${data.categoryName ? `<p class="category">${escapeHtml(data.categoryName)}</p>` : ""}
      <p class="number" data-token-number data-max="44">${escapeHtml(data.tokenNumber)}</p>
    </div>
    <div class="rule"></div>
    ${patientBlock(data, label)}
    ${resourceLine(data)}
    <div class="qr roll-qr">${buildQrSvg(data.qrValue)}</div>
  </div>`;

const STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  html, body { background: #ffffff; }
  body { font-family: Arial, "Helvetica Neue", Helvetica, sans-serif; color: #000; }
  .slot { display: flex; align-items: center; justify-content: center; overflow: hidden; }
  .fit { display: flex; color: #000; }
  .fit.wide { width: ${BASE.wide.widthMm}mm; height: ${BASE.wide.heightMm}mm; padding: 4mm; gap: 4mm; }
  .fit.roll { width: ${BASE.roll.widthMm}mm; height: ${BASE.roll.heightMm}mm; padding: 3mm; flex-direction: column; align-items: center; text-align: center; }
  .col { display: flex; flex: 1; min-width: 0; flex-direction: column; justify-content: space-between; }
  .facility { font-size: 12pt; font-weight: 700; line-height: 1.05; }
  .small { font-size: 8pt; line-height: 1.25; }
  .caption { font-size: 7pt; letter-spacing: 0.08em; text-transform: uppercase; }
  .name { font-size: 13pt; font-weight: 700; line-height: 1.1; word-break: break-word; }
  .category { font-size: 9pt; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; }
  /* A flex column centres children, so the box would otherwise grow with the
     text and the fit script would never see an overflow. */
  [data-token-box] { width: 100%; }
  .number { font-weight: 700; line-height: 0.9; letter-spacing: -0.01em; white-space: nowrap; }
  .patient { margin-bottom: 1mm; }
  .rule { width: 100%; border-top: 1px dashed #000; margin: 1.5mm 0; }
  .qr svg { display: block; }
  .wide-qr { width: 40mm; display: flex; align-items: center; }
  .wide-qr svg { width: 100%; height: auto; }
  .roll-qr { width: 34mm; margin-top: auto; }
  .roll-qr svg { width: 100%; height: auto; }
  .roll .facility { font-size: 9pt; }
  .roll .small { font-size: 6.5pt; text-align: center; }
  .roll .name { font-size: 9pt; }
  .roll .category { font-size: 7pt; }
`;

/**
 * Shrinks the token number until it fits its column so a four-letter
 * shorthand ("CONS-1234") cannot overflow. Runs inside the iframe, where the
 * document has a real layout viewport.
 */
const FIT_SCRIPT = `
  (function () {
    var box = document.querySelector("[data-token-box]");
    var number = document.querySelector("[data-token-number]");
    if (!box || !number) return;
    var size = Number(number.dataset.max) || 44;
    number.style.fontSize = size + "pt";
    while (size > 12 && number.scrollWidth > box.clientWidth) {
      size -= 2;
      number.style.fontSize = size + "pt";
    }
  })();
`;

export function renderTokenLabelHtml(
  data: TokenPrintData,
  format: TokenLabelFormat,
  patientLabel: string,
): string {
  const scale = scaleFor(format);
  const design =
    format.layout === "wide"
      ? wideDesign(data, patientLabel)
      : rollDesign(data, patientLabel);

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>Turno ${escapeHtml(data.tokenNumber)}</title>
<style>
  @page { size: ${format.widthMm}mm ${format.heightMm}mm; margin: 0; }
  ${STYLES}
  .slot { width: ${format.widthMm}mm; height: ${format.heightMm}mm; }
  .fit { transform: scale(${scale}); transform-origin: center center; }
</style>
</head>
<body>
  <div class="slot">${design}</div>
  <script>${FIT_SCRIPT}</script>
</body>
</html>`;
}

/** Prints the generated document from a hidden, stock-sized iframe. */
export function printTokenLabel(
  html: string,
  widthMm: number,
  heightMm: number,
) {
  let frame = document.getElementById(
    "token-print-frame",
  ) as HTMLIFrameElement | null;

  if (!frame) {
    frame = document.createElement("iframe");
    frame.id = "token-print-frame";
    frame.style.position = "fixed";
    frame.style.top = "-10000px";
    frame.style.left = "-10000px";
    frame.style.border = "none";
    document.body.appendChild(frame);
  }

  // The iframe needs a real layout box for the fit script to measure text,
  // but it never shows on screen.
  frame.style.width = `${widthMm}mm`;
  frame.style.height = `${heightMm}mm`;

  // `srcdoc` instead of document.write: the load event tells us the markup and
  // the fit script have run, which is what the print needs.
  frame.addEventListener(
    "load",
    () => {
      try {
        frame?.contentWindow?.focus();
        frame?.contentWindow?.print();
      } catch {
        window.print();
      }
    },
    { once: true },
  );
  frame.srcdoc = html;
}

export const getSavedTokenLabelFormat = (): TokenLabelFormat => {
  const saved = localStorage.getItem(STORAGE_KEY);
  return (
    TOKEN_LABEL_FORMATS.find((format) => format.id === saved) ??
    TOKEN_LABEL_FORMATS[0]
  );
};

export const saveTokenLabelFormat = (id: string) => {
  localStorage.setItem(STORAGE_KEY, id);
};
