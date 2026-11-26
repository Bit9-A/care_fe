import careConfig from "@careConfig";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Stethoscope } from "lucide-react";
import { navigate } from "raviger";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Trans, useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as z from "zod";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { TagSelectorPopover } from "@/components/Tags/TagAssignmentSheet";

import { useShortcutSubContext } from "@/context/ShortcutContext";
import FacilityOrganizationSelector from "@/pages/Facility/settings/organizations/components/FacilityOrganizationSelector";
import {
  ENCOUNTER_CLASS_ICONS,
  ENCOUNTER_PRIORITY,
  EncounterCreate,
  EncounterRead,
  EncounterStatus,
} from "@/types/emr/encounter/encounter";
import encounterApi from "@/types/emr/encounter/encounterApi";
import { TagConfig, TagResource } from "@/types/emr/tagConfig/tagConfig";
import useTagConfigs from "@/types/emr/tagConfig/useTagConfig";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import mutate from "@/Utils/request/mutate";

interface Props {
  patientId: string;
  facilityId: string;
  patientName: string;
  appointment?: string;
  trigger?: React.ReactNode;
  onSuccess?: (encounter: EncounterRead) => void;
  disableRedirectOnSuccess?: boolean;
  defaultOpen?: boolean;
  defaultStatus?:
    | EncounterStatus.PLANNED
    | EncounterStatus.IN_PROGRESS
    | EncounterStatus.ON_HOLD;
}

