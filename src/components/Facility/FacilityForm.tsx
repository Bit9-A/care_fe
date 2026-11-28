import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as z from "zod";

import CareIcon from "@/CAREUI/icons/CareIcon";

import Autocomplete from "@/components/ui/autocomplete";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { MultiSelect } from "@/components/ui/multi-select";
import { PhoneInput } from "@/components/ui/phone-input";
import { Textarea } from "@/components/ui/textarea";

import LocationPicker from "@/components/Common/GeoLocationPicker";
import GovtOrganizationPicker from "@/components/Organization/GovtOrganizationPicker";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import validators from "@/Utils/validators";
import {
  CLASSIFIED_FACILITY_TYPE_IDS,
  FACILITY_CLASSIFICATIONS,
  FACILITY_FEATURE_TYPES,
  FACILITY_TYPES,
  FacilityRead,
} from "@/types/facility/facility";
import facilityApi from "@/types/facility/facilityApi";
import { Organization } from "@/types/organization/organization";
import organizationApi from "@/types/organization/organizationApi";
import specialtyApi from "@/types/specialty/specialtyApi";

interface FacilityProps {
  organizationId?: string;
  facilityId?: string;
  onSubmitSuccess?: () => void;
}

function getFacilityTypeIdByText(text: string): number | undefined {
  return FACILITY_TYPES.find((type) => type.text === text)?.id;
}

// Classification (Venezuelan Tipo I-IV) applies only to certain facility
// types; mirrors CLASSIFIED_FACILITY_TYPES in the backend facility model.
function isClassifiedFacilityTypeText(text: string): boolean {
  const facilityTypeId = getFacilityTypeIdByText(text);
  return (
    facilityTypeId !== undefined &&
    CLASSIFIED_FACILITY_TYPE_IDS.has(facilityTypeId)
  );
}

