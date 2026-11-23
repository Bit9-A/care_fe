import { PrinterIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import {
  getSavedTokenPrintFormat,
  printTokenSheet,
  TOKEN_PRINT_FORMATS,
  TokenPrintFormat,
} from "@/Utils/printToken";

import TokenPrintSheet, { TokenPrintData } from "./TokenPrintSheet";

interface Props {
  data: TokenPrintData;
  buttonClassName?: string;
}

/**
 * Print button plus the sheet it prints.
 *
 * The choice of paper stays in localStorage, so a reception desk that always
 * uses a 58 mm roll only picks the format once.
 */
export default function TokenPrintAction({ data, buttonClassName }: Props) {
  const { t } = useTranslation();
  const [printFormat, setPrintFormat] = useState<TokenPrintFormat>(
    getSavedTokenPrintFormat,
  );
  const [printRequested, setPrintRequested] = useState(0);

  // The sheet has to render with the chosen layout before printing, so the
  // print runs from an effect instead of the click handler.
  useEffect(() => {
    if (!printRequested) {
      return;
    }
    printTokenSheet(data.sheetId, printFormat);
  }, [printRequested, printFormat, data.sheetId]);

  const requestPrint = (format: TokenPrintFormat) => {
    setPrintFormat(format);
    setPrintRequested((count) => count + 1);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={buttonClassName}
            aria-label={t("print_token")}
          >
            <PrinterIcon className="mr-2 size-4" />
            {t("print_token")}
            <ShortcutBadge actionId="print-button" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel className="font-normal text-gray-600">
            {t("print_token_format")}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {TOKEN_PRINT_FORMATS.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => requestPrint(option.value)}
              className={
                option.value === printFormat ? "font-semibold" : undefined
              }
            >
              {t(option.labelKey)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <TokenPrintSheet data={data} format={printFormat} />
    </>
  );
}
