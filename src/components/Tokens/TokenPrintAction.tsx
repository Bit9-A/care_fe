import { PrinterIcon } from "lucide-react";
import { useState } from "react";
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
  getSavedTokenLabelFormat,
  printTokenLabel,
  renderTokenLabelHtml,
  saveTokenLabelFormat,
  TOKEN_LABEL_FORMATS,
  TokenLabelFormat,
  TokenPrintData,
} from "@/Utils/tokenLabel";

interface Props {
  data: TokenPrintData;
  buttonClassName?: string;
}

/**
 * Print button for a token.
 *
 * Every option in the menu is a paper size, not a different layout: the label
 * is drawn once and scaled to the stock, so adding a size is one registry
 * entry. The choice is remembered per workstation, which is what a reception
 * desk wants - it always uses the same roll.
 */
export default function TokenPrintAction({ data, buttonClassName }: Props) {
  const { t } = useTranslation();
  const [format, setFormat] = useState<TokenLabelFormat>(
    getSavedTokenLabelFormat,
  );

  const handlePrint = (next: TokenLabelFormat) => {
    setFormat(next);
    saveTokenLabelFormat(next.id);
    const html = renderTokenLabelHtml(data, next, t("patient_name"));
    printTokenLabel(html, next.widthMm, next.heightMm);
  };

  return (
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
        {TOKEN_LABEL_FORMATS.map((option) => (
          <DropdownMenuItem
            key={option.id}
            onClick={() => handlePrint(option)}
            className={option.id === format.id ? "font-semibold" : undefined}
          >
            {t(option.labelKey, option.label)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
