import { QRCodeSVG } from "qrcode.react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

import type { TokenPrintFormat } from "@/Utils/printToken";
import { FacilityRead } from "@/types/facility/facility";

/**
 * Everything a printed token needs, independent of which screen produced it:
 * the queue board card and the appointment card expose different models, so
 * each one builds this shape instead of teaching the sheet about both.
 */
export interface TokenPrintData {
  /** Unique per sheet; also the DOM id suffix. */
  sheetId: string;
  tokenNumber: string;
  categoryName?: string;
  patientName?: string;
  /** Human label for the resource kind ("Profesional", "Servicio", ...). */
  resourceTypeLabel?: string;
  resourceLabel: string;
  dateLabel: string;
  qrValue: string;
  facility: FacilityRead;
}

interface Props {
  data: TokenPrintData;
  format: TokenPrintFormat;
}

/**
 * A4/Letter sheet: the token information on its own page, without the
 * interactive chrome of the on-screen card.
 */
const NormalLayout = ({ data }: { data: TokenPrintData }) => {
  const { t } = useTranslation();

  return (
    <div className="mx-auto w-full max-w-[190mm] p-[10mm] text-black">
      <div className="flex items-start justify-between gap-6 border-b border-black pb-3">
        <div>
          <p className="text-[16pt] font-bold leading-tight">
            {data.facility.name}
          </p>
          {data.facility.address && (
            <p className="text-[9pt] leading-tight">
              {data.facility.address.replace(/,\s*/g, ", ")}
            </p>
          )}
          {data.facility.phone_number && (
            <p className="text-[9pt] leading-tight">
              {t("phone")}: {data.facility.phone_number}
            </p>
          )}
        </div>
        <div className="text-right">
          {data.categoryName && (
            <p className="text-[9pt] uppercase tracking-wide">
              {data.categoryName}
            </p>
          )}
          <p className="text-[40pt] font-bold leading-none tracking-tight">
            {data.tokenNumber}
          </p>
          <p className="text-[9pt]">{data.dateLabel}</p>
        </div>
      </div>

      <div className="mt-6 flex items-start justify-between gap-8">
        <div className="space-y-1">
          {data.patientName && (
            <div>
              <p className="text-[9pt] uppercase tracking-wide text-gray-600">
                {t("patient_name")}
              </p>
              <p className="text-[13pt] font-semibold leading-tight">
                {data.patientName}
              </p>
            </div>
          )}
          <div>
            <p className="text-[9pt] uppercase tracking-wide text-gray-600">
              {data.resourceTypeLabel ?? t("resource")}
            </p>
            <p className="text-[11pt] leading-tight">{data.resourceLabel}</p>
          </div>
        </div>
        <QRCodeSVG
          size={160}
          value={data.qrValue}
          style={{ width: "40mm", height: "40mm" }}
        />
      </div>
    </div>
  );
};

/**
 * Thermal roll sheet. Everything is sized in millimetres so the printer driver
 * does not have to scale a screen layout down, and the token number is large
 * enough to be read from a metre away at the counter.
 */
const ThermalLayout = ({
  data,
  variant,
}: {
  data: TokenPrintData;
  variant: "thermal-58" | "thermal-80";
}) => {
  const { t } = useTranslation();
  const isNarrow = variant === "thermal-58";
  const width = isNarrow ? 58 : 80;
  const qrSize = isNarrow ? "28mm" : "36mm";
  const separator = (
    <div className="my-[2mm] border-t border-dashed border-black" />
  );

  return (
    <div
      className="text-center text-black"
      style={{ width: `${width}mm`, padding: "3mm 2mm" }}
    >
      <p className="text-[8pt] font-bold leading-tight">{data.facility.name}</p>
      {data.facility.address && (
        <p className="text-[6pt] leading-tight">
          {data.facility.address.replace(/,\s*/g, ", ")}
        </p>
      )}
      {data.facility.phone_number && (
        <p className="text-[6pt] leading-tight">{data.facility.phone_number}</p>
      )}

      {separator}

      {data.categoryName && (
        <p className="text-[7pt] uppercase tracking-wider">
          {data.categoryName}
        </p>
      )}
      <p
        className="font-bold leading-none tracking-tight"
        style={{ fontSize: isNarrow ? "22pt" : "28pt" }}
      >
        {data.tokenNumber}
      </p>

      {separator}

      {data.patientName && (
        <>
          <p className="text-[6pt] uppercase tracking-wider">
            {t("patient_name")}
          </p>
          <p className="text-[9pt] font-semibold leading-tight break-words">
            {data.patientName}
          </p>
        </>
      )}
      <p className="text-[7pt] leading-tight">{data.resourceLabel}</p>
      <p className="text-[7pt] leading-tight">{data.dateLabel}</p>

      <div className="mt-[2mm] flex justify-center">
        <QRCodeSVG
          size={160}
          value={data.qrValue}
          style={{ width: qrSize, height: qrSize }}
        />
      </div>
    </div>
  );
};

export default function TokenPrintSheet({ data, format }: Props) {
  return createPortal(
    <div
      id={`token-print-${data.sheetId}`}
      data-format={format}
      className="token-print-sheet"
    >
      {format === "normal" ? (
        <NormalLayout data={data} />
      ) : (
        <ThermalLayout data={data} variant={format} />
      )}
    </div>,
    document.body,
  );
}
