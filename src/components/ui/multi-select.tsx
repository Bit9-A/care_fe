import { ChevronDown, ChevronUp } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon, { IconName } from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import useBreakpoints from "@/hooks/useBreakpoints";
import { isIOSDevice } from "@/Utils/utils";

type ButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  keyof MultiSelectProps
>;
interface MultiSelectProps {
  options: {
    label: string;
    value: string;
    icon?: IconName;
  }[];
  onValueChange: (value: string[]) => void;
  value: string[];
  placeholder: string;
  className?: string;
  selectionSummary?: string;
  translationBasekey?: string;
  onCreate?: (label: string) => Promise<{ label: string; value: string }>;
}

function ListContent({
  translationBasekey,
  options,
  value,
  selectedValues,
  setSelectedValues,
  onValueChange,
  setOpen,
  onCreate,
}: {
  translationBasekey?: string;
  options: {
    label: string;
    value: string;
    icon?: IconName;
  }[];
  value: string[];
  selectedValues: string[];
  setSelectedValues: React.Dispatch<React.SetStateAction<string[]>>;
  onValueChange: (value: string[]) => void;
  setOpen: (open: boolean) => void;
  onCreate?: (label: string) => Promise<{ label: string; value: string }>;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = React.useState("");
  const [isCreating, setIsCreating] = React.useState(false);
  // `isCreating` is rendered state and cannot stop two clicks in the same tick
  // or honour the guard while the popover is closing; the ref is synchronous.
  const creatingRef = React.useRef(false);

  const handleToggleOption = (option: string) => {
    setSelectedValues((prevSelectedValues) =>
      prevSelectedValues.includes(option)
        ? prevSelectedValues.filter((v) => v !== option)
        : [...prevSelectedValues, option],
    );
  };
  const handleSelectAll = () => {
    setSelectedValues((prevSelectedValues) => {
      if (prevSelectedValues.length === options.length) return [];
      return options.map((o) => o.value);
    });
  };

  const trimmedQuery = query.trim();
  const hasExactMatch = options.some(
    (option) =>
      option.label.trim().toLowerCase() === trimmedQuery.toLowerCase(),
  );
  const showCreateOption =
    !!onCreate && trimmedQuery.length > 0 && !hasExactMatch;

  const handleCreateOption = async () => {
    if (!onCreate || creatingRef.current || !trimmedQuery) return;
    creatingRef.current = true;
    setIsCreating(true);
    try {
      await onCreate(trimmedQuery);
      setQuery("");
    } catch {
      // Keep the typed query so the user can retry; nothing is added.
    } finally {
      creatingRef.current = false;
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Command className="flex-1 overflow-hidden min-h-0">
        <div className="border border-gray-200 rounded-md m-1 mb-2">
          <CommandInput
            placeholder={
              translationBasekey
                ? t(`search_${translationBasekey}`)
                : t("search_options")
            }
            className="outline-hidden text-base sm:text-sm border-none ring-0 shadow-none -ml-3"
            autoFocus={!isIOSDevice}
            value={query}
            onValueChange={setQuery}
          />
        </div>
        {/* Rendered outside CommandList so cmdk's filter can never hide it
            (the raw query may not match its trimmed value) and so Enter in the
            input keeps selecting an existing option instead of creating. */}
        {showCreateOption && (
          <button
            type="button"
            disabled={isCreating}
            onClick={handleCreateOption}
            className="mx-1 mb-2 flex h-10 w-[calc(100%-0.5rem)] cursor-pointer items-center gap-3 rounded-sm px-2 text-left text-sm hover:bg-gray-100 disabled:pointer-events-none disabled:opacity-50"
          >
            <CareIcon
              icon={isCreating ? "l-spinner" : "l-plus"}
              className={cn("size-4 shrink-0", isCreating && "animate-spin")}
            />
            <span>{t("create_option", { label: trimmedQuery })}</span>
          </button>
        )}
        <CommandList className="max-h-full overflow-y-auto">
          <CommandEmpty>{t("no_results_found")}</CommandEmpty>
          <CommandGroup>
            <CommandItem
              key="all"
              onSelect={handleSelectAll}
              className="cursor-pointer h-10"
            >
              <Checkbox
                checked={selectedValues.length === options.length}
                aria-label={t("select_all_options")}
                className="data-[state=checked]:text-white"
              />
              <span className="font-medium">{t("select_all")}</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator className="mx-auto w-[95%]" />

          {value.length > 0 && (
            <>
              <CommandGroup heading={t("selected")}>
                {options
                  .filter((option) => value.includes(option.value))
                  .map((option) => (
                    <CommandItem
                      key={option.value}
                      onSelect={() => handleToggleOption(option.value)}
                      aria-label={`Select ${option.label}`}
                      className="cursor-pointer h-10 flex gap-3"
                    >
                      <Checkbox
                        checked={selectedValues.includes(option.value)}
                        className="data-[state=checked]:text-white"
                      />

                      <div className="flex items-center gap-1">
                        {option?.icon && (
                          <CareIcon icon={option.icon} className="size-4" />
                        )}
                        <span>{option.label}</span>
                      </div>
                    </CommandItem>
                  ))}
              </CommandGroup>

              <CommandSeparator className="mx-auto w-[95%]" />
            </>
          )}

          {value.length < options.length && (
            <CommandGroup>
              {options
                .filter((option) => !value.includes(option.value))
                .map((option) => (
                  <CommandItem
                    key={option.value}
                    onSelect={() => handleToggleOption(option.value)}
                    aria-label={`Select ${option.label}`}
                    className="cursor-pointer h-10 flex gap-3"
                  >
                    <Checkbox
                      checked={selectedValues.includes(option.value)}
                      className="data-[state=checked]:text-white"
                    />

                    <div className="flex items-center gap-1">
                      {option?.icon && (
                        <CareIcon icon={option.icon} className="size-4" />
                      )}
                      <span>{option.label}</span>
                    </div>
                  </CommandItem>
                ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
      <div className="flex justify-end space-x-2 p-3 border-t border-t-gray-200 shrink-0">
        <Button
          variant="link"
          size="md"
          className="underline"
          onClick={() => setOpen(false)}
        >
          {t("cancel")}
        </Button>
        <Button
          variant="primary_gradient"
          size="md"
          onClick={() => {
            onValueChange(selectedValues);
            setOpen(false);
          }}
        >
          {t("done")}
        </Button>
      </div>
    </div>
  );
}

export function MultiSelect({
  options,
  onValueChange,
  value = [],
  placeholder,
  className,
  ref,
  selectionSummary,
  translationBasekey,
  onCreate,
  ...props
}: ButtonProps & MultiSelectProps) {
  const [selectedValues, setSelectedValues] = React.useState<string[]>(value);
  const [open, setOpen] = React.useState(false);
  const [createdOptions, setCreatedOptions] = React.useState<
    { label: string; value: string }[]
  >([]);
  const isMobile = useBreakpoints({ default: true, sm: false });

  // Mirror of the current selection so a create that resolves after the
  // popover closed (or after a later toggle) merges into the live array
  // instead of a stale render snapshot. Synced in an effect, never in render.
  const selectedValuesRef = React.useRef(selectedValues);
  React.useEffect(() => {
    selectedValuesRef.current = selectedValues;
  }, [selectedValues]);

  React.useEffect(() => {
    setSelectedValues(value);
  }, [value, open]);
  React.useEffect(() => {
    if (open == false) onValueChange(selectedValues);
  }, [open]);

  const { t } = useTranslation();

  // Options created on the fly are not part of `options` until the catalog
  // refetches, so merge them in to render the new selection immediately.
  const mergedOptions = React.useMemo(() => {
    const seen = new Set(options.map((option) => option.value));
    return [
      ...options,
      ...createdOptions.filter((option) => !seen.has(option.value)),
    ];
  }, [options, createdOptions]);

  const handleCreate = onCreate
    ? async (label: string) => {
        const created = await onCreate(label);
        setCreatedOptions((prev) =>
          prev.some((option) => option.value === created.value)
            ? prev
            : [...prev, created],
        );
        // Commit immediately: the close-time effect would otherwise commit the
        // pre-create array if the popover closed while the POST was in flight.
        const current = selectedValuesRef.current;
        const nextSelected = current.includes(created.value)
          ? current
          : [...current, created.value];
        setSelectedValues(nextSelected);
        onValueChange(nextSelected);
        return created;
      }
    : undefined;

  if (isMobile) {
    return (
      <div className="w-full">
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>
            <Button
              variant="outline"
              ref={ref}
              role="combobox"
              onClick={() => setOpen((open) => !open)}
              className={cn(
                "flex w-full p-1 rounded-md border items-center justify-between border-gray-300 shadow-xs font-normal",
                open && "ring-2 ring-blue-500 border-0",
                className,
              )}
              {...props}
            >
              <div className="flex justify-between items-center w-full">
                {value.length == 0 ? (
                  <span className="text-sm text-gray-500 mx-3">
                    {placeholder}
                  </span>
                ) : (
                  <Badge className="m-1" variant="secondary">
                    {selectionSummary
                      ? selectionSummary
                      : t("options_selected", { count: value.length })}
                  </Badge>
                )}
                {open ? (
                  <ChevronUp className="h-4 mx-2 cursor-pointer text-black" />
                ) : (
                  <ChevronDown className="h-4 mx-2 cursor-pointer text-black" />
                )}
              </div>
            </Button>
          </DrawerTrigger>
          <DrawerContent className="px-0 pt-2 flex flex-col min-h-[50vh] max-h-[85vh]">
            <div className="mt-3 pb-[env(safe-area-inset-bottom)] flex flex-col flex-1 overflow-hidden">
              <ListContent
                translationBasekey={translationBasekey}
                options={mergedOptions}
                value={value}
                setSelectedValues={setSelectedValues}
                selectedValues={selectedValues}
                onValueChange={onValueChange}
                setOpen={setOpen}
                onCreate={handleCreate}
              />
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Popover open={open} onOpenChange={setOpen} modal>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            ref={ref}
            role="combobox"
            onClick={() => setOpen((open) => !open)}
            className={cn(
              "flex w-full p-1 rounded-md border items-center justify-between border-gray-300 shadow-xs font-normal",
              open && "ring-2 ring-blue-500 border-0",
              className,
            )}
            {...props}
          >
            <div className="flex justify-between items-center w-full">
              {value.length == 0 ? (
                <span className="text-sm text-gray-500 mx-3">
                  {placeholder}
                </span>
              ) : (
                <Badge className="m-1" variant="secondary">
                  {selectionSummary
                    ? selectionSummary
                    : t("options_selected", { count: value.length })}
                </Badge>
              )}
              {open ? (
                <ChevronUp className="h-4 mx-2 cursor-pointer text-black" />
              ) : (
                <ChevronDown className="h-4 mx-2 cursor-pointer text-black" />
              )}
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="p-0 w-(--radix-popover-trigger-width) max-h-[35vh] flex flex-col overflow-hidden"
          align="center"
        >
          <ListContent
            translationBasekey={translationBasekey}
            options={mergedOptions}
            value={value}
            setSelectedValues={setSelectedValues}
            selectedValues={selectedValues}
            onValueChange={onValueChange}
            setOpen={setOpen}
            onCreate={handleCreate}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

MultiSelect.displayName = "MultiSelect";