export default function CreateEncounterForm({
  patientId,
  facilityId,
  patientName,
  appointment,
  trigger,
  onSuccess,
  disableRedirectOnSuccess = false,
  defaultOpen = false,
  defaultStatus = EncounterStatus.PLANNED,
}: Props) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  useShortcutSubContext();

  const encounterFormSchema = z
    .object({
      status: z.enum([
        EncounterStatus.PLANNED,
        EncounterStatus.IN_PROGRESS,
        EncounterStatus.ON_HOLD,
      ] as const),
      encounter_class: z.enum(careConfig.encounterClasses),
      priority: z.enum(ENCOUNTER_PRIORITY),
      organizations: z.array(z.string()).min(1, {
        message: t("at_least_one_department_is_required"),
      }),
      start_date: z.string(),
      tags: z.array(z.string()),
    })
    .refine(
      (data) => {
        if (
          data.status !== EncounterStatus.PLANNED &&
          new Date(data.start_date) > new Date()
        ) {
          return false;
        }
        return true;
      },
      {
        message: t("encounter_future_date_restriction"),
        path: ["start_date"],
      },
    );

  const form = useForm({
    resolver: zodResolver(encounterFormSchema),
    defaultValues: {
      status: defaultStatus,
      encounter_class: careConfig.defaultEncounterType,
      priority: "routine",
      organizations: [],
      start_date: new Date().toISOString(),
      tags: [],
    },
  });

  const selectedStatus = form.watch("status");

  const tagIds = form.watch("tags");
  const tagQueries = useTagConfigs({ ids: tagIds, facilityId });
  const selectedTags = tagQueries
    .map((query) => query.data)
    .filter(Boolean) as TagConfig[];

  const { mutate: createEncounter, isPending } = useMutation({
    mutationFn: mutate(encounterApi.create),
    onSuccess: (data: EncounterRead) => {
      toast.success(t("encounter_created"));
      setIsOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["encounters", patientId] });
      onSuccess?.(data);
      if (!disableRedirectOnSuccess) {
        navigate(
          `/facility/${facilityId}/patient/${patientId}/encounter/${data.id}/updates`,
        );
      }
    },
  });

  function onSubmit(data: z.infer<typeof encounterFormSchema>) {
    const encounterRequest: EncounterCreate = {
      ...data,
      patient: patientId,
      facility: facilityId,
      period: {
        start: data.start_date,
      },
      tags: data.tags,
      appointment: appointment,
    };

    createEncounter(encounterRequest);
  }

  return (
    <Sheet
      open={isOpen}
      onOpenChange={() => {
        setIsOpen(!isOpen);
        form.reset();
      }}
    >
      <SheetTrigger asChild>
        {trigger || (
          <Button
            variant="secondary"
            className="h-14 w-full justify-start text-lg"
          >
            <Stethoscope className="mr-4 size-6" />
            {t("create_encounter")}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-lg lg:max-w-2xl">
        <SheetHeader className="space-y-1 border-b border-slate-100 px-5 py-4">
          <SheetTitle className="font-display text-lg font-bold tracking-tight text-slate-900">
            {t("initiate_encounter")}
          </SheetTitle>
          <SheetDescription>
            <Trans
              i18nKey="begin_clinical_encounter"
              values={{ patientName }}
              components={{
                strong: <strong className="font-semibold text-gray-950" />,
              }}
            />
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => {
                  const date = field.value ? new Date(field.value) : new Date();
                  return (
                    <FormItem>
                      <FormLabel>{t("date_and_time")}</FormLabel>
                      <div className="flex gap-2">
                        <DatePicker
                          date={date}
                          disabled={(date) =>
                            selectedStatus !== EncounterStatus.PLANNED &&
                            date > new Date()
                          }
                          onChange={(newDate) => {
                            if (!newDate) return;
                            const updatedDate = new Date(newDate);
                            updatedDate.setHours(date.getHours());
                            updatedDate.setMinutes(date.getMinutes());
                            field.onChange(updatedDate.toISOString());
                          }}
                          className="h-9"
                        />
                        <Input
                          type="time"
                          className="w-28 shrink-0 border-slate-200 text-sm shadow-xs"
                          value={date.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          })}
                          onChange={(e) => {
                            const [hours, minutes] = e.target.value
                              .split(":")
                              .map(Number);
                            if (isNaN(hours) || isNaN(minutes)) return;
                            const updatedDate = new Date(date);
                            updatedDate.setHours(hours);
                            updatedDate.setMinutes(minutes);
                            field.onChange(updatedDate.toISOString());
                          }}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <FormField
                control={form.control}
                name="encounter_class"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("type_of_encounter")}</FormLabel>
                    <div className="grid grid-cols-2 gap-2">
                      {careConfig.encounterClasses.map((value) => {
                        const Icon = ENCOUNTER_CLASS_ICONS[value];
                        return (
                          <Button
                            key={value}
                            type="button"
                            className={cn(
                              "h-auto w-full items-start justify-start gap-3 whitespace-normal rounded-xl border-slate-200 px-3 py-3 text-left transition-colors hover:border-[#00a3ff]/50 hover:bg-[#00a3ff]/5",
                              field.value === value &&
                                "border-[#00a3ff] bg-[#00a3ff]/10 ring-1 ring-[#00a3ff] text-[#0076be]",
                            )}
                            variant="outline"
                            onClick={() => field.onChange(value)}
                          >
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                              <Icon className="size-5" />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-[13px] font-semibold leading-tight text-slate-900 sm:text-sm">
                                {t(`encounter_class__${value}`)}
                              </span>
                              <span className="mt-0.5 hidden text-xs leading-snug text-slate-500 sm:block">
                                {t(`encounter_class_description__${value}`)}
                              </span>
                            </span>
                          </Button>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("status")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger ref={field.ref}>
                          <SelectValue placeholder={t("select_status")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={EncounterStatus.IN_PROGRESS}>
                          {t("in_progress")}
                        </SelectItem>
                        <SelectItem value={EncounterStatus.PLANNED}>
                          {t("planned")}
                        </SelectItem>
                        <SelectItem value={EncounterStatus.ON_HOLD}>
                          {t("on_hold")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("priority")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger ref={field.ref}>
                          <SelectValue placeholder={t("select_priority")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ENCOUNTER_PRIORITY.map((priority) => (
                          <SelectItem key={priority} value={priority}>
                            {t(`encounter_priority__${priority}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("tags", { count: 2 })}</FormLabel>
                    <FormControl className="mt-0">
                      <TagSelectorPopover
                        selected={selectedTags}
                        onChange={(tags) => {
                          field.onChange(tags.map((tag) => tag.id));
                        }}
                        resource={TagResource.ENCOUNTER}
                        facilityId={facilityId}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="organizations"
                render={({ field }) => (
                  <FormItem>
                    <FacilityOrganizationSelector
                      facilityId={facilityId}
                      value={field.value}
                      onChange={(value) => {
                        if (value === null) {
                          form.setValue("organizations", []);
                        } else {
                          form.setValue("organizations", value);
                        }
                      }}
                      favoriteList="encounter_departments"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-100 bg-white px-5 py-3 shadow-[0_-10px_20px_-16px_rgba(15,23,42,0.35)] sm:flex-row sm:justify-end">
              <Button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  form.reset();
                }}
                variant="outline"
                className="h-11 w-full sm:h-9 sm:w-auto"
              >
                {t("cancel")}
                <ShortcutBadge actionId="cancel-action" />
              </Button>
              <Button
                type="submit"
                className="h-11 w-full sm:h-9 sm:w-auto"
                disabled={isPending || !form.watch("organizations").length}
              >
                {isPending ? t("creating") : t("create_encounter")}
                <ShortcutBadge actionId="submit-action" className="bg-white" />
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