export default function FacilityForm({
  organizationId,
  facilityId,
  onSubmitSuccess,
}: FacilityProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [selectedGeoOrg, setSelectedGeoOrg] = useState<Organization | null>(
    null,
  );

  const facilityFormSchema = z
    .object({
      facility_type: z.string().min(1, t("facility_type_required")),
      classification: z.string().optional(),
      name: z.string().trim().min(1, t("name_is_required")),
      description: z.string().trim().default(""),
      features: z.array(z.number()).default([]),
      specialties: z.array(z.string()).default([]),
      pincode: validators().pincode,
      geo_organization: z.string().min(1, t("field_required")),
      address: z.string().trim().min(1, t("address_is_required")),
      phone_number: validators().phoneNumber.required,
      latitude: validators()
        .coordinates.latitude.transform((val) =>
          val ? Number(val) : undefined,
        )
        .optional(),
      longitude: validators()
        .coordinates.longitude.transform((val) =>
          val ? Number(val) : undefined,
        )
        .optional(),
      is_public: z.boolean().default(false),
    })
    .superRefine((values, ctx) => {
      if (
        isClassifiedFacilityTypeText(values.facility_type) &&
        !values.classification
      ) {
        ctx.addIssue({
          code: "custom",
          message: t("facility_classification_required"),
          path: ["classification"],
        });
      }
    });

  type FacilityFormValues = z.infer<typeof facilityFormSchema>;

  const form = useForm({
    resolver: zodResolver(facilityFormSchema),
    defaultValues: {
      facility_type: "",
      classification: "",
      name: "",
      description: "",
      features: [],
      specialties: [],
      pincode: undefined,
      geo_organization: organizationId || "",
      address: "",
      phone_number: "",
      latitude: undefined,
      longitude: undefined,
      is_public: true,
    },
  });

  const watchedFacilityType = form.watch("facility_type");
  const isClassifiedFacilityType =
    isClassifiedFacilityTypeText(watchedFacilityType);

  // Clear classification when the selected facility type does not carry one
  useEffect(() => {
    if (!isClassifiedFacilityType && form.getValues("classification")) {
      form.setValue("classification", "", { shouldDirty: true });
    }
  }, [isClassifiedFacilityType, form]);

  const { data: org } = useQuery({
    queryKey: ["organization", organizationId],
    queryFn: query(organizationApi.get, {
      pathParams: { id: organizationId },
    }),
    enabled: !!organizationId,
  });

  useEffect(() => {
    if (!organizationId || facilityId) {
      return;
    }

    const govtOrg = org && org.org_type === "govt" ? org : null;
    const isValid = !!govtOrg && !govtOrg.has_children;

    setSelectedGeoOrg(govtOrg);
    form.setValue("geo_organization", isValid ? govtOrg?.id : "");
  }, [org, organizationId, facilityId, form]);

  const { mutate: createFacility, isPending } = useMutation({
    mutationFn: mutate(facilityApi.create),
    onSuccess: (_data: FacilityRead) => {
      toast.success(t("facility_added_successfully"));
      queryClient.invalidateQueries({ queryKey: ["organizationFacilities"] });
      form.reset();
      onSubmitSuccess?.();
    },
  });
  const { mutate: updateFacility, isPending: isUpdatePending } = useMutation({
    mutationFn: mutate(facilityApi.update, {
      pathParams: { facilityId: facilityId || "" },
    }),
    onSuccess: (_data: FacilityRead) => {
      toast.success(t("facility_updated_successfully"));
      queryClient.invalidateQueries({
        queryKey: ["organizationFacilities"],
      });
      queryClient.invalidateQueries({
        queryKey: ["facility"],
      });
      queryClient.invalidateQueries({
        queryKey: ["currentUser"],
      });
      form.reset();
      onSubmitSuccess?.();
    },
  });

  const { data: facilityData } = useQuery({
    queryKey: ["facility", facilityId],
    queryFn: query(facilityApi.get, {
      pathParams: { facilityId: facilityId || "" },
    }),
    enabled: !!facilityId,
  });

  const { data: specialtiesData } = useQuery({
    queryKey: ["specialties"],
    queryFn: query(specialtyApi.list, { queryParams: { limit: 200 } }),
  });

  const { mutateAsync: createSpecialty } = useMutation({
    mutationFn: mutate(specialtyApi.create),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["specialties"] });
    },
    onError: () => {
      toast.error(t("failed_to_create_specialty"));
    },
  });

  const specialtyOptions = useMemo(() => {
    const optionsById = new Map<string, { label: string; value: string }>();
    (specialtiesData?.results ?? []).forEach((specialty) => {
      optionsById.set(specialty.id, {
        label: specialty.name,
        value: specialty.id,
      });
    });
    // A facility may keep a specialty that was retired from the catalog; show
    // it so editing does not silently hide an already linked value.
    (facilityData?.specialties ?? []).forEach((specialty) => {
      if (!optionsById.has(specialty.id)) {
        optionsById.set(specialty.id, {
          label: specialty.name,
          value: specialty.id,
        });
      }
    });
    return [...optionsById.values()];
  }, [specialtiesData, facilityData]);

  const onSubmit: (data: FacilityFormValues) => void = (
    data: FacilityFormValues,
  ) => {
    const payload = {
      ...data,
      classification:
        isClassifiedFacilityType && data.classification
          ? data.classification
          : null,
      latitude: data.latitude ? String(data.latitude) : undefined,
      longitude: data.longitude ? String(data.longitude) : undefined,
      print_templates: Array.isArray(facilityData?.print_templates)
        ? facilityData.print_templates
        : [],
    };
    if (facilityId) {
      updateFacility(payload);
    } else {
      createFacility(payload);
    }
  };

  const handleFeatureChange = (value: string[]) => {
    const features = value.map((val) => Number(val));
    form.setValue("features", features, { shouldDirty: true });
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          form.setValue("latitude", position.coords.latitude, {
            shouldDirty: true,
          });
          form.setValue("longitude", position.coords.longitude, {
            shouldDirty: true,
          });
          setIsGettingLocation(false);
          toast.success(t("location_updated_successfully"));
        },
        (error) => {
          setIsGettingLocation(false);
          toast.error(t("unable_to_get_current_location") + error.message);
        },
        { timeout: 10000 },
      );
    } else {
      toast.error(t("geolocation_is_not_supported_by_this_browser"));
    }
  };

  // Update form when facility data is loaded
  useEffect(() => {
    if (facilityData) {
      setSelectedGeoOrg(facilityData.geo_organization);
      form.reset({
        facility_type: facilityData.facility_type,
        classification: facilityData.classification ?? "",
        name: facilityData.name,
        description: facilityData.description || "",
        features: facilityData.features || [],
        specialties: facilityData.specialties?.map((s) => s.id) ?? [],
        pincode: facilityData.pincode || undefined,
        geo_organization: facilityData.geo_organization.id,
        address: facilityData.address,
        phone_number: facilityData.phone_number,
        latitude: facilityData.latitude
          ? Number(facilityData.latitude)
          : undefined,
        longitude: facilityData.longitude
          ? Number(facilityData.longitude)
          : undefined,
        is_public: facilityData.is_public,
      });
    }
  }, [facilityData, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Information */}
        <div className="space-y-4 rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-medium">{t("basic_info")}</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 items-start">
            <FormField
              control={form.control}
              name="facility_type"
              render={({ field }) => (
                <FormItem className="max-w-full">
                  <FormLabel aria-required>{t("facility_type")}</FormLabel>
                  <Autocomplete
                    {...field}
                    options={FACILITY_TYPES.map((type) => ({
                      label: type.text,
                      value: type.text,
                    }))}
                    value={field.value || ""}
                    onChange={field.onChange}
                    noOptionsMessage={t("no_facilities_found")}
                    placeholder={t("select_facility_type")}
                    inputPlaceholder={t("search_facility_type")}
                    className="min-w-0"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            {isClassifiedFacilityType && (
              <FormField
                control={form.control}
                name="classification"
                render={({ field }) => (
                  <FormItem className="max-w-full">
                    <FormLabel aria-required>
                      {t("facility_classification")}
                    </FormLabel>
                    <Autocomplete
                      {...field}
                      options={FACILITY_CLASSIFICATIONS.map(
                        (classification) => ({
                          label: classification.text,
                          value: classification.text,
                        }),
                      )}
                      value={field.value || ""}
                      onChange={field.onChange}
                      noOptionsMessage={t("no_matches_found")}
                      placeholder={t("select_facility_classification")}
                      inputPlaceholder={t("search")}
                      className="min-w-0"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel aria-required>{t("facility_name")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("enter_facility_name")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("description")}</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder={t("markdown_supported")} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="features"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormLabel>{t("features")}</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={FACILITY_FEATURE_TYPES.map((obj) => ({
                        value: obj.id.toString(),
                        label: obj.name,
                        icon: obj.icon,
                      }))}
                      onValueChange={handleFeatureChange}
                      value={field.value?.map((val) => val.toString()) || []}
                      placeholder={t("select_facility_feature")}
                      selectionSummary={t("features_selected", {
                        count: field.value?.length,
                      })}
                      translationBasekey="facility_feature"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          <FormField
            control={form.control}
            name="specialties"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("specialties")}</FormLabel>
                <FormControl>
                  <MultiSelect
                    options={specialtyOptions}
                    value={field.value ?? []}
                    onValueChange={(value) =>
                      form.setValue("specialties", value, { shouldDirty: true })
                    }
                    placeholder={t("select_specialties")}
                    translationBasekey="specialties"
                    selectionSummary={t("specialties_selected", {
                      count: field.value?.length,
                    })}
                    onCreate={async (label) => {
                      const created = await createSpecialty({ name: label });
                      return { label: created.name, value: created.id };
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Contact Information */}
        <div className="space-y-4 rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-medium">{t("contact_info")}</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 items-start">
            <FormField
              control={form.control}
              name="phone_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel aria-required>{t("phone_number")}</FormLabel>
                  <FormControl>
                    <PhoneInput
                      placeholder={t("enter_phone_number")}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pincode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel aria-required>{t("pincode")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("enter_pincode")}
                      type="number"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value
                          ? Number(e.target.value)
                          : undefined;
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="geo_organization"
              control={form.control}
              render={({ field, fieldState }) => (
                <FormItem className="md:col-span-2">
                  <FormControl>
                    <div className="grid-cols-1 grid md:grid-cols-2 gap-5">
                      <GovtOrganizationPicker
                        ref={field.ref}
                        aria-invalid={!!fieldState.error}
                        required
                        value={selectedGeoOrg}
                        onChange={(organization) => {
                          setSelectedGeoOrg(organization);
                          const isValid =
                            !!organization && !organization.has_children;
                          form.setValue(
                            "geo_organization",
                            isValid ? organization.id : "",
                            { shouldDirty: true },
                          );
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel aria-required>{t("address")}</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder={t("enter_address")} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Location Information */}
        <div className="space-y-4 rounded-lg border border-gray-200 p-4">
          <LocationPicker
            latitude={form.watch("latitude")}
            longitude={form.watch("longitude")}
            onLocationSelect={(lat, lng) => {
              form.setValue("latitude", lat, { shouldDirty: true });
              form.setValue("longitude", lng, { shouldDirty: true });
            }}
            isGettingLocation={isGettingLocation}
            onGetCurrentLocation={handleGetCurrentLocation}
          />
        </div>

        {/* Visibility Settings */}
        <div className="space-y-4 rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-medium">{t("visibility_settings")}</h3>
          <FormField
            control={form.control}
            name="is_public"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-gray-200 p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-base">
                    {t("make_facility_public")}
                  </FormLabel>
                  <p className="text-sm text-gray-500">
                    {t("make_facility_public_description")}
                  </p>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          variant="primary"
          disabled={
            facilityId ? isUpdatePending || !form.formState.isDirty : isPending
          }
        >
          {facilityId ? (
            isUpdatePending ? (
              <>
                <CareIcon
                  icon="l-spinner"
                  className="mr-2 size-4 animate-spin"
                />
                {t("updating_facility")}
              </>
            ) : (
              t("update_facility")
            )
          ) : isPending ? (
            <>
              <CareIcon icon="l-spinner" className="mr-2 size-4 animate-spin" />
              {t("creating_facility")}
            </>
          ) : (
            t("create_facility")
          )}
        </Button>
      </form>
    </Form>
  );
}
